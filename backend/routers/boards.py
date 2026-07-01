from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from datetime import date
from activity_helper import log_event
from permissions import check_board_access

router = APIRouter()

def require_admin(current_user: models.User):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team admins can perform this action"
        )

@router.post("/", response_model=schemas.BoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(
    board: schemas.BoardCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if board.team_id and current_user.role != models.RoleEnum.admin:
        raise HTTPException(
            status_code=403,
            detail="Only team admins can create team boards"
        )

    new_board = models.Board(
        board_name=board.board_name,
        team_id=board.team_id,
        owner_id=current_user.user_id,
        created_date=date.today()
    )
    db.add(new_board)
    db.commit()
    db.refresh(new_board)

    default_columns = ["To Do", "In Progress", "Done"]
    for index, name in enumerate(default_columns):
        col = models.BoardColumn(
            col_name=name,
            position_index=index,
            board_id=new_board.board_id
        )
        db.add(col)
    db.commit()
    db.refresh(new_board)

    if new_board.team_id:
        log_event(db, new_board.board_id, current_user.user_id, "board_created",
                  f"{current_user.username} created board '{new_board.board_name}'")

    return new_board

@router.get("/", response_model=list[schemas.BoardResponse])
def get_boards(
    workspace: str = "team",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if workspace == "individual":
        boards = db.query(models.Board).filter(
            models.Board.team_id == None,
            models.Board.owner_id == current_user.user_id
        ).all()
    elif workspace == "team" and current_user.team_id:
        boards = db.query(models.Board).filter(
            models.Board.team_id == current_user.team_id
        ).all()
    else:
        boards = db.query(models.Board).filter(
            models.Board.team_id == None,
            models.Board.owner_id == current_user.user_id
        ).all()
    return boards

@router.get("/{board_id}", response_model=schemas.BoardResponse)
def get_board(
    board_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    board = db.query(models.Board).filter(models.Board.board_id == board_id).first()
    check_board_access(board, current_user)
    return board

@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    board = db.query(models.Board).filter(models.Board.board_id == board_id).first()
    check_board_access(board, current_user)
    if board.team_id:
        require_admin(current_user)
    db.delete(board)
    db.commit()

@router.post("/columns/new", response_model=schemas.BoardColumnResponse, status_code=status.HTTP_201_CREATED)
def create_column(
    column: schemas.BoardColumnCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    board = db.query(models.Board).filter(models.Board.board_id == column.board_id).first()
    check_board_access(board, current_user)
    if board.team_id:
        require_admin(current_user)

    new_column = models.BoardColumn(
        col_name=column.col_name,
        position_index=column.position_index,
        board_id=column.board_id
    )
    db.add(new_column)
    db.commit()
    db.refresh(new_column)

    log_event(db, new_column.board_id, current_user.user_id, "column_created",
              f"{current_user.username} added column '{new_column.col_name}'")

    return new_column

@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(
    column_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    column = db.query(models.BoardColumn).filter(
        models.BoardColumn.column_id == column_id
    ).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    board = db.query(models.Board).filter(
        models.Board.board_id == column.board_id
    ).first()
    check_board_access(board, current_user)
    if board.team_id:
        require_admin(current_user)

    log_event(db, column.board_id, current_user.user_id, "column_deleted",
              f"{current_user.username} deleted column '{column.col_name}'")

    db.delete(column)
    db.commit()