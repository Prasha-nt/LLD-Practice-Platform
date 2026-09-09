import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.domain.models import Base

db_dir = os.environ.get("DB_DIR", os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
os.makedirs(db_dir, exist_ok=True)
DB_PATH = os.path.join(db_dir, "lld_platform.db")
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
