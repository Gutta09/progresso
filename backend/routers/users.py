from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from datetime import timedelta

router = APIRouter()

# ─── Register ───────────────────────────────────────
@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=auth.hash_password(user.password),
        team_id=user.team_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# ─── Login ──────────────────────────────────────────
@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = auth.create_access_token(
        data={"sub": str(user.user_id)},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ─── Get current user ───────────────────────────────
@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ─── Get all users in same team ─────────────────────
@router.get("/team", response_model=list[schemas.UserResponse])
def get_team_members(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.team_id:
        raise HTTPException(status_code=404, detail="You are not part of a team")
    members = db.query(models.User).filter(models.User.team_id == current_user.team_id).all()
    return members