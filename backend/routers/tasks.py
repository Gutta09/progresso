from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models
import schemas
import auth
from datetime import datetime
from activity_helper import log_event
from permissions import check_board_access
import github_sync

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

    # ── Permission check: only admin can create tasks on team boards ──
    board = db.query(models.Board).filter(
        models.Board.board_id == column.board_id
    ).first()
    check_board_access(board, current_user)
    if board.team_id and current_user.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=403,
            detail="Only team admins can create tasks on team boards"
        )

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

    log_event(db, column.board_id, current_user.user_id, "task_created",
              f"{current_user.username} created task '{new_task.title}'")

    return new_task

# ─── My Tasks ───────────────────────────────────────
@router.get("/my-tasks", response_model=list[schemas.MyTaskResponse])
def get_my_tasks(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    tasks = (
        db.query(models.Task)
        .options(
            joinedload(models.Task.column).joinedload(models.BoardColumn.board),
            joinedload(models.Task.labels),
            joinedload(models.Task.comments),
        )
        .filter(models.Task.assigned_to == current_user.user_id)
        .all()
    )

    result = []
    for task in tasks:
        col = task.column
        board = col.board if col else None

        result.append({
            "task_id": task.task_id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "due_date": task.due_date,
            "column_id": task.column_id,
            "assigned_to": task.assigned_to,
            "labels": task.labels,
            "comments": task.comments,
            "column_name": col.col_name if col else "Unknown",
            "board_id": board.board_id if board else None,
            "board_name": board.board_name if board else "Unknown",
        })
    return result

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

    column = db.query(models.BoardColumn).filter(models.BoardColumn.column_id == task.column_id).first()
    board = db.query(models.Board).filter(models.Board.board_id == column.board_id).first() if column else None
    check_board_access(board, current_user)

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

    column = db.query(models.BoardColumn).filter(models.BoardColumn.column_id == task.column_id).first()
    board = db.query(models.Board).filter(models.Board.board_id == column.board_id).first() if column else None
    check_board_access(board, current_user)

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

    new_col = db.query(models.BoardColumn).filter(
        models.BoardColumn.column_id == move.column_id
    ).first()
    if not new_col:
        raise HTTPException(status_code=404, detail="Target column not found")

    board = db.query(models.Board).filter(
        models.Board.board_id == new_col.board_id
    ).first()
    check_board_access(board, current_user)

    if board.team_id:
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

    log_event(db, new_col.board_id, current_user.user_id, "task_moved",
              f"{current_user.username} moved '{task.title}' to '{new_col.col_name}'")

    # progresso -> GitHub: close/reopen a linked issue based on the new column.
    if board.team_id and task.github_issue_number:
        team = db.query(models.Team).filter(models.Team.team_id == board.team_id).first()
        github_sync.on_task_moved(db, task, new_col, team)
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

    col = db.query(models.BoardColumn).filter(
        models.BoardColumn.column_id == task.column_id
    ).first()

    # ── Permission check: only admin can delete tasks on team boards ──
    board = db.query(models.Board).filter(
        models.Board.board_id == col.board_id
    ).first() if col else None
    check_board_access(board, current_user)
    if board.team_id and current_user.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=403,
            detail="Only team admins can delete tasks on team boards"
        )

    title = task.title
    board_id = col.board_id if col else None

    db.delete(task)
    db.commit()

    if board_id:
        log_event(db, board_id, current_user.user_id, "task_deleted",
                  f"{current_user.username} deleted task '{title}'")

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

    column = db.query(models.BoardColumn).filter(models.BoardColumn.column_id == task.column_id).first()
    board = db.query(models.Board).filter(models.Board.board_id == column.board_id).first() if column else None
    check_board_access(board, current_user)

    new_comment = models.Comment(
        text_content=comment.text_content,
        timestamp=datetime.utcnow(),
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