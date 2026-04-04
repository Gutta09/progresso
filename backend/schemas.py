from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date
from enum import Enum

class RoleEnum(str, Enum):
    admin = "admin"
    member = "member"

class PriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

# ─── Team ───────────────────────────────────────────
class TeamCreate(BaseModel):
    team_name: str

class TeamResponse(BaseModel):
    team_id: int
    team_name: str
    invite_code: str

    class Config:
        from_attributes = True

class JoinTeamRequest(BaseModel):
    invite_code: str        

# ─── User ───────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    team_id: Optional[int] = None

class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: RoleEnum
    team_id: Optional[int] = None

    class Config:
        from_attributes = True

# ─── Auth ───────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ─── Label ──────────────────────────────────────────
class LabelCreate(BaseModel):
    name: Optional[str] = None
    color_hex: str

class LabelResponse(BaseModel):
    label_id: int
    name: Optional[str] = None
    color_hex: str

    class Config:
        from_attributes = True

# ─── Comment ────────────────────────────────────────
class CommentCreate(BaseModel):
    text_content: str
    task_id: int

class CommentResponse(BaseModel):
    comment_id: int
    text_content: str
    timestamp: str
    task_id: int
    user_id: int

    class Config:
        from_attributes = True

# ─── Task ───────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: PriorityEnum = PriorityEnum.medium
    due_date: Optional[date] = None
    column_id: int
    assigned_to: Optional[int] = None

class TaskMove(BaseModel):
    column_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    due_date: Optional[date] = None
    assigned_to: Optional[int] = None

class TaskResponse(BaseModel):
    task_id: int
    title: str
    description: Optional[str] = None
    priority: PriorityEnum
    due_date: Optional[date] = None
    column_id: int
    assigned_to: Optional[int] = None
    labels: List[LabelResponse] = []
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True

class MyTaskResponse(BaseModel):
    task_id: int
    title: str
    description: Optional[str] = None
    priority: PriorityEnum
    due_date: Optional[date] = None
    column_id: int
    assigned_to: Optional[int] = None
    labels: List[LabelResponse] = []
    comments: List[CommentResponse] = []
    column_name: str
    board_id: Optional[int] = None
    board_name: str

    class Config:
        from_attributes = True

# ─── Board Column ────────────────────────────────────
class BoardColumnCreate(BaseModel):
    col_name: str
    position_index: int
    board_id: int

class BoardColumnResponse(BaseModel):
    column_id: int
    col_name: str
    position_index: int
    board_id: int
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True

# ─── Board ──────────────────────────────────────────
class BoardCreate(BaseModel):
    board_name: str
    team_id: Optional[int] = None

class BoardResponse(BaseModel):
    board_id: int
    board_name: str
    created_date: Optional[date] = None
    team_id: Optional[int] = None
    owner_id: Optional[int] = None
    columns: List[BoardColumnResponse] = []

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True        