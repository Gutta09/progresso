"""Lightweight additive migrations.

Base.metadata.create_all() creates missing tables but never ALTERs existing
ones, so new columns added to already-created tables (teams, tasks) must be
added by hand. SQLite supports ADD COLUMN, and this runs idempotently on
startup.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# table -> {column: "SQL type"}
_ADDED_COLUMNS = {
    "teams": {
        "github_repo": "VARCHAR",
        "github_token_encrypted": "VARCHAR",
        "github_connected_by": "INTEGER",
        "github_connected_at": "DATETIME",
        "github_webhook_secret": "VARCHAR",
    },
    "tasks": {
        "github_issue_number": "INTEGER",
        "github_issue_url": "VARCHAR",
        "github_issue_state": "VARCHAR",
    },
}


def run_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table, columns in _ADDED_COLUMNS.items():
            if table not in existing_tables:
                continue  # create_all will build it with all columns
            present = {c["name"] for c in inspector.get_columns(table)}
            for name, sql_type in columns.items():
                if name not in present:
                    conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {name} {sql_type}'))
