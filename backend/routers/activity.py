from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import ActivityLog, User, Board
from datetime import datetime
from permissions import check_board_access

router = APIRouter(prefix="/activity", tags=["activity"])

@router.get("/recent")
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all team board IDs for current user's team
    if not current_user.team_id:
        return []

    team_board_ids = [
        b.board_id for b in db.query(Board).filter(
            Board.team_id == current_user.team_id
        ).all()
    ]

    if not team_board_ids:
        return []

    logs = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.board_id.in_(team_board_ids),
            ActivityLog.user_id != current_user.user_id  # exclude own actions
        )
        .order_by(ActivityLog.timestamp.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "log_id": log.log_id,
            "event_type": log.event_type,
            "description": log.description,
            "timestamp": log.timestamp.isoformat(),
            "username": log.user.username if log.user else "Someone",
            "board_id": log.board_id,
        }
        for log in logs
    ]

@router.get("/unread-count")
def get_unread_count(
    since: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.team_id:
        return {"count": 0}

    team_board_ids = [
        b.board_id for b in db.query(Board).filter(
            Board.team_id == current_user.team_id
        ).all()
    ]

    if not team_board_ids:
        return {"count": 0}

    query = db.query(ActivityLog).filter(
        ActivityLog.board_id.in_(team_board_ids),
        ActivityLog.user_id != current_user.user_id
    )

    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.filter(ActivityLog.timestamp > since_dt)
        except ValueError:
            pass

    return {"count": query.count()}

@router.get("/{board_id}")
def get_board_activity(
    board_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = db.query(Board).filter(Board.board_id == board_id).first()
    check_board_access(board, current_user)

    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.board_id == board_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "log_id": log.log_id,
            "event_type": log.event_type,
            "description": log.description,
            "timestamp": log.timestamp.isoformat(),
            "username": log.user.username if log.user else "Someone",
        }
        for log in logs
    ]