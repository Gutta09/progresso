"""Two-way sync helpers between progresso tasks and GitHub issues.

progresso -> GitHub: moving a linked task into a board's "done" column closes
its issue; moving it back out reopens the issue.

GitHub -> progresso: reconcile_team() pulls current issue states and moves
linked tasks accordingly (closed issue -> done column, reopened -> first
column). This runs on demand via POST /github/sync and from the webhook.
"""
import logging

import models
from github_client import GitHubClient
from github_crypto import decrypt_token

logger = logging.getLogger("progresso.github")

_DONE_NAMES = {"done", "complete", "completed", "closed", "shipped", "finished"}


def get_client(team: models.Team):
    """Return a GitHubClient for the team, or None if GitHub isn't connected."""
    if not team or not team.github_repo or not team.github_token_encrypted:
        return None
    token = decrypt_token(team.github_token_encrypted)
    return GitHubClient(token, team.github_repo)


def _board_columns(db, board_id):
    return (
        db.query(models.BoardColumn)
        .filter(models.BoardColumn.board_id == board_id)
        .order_by(models.BoardColumn.position_index)
        .all()
    )


def done_column(db, board_id):
    cols = _board_columns(db, board_id)
    if not cols:
        return None
    for c in cols:
        if c.col_name.strip().lower() in _DONE_NAMES:
            return c
    return cols[-1]  # fall back to the last (right-most) column


def first_column(db, board_id):
    cols = _board_columns(db, board_id)
    return cols[0] if cols else None


def _board_id_for_task(db, task: models.Task):
    col = db.query(models.BoardColumn).filter(
        models.BoardColumn.column_id == task.column_id
    ).first()
    return col.board_id if col else None


def on_task_moved(db, task: models.Task, new_col: models.BoardColumn, team: models.Team):
    """progresso -> GitHub. Best-effort: never let a GitHub failure block a move."""
    if not task.github_issue_number:
        return
    client = get_client(team)
    if not client:
        return

    done = done_column(db, new_col.board_id)
    is_now_done = done is not None and new_col.column_id == done.column_id

    try:
        if is_now_done and task.github_issue_state != "closed":
            issue = client.set_issue_state(task.github_issue_number, "closed")
            task.github_issue_state = issue["state"]
        elif not is_now_done and task.github_issue_state == "closed":
            issue = client.set_issue_state(task.github_issue_number, "open")
            task.github_issue_state = issue["state"]
        db.commit()
    except Exception as exc:  # noqa: BLE001 - sync must not break task moves
        db.rollback()
        logger.warning("GitHub sync on move failed for task %s: %s", task.task_id, exc)


def reconcile_team(db, team: models.Team) -> dict:
    """GitHub -> progresso. Returns {checked, updated, details}."""
    client = get_client(team)
    if not client:
        return {"checked": 0, "updated": 0, "details": ["GitHub is not connected."]}

    linked = (
        db.query(models.Task)
        .join(models.BoardColumn, models.Task.column_id == models.BoardColumn.column_id)
        .join(models.Board, models.BoardColumn.board_id == models.Board.board_id)
        .filter(models.Board.team_id == team.team_id)
        .filter(models.Task.github_issue_number.isnot(None))
        .all()
    )

    # One bulk fetch, then map by issue number.
    issues = {i["number"]: i for i in client.list_issues(state="all", limit=100)}

    checked = 0
    updated = 0
    details = []
    for task in linked:
        checked += 1
        issue = issues.get(task.github_issue_number)
        if issue is None:
            try:
                issue = client.get_issue(task.github_issue_number)
            except Exception:  # noqa: BLE001
                continue

        state = issue["state"]
        board_id = _board_id_for_task(db, task)
        done = done_column(db, board_id) if board_id else None

        task.github_issue_state = state
        task.github_issue_url = issue.get("html_url")

        if state == "closed" and done and task.column_id != done.column_id:
            task.column_id = done.column_id
            updated += 1
            details.append(f"#{task.github_issue_number} closed -> '{task.title}' moved to {done.col_name}")
        elif state == "open" and done and task.column_id == done.column_id:
            first = first_column(db, board_id)
            if first and first.column_id != done.column_id:
                task.column_id = first.column_id
                updated += 1
                details.append(f"#{task.github_issue_number} reopened -> '{task.title}' moved to {first.col_name}")

    db.commit()
    return {"checked": checked, "updated": updated, "details": details}
