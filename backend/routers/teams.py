from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
import random
import string

router = APIRouter()

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ─── Create Team ────────────────────────────────────
@router.post("/create", response_model=schemas.TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team: schemas.TeamCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.team_id:
        raise HTTPException(status_code=400, detail="You are already part of a team")

    invite_code = generate_invite_code()
    while db.query(models.Team).filter(models.Team.invite_code == invite_code).first():
        invite_code = generate_invite_code()

    new_team = models.Team(
        team_name=team.team_name,
        invite_code=invite_code
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    current_user.team_id = new_team.team_id
    current_user.role = models.RoleEnum.admin
    db.commit()
    db.refresh(current_user)

    return new_team

# ─── Join Team ──────────────────────────────────────
@router.post("/join", response_model=schemas.TeamResponse)
def join_team(
    payload: schemas.JoinTeamRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.team_id:
        raise HTTPException(status_code=400, detail="You are already part of a team")

    team = db.query(models.Team).filter(
        models.Team.invite_code == payload.invite_code.upper()
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    current_user.team_id = team.team_id
    current_user.role = models.RoleEnum.member
    db.commit()

    return team

# ─── Get My Team ────────────────────────────────────
@router.get("/me", response_model=schemas.TeamResponse)
def get_my_team(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.team_id:
        raise HTTPException(status_code=404, detail="You are not part of a team")
    team = db.query(models.Team).filter(
        models.Team.team_id == current_user.team_id
    ).first()
    return team

@router.get("/members", response_model=list[schemas.UserResponse])
def get_team_members(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.team_id:
        raise HTTPException(status_code=404, detail="You are not part of a team")
    members = db.query(models.User).filter(
        models.User.team_id == current_user.team_id
    ).all()
    return members