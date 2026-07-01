from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import auth
import io
import csv

router = APIRouter()


def require_admin(current_user: models.User):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only team admins can access reports")


@router.get("/report")
def get_admin_report(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    if not current_user.team_id:
        raise HTTPException(status_code=400, detail="You are not part of a team")

    # All boards for this team
    boards = (
        db.query(models.Board)
        .filter(models.Board.team_id == current_user.team_id)
        .all()
    )

    # All team members
    members = (
        db.query(models.User)
        .filter(models.User.team_id == current_user.team_id)
        .all()
    )

    # Build member map
    member_map = {m.user_id: m.username for m in members}

    # Member contribution tracking
    member_stats = {
        m.user_id: {
            "user_id": m.user_id,
            "username": m.username,
            "role": m.role.value if m.role else "member",
            "assigned": 0,
            "done": 0,
            "in_progress": 0,
            "todo": 0,
        }
        for m in members
    }

    board_reports = []
    total_tasks = 0
    total_done = 0

    for board in boards:
        columns = (
            db.query(models.BoardColumn)
            .filter(models.BoardColumn.board_id == board.board_id)
            .order_by(models.BoardColumn.position_index)
            .all()
        )

        board_columns = []
        board_total = 0
        board_done = 0

        for col in columns:
            tasks = (
                db.query(models.Task)
                .filter(models.Task.column_id == col.column_id)
                .all()
            )

            col_name_lower = col.col_name.lower().strip()
            is_done_col = any(
                word in col_name_lower for word in ["done", "complete", "completed", "finished", "closed"]
            )
            is_inprog_col = any(
                word in col_name_lower for word in ["progress", "doing", "active", "in progress", "wip"]
            )

            for task in tasks:
                board_total += 1
                if is_done_col:
                    board_done += 1

                # Update member stats
                if task.assigned_to and task.assigned_to in member_stats:
                    member_stats[task.assigned_to]["assigned"] += 1
                    if is_done_col:
                        member_stats[task.assigned_to]["done"] += 1
                    elif is_inprog_col:
                        member_stats[task.assigned_to]["in_progress"] += 1
                    else:
                        member_stats[task.assigned_to]["todo"] += 1

            board_columns.append({
                "column_id": col.column_id,
                "col_name": col.col_name,
                "task_count": len(tasks),
                "is_done_col": is_done_col,
            })

        total_tasks += board_total
        total_done += board_done

        completion_pct = round((board_done / board_total) * 100) if board_total > 0 else 0

        board_reports.append({
            "board_id": board.board_id,
            "board_name": board.board_name,
            "created_date": str(board.created_date) if board.created_date else None,
            "total_tasks": board_total,
            "done_tasks": board_done,
            "completion_pct": completion_pct,
            "columns": board_columns,
        })

    overall_pct = round((total_done / total_tasks) * 100) if total_tasks > 0 else 0

    return {
        "team_name": current_user.team.team_name if current_user.team else "Team",
        "total_boards": len(boards),
        "total_members": len(members),
        "total_tasks": total_tasks,
        "total_done": total_done,
        "overall_completion_pct": overall_pct,
        "boards": board_reports,
        "members": list(member_stats.values()),
    }


@router.get("/report/export")
def export_report_csv(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    if not current_user.team_id:
        raise HTTPException(status_code=400, detail="You are not part of a team")

    boards = (
        db.query(models.Board)
        .filter(models.Board.team_id == current_user.team_id)
        .all()
    )

    member_map = {
        m.user_id: m.username
        for m in db.query(models.User).filter(models.User.team_id == current_user.team_id).all()
    }

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Board", "Column", "Task Title", "Description", "Priority", "Assigned To", "Due Date", "Status"])

    for board in boards:
        for col in db.query(models.BoardColumn).filter(
            models.BoardColumn.board_id == board.board_id
        ).order_by(models.BoardColumn.position_index).all():
            col_name_lower = col.col_name.lower()
            if any(w in col_name_lower for w in ["done", "complete", "finished", "closed"]):
                status = "Done"
            elif any(w in col_name_lower for w in ["progress", "doing", "active", "wip"]):
                status = "In Progress"
            else:
                status = "To Do"

            for task in db.query(models.Task).filter(models.Task.column_id == col.column_id).all():
                writer.writerow([
                    board.board_name,
                    col.col_name,
                    task.title,
                    task.description or "",
                    task.priority.value if task.priority else "medium",
                    member_map.get(task.assigned_to, "Unassigned") if task.assigned_to else "Unassigned",
                    str(task.due_date) if task.due_date else "",
                    status,
                ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=progresso_report.csv"},
    )
