import os
from pathlib import Path
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
env_file = BASE_DIR / ".env"
if not env_file.exists():
    env_file = BASE_DIR.parent / ".env"
load_dotenv(env_file)

# Get DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/bgsale_portal")

# Clean up DATABASE_URL
if DATABASE_URL.startswith("DATABASE_URL="):
    DATABASE_URL = DATABASE_URL.replace("DATABASE_URL=", "", 1).strip()

# Fix DATABASE_URL encoding for special characters in password
try:
    if DATABASE_URL.count('@') > 1:
        if '://' in DATABASE_URL:
            scheme_part = DATABASE_URL.split('://')[0] + '://'
            rest = DATABASE_URL.split('://', 1)[1]
            last_at_idx = rest.rfind('@')
            if last_at_idx > 0:
                auth_part = rest[:last_at_idx]
                host_db_part = rest[last_at_idx + 1:]
                if ':' in auth_part:
                    first_colon = auth_part.find(':')
                    username = auth_part[:first_colon]
                    password = auth_part[first_colon + 1:]
                    encoded_password = quote_plus(password)
                    DATABASE_URL = f"{scheme_part}{username}:{encoded_password}@{host_db_part}"
except Exception as e:
    print(f"WARNING: Could not fix DATABASE_URL encoding: {e}")

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
