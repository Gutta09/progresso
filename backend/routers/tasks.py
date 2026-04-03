from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from datetime import datetime

router = APIRouter()

# ─── Create Task ────────────────────────────────────
@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not task.title.strip():
        raise HTTPException(status_code=400, detail="Task title cannot be empty")

    column = db.query(models.BoardColumn).filter(
        models.BoardColumn.column_id == task.column_id
    ).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    new_task = models.Task(
        title=task.title.strip(),
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        column_id=task.column_id,
        assigned_to=task.assigned_to
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# ─── Get Single Task ────────────────────────────────
@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# ─── Update Task ────────────────────────────────────
@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    updates: schemas.TaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if updates.title is not None:
        if not updates.title.strip():
            raise HTTPException(status_code=400, detail="Task title cannot be empty")
        task.title = updates.title.strip()
    if updates.description is not None:
        task.description = updates.description
    if updates.priority is not None:
        task.priority = updates.priority
    if updates.due_date is not None:
        task.due_date = updates.due_date
    if updates.assigned_to is not None:
        task.assigned_to = updates.assigned_to

    db.commit()
    db.refresh(task)
    return task

# ─── Move Task ──────────────────────────────────────
@router.put("/{task_id}/move", response_model=schemas.TaskResponse)
def move_task(
    task_id: int,
    move: schemas.TaskMove,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    column = db.query(models.BoardColumn).filter(
        models.BoardColumn.column_id == move.column_id
    ).first()
    if not column:
        raise HTTPException(status_code=404, detail="Target column not found")

    board = db.query(models.Board).filter(
        models.Board.board_id == column.board_id
    ).first()

    if board and board.team_id:
        is_admin = current_user.role == models.RoleEnum.admin
        is_assigned = task.assigned_to == current_user.user_id
        if not is_admin and not is_assigned:
            raise HTTPException(
                status_code=403,
                detail="Only the assigned member or admin can move this task"
            )

    task.column_id = move.column_id
    db.commit()
    db.refresh(task)
    return task
# ─── Delete Task ────────────────────────────────────
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()

# ─── Add Comment ────────────────────────────────────
@router.post("/{task_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    task_id: int,
    comment: schemas.CommentCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(models.Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_comment = models.Comment(
        text_content=comment.text_content,
        timestamp=datetime.utcnow().isoformat(),
        task_id=task_id,
        user_id=current_user.user_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

# ─── Delete Comment ─────────────────────────────────
@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    comment = db.query(models.Comment).filter(models.Comment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    db.delete(comment)
    db.commit()