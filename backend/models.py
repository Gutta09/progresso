from sqlalchemy import Column, Integer, String, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from sqlalchemy import DateTime
import enum

class RoleEnum(enum.Enum):
    admin = "admin"
    member = "member"

class PriorityEnum(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Team(Base):
    __tablename__ = "teams"

    team_id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, nullable=False)

    members = relationship("User", back_populates="team")
    boards = relationship("Board", back_populates="team")


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.member)
    team_id = Column(Integer, ForeignKey("teams.team_id"), nullable=True)

    team = relationship("Team", back_populates="members")
    comments = relationship("Comment", back_populates="user")
    assigned_tasks = relationship("Task", back_populates="assigned_user")


class Board(Base):
    __tablename__ = "boards"

    board_id = Column(Integer, primary_key=True, index=True)
    board_name = Column(String, nullable=False)
    created_date = Column(Date, nullable=True)
    team_id = Column(Integer, ForeignKey("teams.team_id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    team = relationship("Team", back_populates="boards")
    columns = relationship("BoardColumn", back_populates="board", cascade="all, delete")


class BoardColumn(Base):
    __tablename__ = "board_columns"

    column_id = Column(Integer, primary_key=True, index=True)
    col_name = Column(String, nullable=False)
    position_index = Column(Integer, nullable=False)
    board_id = Column(Integer, ForeignKey("boards.board_id"), nullable=False)

    board = relationship("Board", back_populates="columns")
    tasks = relationship("Task", back_populates="column", cascade="all, delete")


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.medium)
    due_date = Column(Date, nullable=True)
    column_id = Column(Integer, ForeignKey("board_columns.column_id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    column = relationship("BoardColumn", back_populates="tasks")
    assigned_user = relationship("User", back_populates="assigned_tasks")
    comments = relationship("Comment", back_populates="task", cascade="all, delete")
    labels = relationship("Label", secondary="task_labels", back_populates="tasks")


class Label(Base):
    __tablename__ = "labels"

    label_id = Column(Integer, primary_key=True, index=True)
    color_hex = Column(String, nullable=False)
    name = Column(String, nullable=True)

    tasks = relationship("Task", secondary="task_labels", back_populates="labels")


class TaskLabel(Base):
    __tablename__ = "task_labels"

    task_id = Column(Integer, ForeignKey("tasks.task_id"), primary_key=True)
    label_id = Column(Integer, ForeignKey("labels.label_id"), primary_key=True)


class Comment(Base):
    __tablename__ = "comments"

    comment_id = Column(Integer, primary_key=True, index=True)
    text_content = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.task_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    task = relationship("Task", back_populates="comments")
    user = relationship("User", back_populates="comments")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String)        # e.g. "task_created"
    description = Column(String)       # e.g. "ayush created task 'Fix login bug'"
    board_id = Column(Integer, ForeignKey("boards.board_id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
