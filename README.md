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
- **GitHub integration** — a team connects a repo and works around it: live commits/issues/PRs, task ↔ issue linking, and two-way status sync (see below)

## Data model

`Team → User`, `Board → BoardColumn → Task`, with `Label`/`TaskLabel` (many-to-many), `Comment`, and `ActivityLog` (`backend/models.py`). Passwords are bcrypt-hashed; tokens are JWT (python-jose).

## Tech stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy, python-jose (JWT), bcrypt/passlib, httpx, cryptography (Fernet) |
| Database | SQLite (swap `DATABASE_URL` for Postgres) |
| Frontend | React 19, Vite, React Router, Recharts, Axios |
| Integrations | GitHub REST API (personal access token) |

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
| `/github` | connect a repo, list commits/issues/PRs, link tasks, sync |

Interactive docs at `/docs` when the server is running.

## GitHub integration

A team can connect one GitHub repository and collaborate around it from inside Progresso.

- **Connect** — a team admin pastes a repo (`owner/name` or its URL) and a GitHub **personal access token** with repo access. The token is validated against the repo, then **encrypted at rest** with Fernet (key derived from `SECRET_KEY`, so no extra config) and never returned to the browser — all GitHub calls happen server-side (`backend/github_client.py`).
- **Activity** — the **Repo** page shows live commits, open issues, and open pull requests for the whole team.
- **Task ↔ issue linking** — link a task to an existing issue by number, or create a GitHub issue directly from a task (`backend/routers/github.py`).
- **Two-way sync** (`backend/github_sync.py`):
  - *Progresso → GitHub* — moving a linked task into a board's "done" column closes its issue; moving it back reopens it.
  - *GitHub → Progresso* — **Sync now** (or a signed webhook at `/github/webhook`) reconciles issue state back onto tasks: a closed issue moves its task to Done, a reopened one moves it back.

To try it: sign in on a team workspace as admin → **Repo** → **Connect**, using a fine-grained PAT with **Contents** and **Issues** access.

## Notes / limitations

- SQLite by default — fine for local/demo; point `DATABASE_URL` at Postgres for real multi-user use.
- Schema changes are applied by a small additive migration on startup (`backend/migrations.py`, `ADD COLUMN` only); Alembic is the next step for full schema evolution.
- Real-time GitHub sync needs a public `/github/webhook` URL; without one, use the **Sync now** button (polling), which works locally.
