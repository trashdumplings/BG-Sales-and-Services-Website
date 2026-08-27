import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
env_file = BASE_DIR / ".env"
if not env_file.exists():
    env_file = BASE_DIR.parent / ".env"
load_dotenv(env_file)

def _read_secret(name: str) -> str | None:
    value = os.getenv(name)
    file_name = os.getenv(f"{name}_FILE")
    if value or not file_name:
        return value
    return Path(file_name).read_text(encoding="utf-8").strip()


def _database_url():
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url.removeprefix("DATABASE_URL=").strip()

    # URL.create performs correct credential escaping, including @, :, /, #, and %.
    password = _read_secret("POSTGRES_PASSWORD")
    if password is not None or os.getenv("POSTGRES_HOST"):
        return URL.create(
            "postgresql+psycopg2",
            username=os.getenv("POSTGRES_USER", "postgres"),
            password=password or "",
            host=os.getenv("POSTGRES_HOST", "postgres"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            database=os.getenv("POSTGRES_DB", "bgsale_portal"),
        )

    return "postgresql+psycopg2://postgres:postgres@localhost:5432/bgsale_portal"


DATABASE_URL = _database_url()

class Base(DeclarativeBase):
    pass

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
except Exception as e:
    print(f"ERROR: Failed to create database engine: {e}")
    raise

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
