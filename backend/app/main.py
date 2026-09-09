from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import init_db, SessionLocal
from app.db.seed_data import seed_problems
from app.api.routes import router

app = FastAPI(
    title="DesignCoach — LLD Practice Platform API",
    description="Backend service providing domain modeling, practice state management, and evidence-based AI design feedback.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    db = SessionLocal()
    try:
        seed_problems(db)
    finally:
        db.close()

app.include_router(router)

@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "DesignCoach API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
