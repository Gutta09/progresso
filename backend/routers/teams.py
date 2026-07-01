from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
import secrets
import string

router = APIRouter()

def generate_invite_code():
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

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

@router.put("/rename", response_model=schemas.TeamResponse)
def rename_team(
    payload: schemas.TeamCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can rename the team")
    team = db.query(models.Team).filter(
        models.Team.team_id == current_user.team_id
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    team.team_name = payload.team_name
    db.commit()
    db.refresh(team)
    return team

@router.delete("/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admin can remove members")
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
    member = db.query(models.User).filter(
        models.User.user_id == user_id,
        models.User.team_id == current_user.team_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.team_id = None
    member.role = models.RoleEnum.member
    db.commit()