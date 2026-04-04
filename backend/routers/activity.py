from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import ActivityLog, User

router = APIRouter(prefix="/activity", tags=["activity"])

@router.get("/{board_id}")
def get_board_activity(board_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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