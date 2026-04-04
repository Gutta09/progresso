from models import ActivityLog
from datetime import datetime

def log_event(db, board_id: int, user_id: int, event_type: str, description: str):
    entry = ActivityLog(
        board_id=board_id,
        user_id=user_id,
        event_type=event_type,
        description=description,
        timestamp=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()