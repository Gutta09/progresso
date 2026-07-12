# Progresso

A full-stack team project-management app — Kanban boards, tasks, roles, and an activity feed. FastAPI + SQLAlchemy backend, React + Vite frontend.

[![CI](https://github.com/Gutta09/progresso/actions/workflows/ci.yml/badge.svg)](https://github.com/Gutta09/progresso/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What it does

- **Teams & roles** — users belong to teams with role-based access (`RoleEnum`); permissions are enforced server-side (`backend/permissions.py`)
- **Kanban boards** — boards hold ordered columns; move tasks between columns
- **Rich tasks** — priority levels, labels, assignees, and threaded comments
- **Activity feed** — every create/update/move is written to an activity log so a team can see what changed
- **Auth** — email/password accounts with bcrypt-hashed passwords and JWT bearer tokens (`backend/auth.py`)

## Data model

`Team → User`, `Board → BoardColumn → Task`, with `Label`/`TaskLabel` (many-to-many), `Comment`, and `ActivityLog` (`backend/models.py`). Passwords are bcrypt-hashed; tokens are JWT (python-jose).

## Tech stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy, python-jose (JWT), bcrypt/passlib |
| Database | SQLite (swap `DATABASE_URL` for Postgres) |
| Frontend | React 19, Vite, React Router, Recharts, Axios |

## Run it

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # set SECRET_KEY (and DATABASE_URL if not SQLite)
uvicorn main:app --reload  # http://localhost:8000  ·  docs at /docs
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

## API

Routers are mounted under their own prefixes (`backend/routers/`):

| Prefix | Resource |
|---|---|
| `/users` | register, login (JWT), profile |
| `/teams` | team CRUD + membership |
| `/boards` | boards + columns |
| `/tasks` | tasks, labels, comments, moves |
| `/activity` | per-board activity feed |

Interactive docs at `/docs` when the server is running.

## Notes / limitations

- SQLite by default — fine for local/demo; point `DATABASE_URL` at Postgres for real multi-user use.
- No migrations tool yet (tables are created on startup); adding Alembic is the next step for schema evolution.
