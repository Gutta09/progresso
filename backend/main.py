from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

from routers import users, boards, tasks, teams

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Progresso API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(boards.router, prefix="/boards", tags=["Boards"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(teams.router, prefix="/teams", tags=["Teams"])

@app.get("/")
def root():
    return {"message": "Welcome to Progresso API"}