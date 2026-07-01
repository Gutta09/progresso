from fastapi import HTTPException, status
import models


def check_board_access(board: models.Board, current_user: models.User):
    """Raise 404/403 if current_user cannot view/act on this board."""
    if board is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    if board.team_id:
        if board.team_id != current_user.team_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this board")
    else:
        if board.owner_id != current_user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this board")
