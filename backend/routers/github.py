import hashlib
import hmac
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

import auth
import github_sync
import models
import schemas
from database import get_db
from github_client import GitHubClient
from github_crypto import encrypt_token
from permissions import check_board_access

router = APIRouter()


# ─── Helpers ────────────────────────────────────────
def _require_team(current_user: models.User, db: Session) -> models.Team:
    if not current_user.team_id:
        raise HTTPException(status_code=404, detail="You are not part of a team")
    team = db.query(models.Team).filter(models.Team.team_id == current_user.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


def _require_admin(current_user: models.User):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only the team admin can manage the GitHub connection")


def _normalize_repo(raw: str) -> str:
    r = raw.strip()
    for prefix in ("https://github.com/", "http://github.com/", "github.com/", "git@github.com:"):
        if r.startswith(prefix):
            r = r[len(prefix):]
            break
    r = r.strip("/")
    if r.endswith(".git"):
        r = r[:-4]
    parts = [p for p in r.split("/") if p]
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Repository must be in 'owner/name' form")
    return f"{parts[0]}/{parts[1]}"


def _load_task_for_team(task_id: int, team: models.Team, current_user: models.User, db: Session):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    column = db.query(models.BoardColumn).filter(
        models.BoardColumn.column_id == task.column_id
    ).first()
    board = db.query(models.Board).filter(
        models.Board.board_id == column.board_id
    ).first() if column else None
    check_board_access(board, current_user)
    return task


# ─── Connection management ──────────────────────────
@router.get("/status", response_model=schemas.GitHubStatus)
def github_status(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    team = _require_team(current_user, db)
    if not team.github_repo or not team.github_token_encrypted:
        return schemas.GitHubStatus(connected=False)

    connector = None
    if team.github_connected_by:
        u = db.query(models.User).filter(models.User.user_id == team.github_connected_by).first()
        connector = u.username if u else None

    meta = None
    client = github_sync.get_client(team)
    if client:
        try:
            meta = schemas.GitHubRepoMeta(**client.get_repo())
        except HTTPException:
            meta = None  # token may have been revoked; still report as connected

    is_admin = current_user.role == models.RoleEnum.admin
    return schemas.GitHubStatus(
        connected=True,
        repo=team.github_repo,
        connected_by=connector,
        connected_at=team.github_connected_at,
        webhook_secret=team.github_webhook_secret if is_admin else None,
        meta=meta,
    )


@router.post("/connect", response_model=schemas.GitHubStatus)
def connect_github(
    payload: schemas.GitHubConnect,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    team = _require_team(current_user, db)
    _require_admin(current_user)

    repo = _normalize_repo(payload.repo)
    token = payload.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="A GitHub token is required")

    # Validate the token against the repo before persisting anything.
    meta = GitHubClient(token, repo).get_repo()

    team.github_repo = repo
    team.github_token_encrypted = encrypt_token(token)
    team.github_connected_by = current_user.user_id
    team.github_connected_at = datetime.utcnow()
    if not team.github_webhook_secret:
        team.github_webhook_secret = secrets.token_hex(20)
    db.commit()
    db.refresh(team)

    return schemas.GitHubStatus(
        connected=True,
        repo=team.github_repo,
        connected_by=current_user.username,
        connected_at=team.github_connected_at,
        webhook_secret=team.github_webhook_secret,
        meta=schemas.GitHubRepoMeta(**meta),
    )


@router.delete("/disconnect", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_github(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    team = _require_team(current_user, db)
    _require_admin(current_user)
    team.github_repo = None
    team.github_token_encrypted = None
    team.github_connected_by = None
    team.github_connected_at = None
    team.github_webhook_secret = None
    db.commit()


# ─── Read-only activity ─────────────────────────────
def _client_or_404(current_user, db):
    team = _require_team(current_user, db)
    client = github_sync.get_client(team)
    if not client:
        raise HTTPException(status_code=404, detail="No GitHub repository is connected")
    return client


@router.get("/commits")
def list_commits(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return _client_or_404(current_user, db).list_commits()


@router.get("/issues")
def list_issues(
    state: str = "open",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return _client_or_404(current_user, db).list_issues(state=state)


@router.get("/pulls")
def list_pulls(
    state: str = "open",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return _client_or_404(current_user, db).list_pulls(state=state)


# ─── Task <-> issue linking ─────────────────────────
@router.post("/tasks/{task_id}/link", response_model=schemas.TaskResponse)
def link_task_to_issue(
    task_id: int,
    payload: schemas.TaskLinkIssue,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    team = _require_team(current_user, db)
    client = github_sync.get_client(team)
    if not client:
        raise HTTPException(status_code=404, detail="No GitHub repository is connected")
    task = _load_task_for_team(task_id, team, current_user, db)

    issue = client.get_issue(payload.issue_number)  # 404s if it doesn't exist
    task.github_issue_number = issue["number"]
    task.github_issue_url = issue["html_url"]
    task.github_issue_state = issue["state"]
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}/link", response_model=schemas.TaskResponse)
def unlink_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    team = _require_team(current_user, db)
    task = _load_task_for_team(task_id, team, current_user, db)
    task.github_issue_number = None
    task.github_issue_url = None
    task.github_issue_state = None
    db.commit()
    db.refresh(task)
    return task


@router.post("/tasks/{task_id}/create-issue", response_model=schemas.TaskResponse)
def create_issue_from_task(
    task_id: int,
    payload: schemas.CreateIssueFromTask,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    team = _require_team(current_user, db)
    client = github_sync.get_client(team)
    if not client:
        raise HTTPException(status_code=404, detail="No GitHub repository is connected")
    task = _load_task_for_team(task_id, team, current_user, db)

    title = (payload.title or task.title).strip()
    body = payload.body if payload.body is not None else (task.description or "")
    body = f"{body}\n\n_Created from progresso task #{task.task_id}._".strip()

    issue = client.create_issue(title, body)
    task.github_issue_number = issue["number"]
    task.github_issue_url = issue["html_url"]
    task.github_issue_state = issue["state"]
    db.commit()
    db.refresh(task)
    return task


# ─── Sync ───────────────────────────────────────────
@router.post("/sync", response_model=schemas.SyncResult)
def sync_github(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    team = _require_team(current_user, db)
    result = github_sync.reconcile_team(db, team)
    return schemas.SyncResult(**result)


# ─── Webhook (production real-time sync) ─────────────
@router.post("/webhook")
async def github_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    payload = await request.json()

    repo_full_name = (payload.get("repository") or {}).get("full_name")
    if not repo_full_name:
        raise HTTPException(status_code=400, detail="Missing repository in payload")

    team = db.query(models.Team).filter(models.Team.github_repo == repo_full_name).first()
    if not team or not team.github_webhook_secret:
        raise HTTPException(status_code=404, detail="No team is connected to this repository")

    # Verify the signature GitHub sends with the shared secret.
    signature = request.headers.get("X-Hub-Signature-256", "")
    expected = "sha256=" + hmac.new(
        team.github_webhook_secret.encode(), body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Only issue open/close events affect linked tasks; reconcile the team.
    if payload.get("action") in {"closed", "reopened", "opened", "edited"}:
        result = github_sync.reconcile_team(db, team)
        return {"ok": True, **result}
    return {"ok": True, "ignored": payload.get("action")}
