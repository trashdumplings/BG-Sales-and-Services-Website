import os
import sys
import tempfile
from pathlib import Path

os.environ.setdefault("PRODUCT_UPLOAD_DIR", str(Path(tempfile.gettempdir()) / "bgsale-test-uploads"))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from server.db import Base, get_db
from server.main import app
from server import models
from server.utils.auth import get_password_hash, create_access_token, new_jti, utc_now
from server.modules import auth as auth_module
from datetime import timedelta

# `users.module_permissions` declares a Postgres-only `DEFAULT '[]'::json` server_default
# (models.py). SQLite's DDL parser rejects the `::json` cast, so CREATE TABLE fails against
# the in-memory test database. The Python-side `default=list` on the same column already
# supplies `[]` for every ORM insert, so dropping the server_default is safe for tests.
models.User.__table__.columns["module_permissions"].server_default = None

TEST_DB_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _fresh_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _reset_login_throttle():
    auth_module.failed_login_attempts.clear()
    auth_module.source_failed_login_attempts.clear()
    auth_module.login_challenges.clear()
    yield
    auth_module.failed_login_attempts.clear()
    auth_module.source_failed_login_attempts.clear()
    auth_module.login_challenges.clear()


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    # TrustedHostMiddleware only allows settings.trusted_hosts_list (default:
    # localhost,127.0.0.1). TestClient's default base_url ("http://testserver") sends a
    # Host header that middleware rejects with a plain-text 400 "Invalid host header" —
    # which silently satisfies any assertion expecting a 400/403/401 without exercising
    # real route logic. Pin base_url to an allowed host so requests actually reach routes.
    with TestClient(app, base_url="http://localhost") as c:
        yield c


@pytest.fixture
def make_user(db_session):
    counter = {"n": 0}

    def _make(
        email=None,
        password="Sup3r$ecretPW1",
        role=models.UserRole.employee,
        module_permissions=None,
        is_active=True,
        name="Test User",
    ):
        counter["n"] += 1
        user = models.User(
            name=name,
            email=(email or f"user{counter['n']}@example.com").lower(),
            password_hash=get_password_hash(password),
            role=role,
            module_permissions=module_permissions or [],
            is_active=is_active,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        user._plain_password = password
        return user

    return _make


@pytest.fixture
def make_employee(db_session):
    counter = {"n": 0}

    def _make(user=None, **overrides):
        counter["n"] += 1
        defaults = dict(
            employee_id=f"EMP-{1000 + counter['n']}",
            first_name="Test",
            last_name=f"Employee{counter['n']}",
            email=(user.email if user else f"employee{counter['n']}@example.com"),
            department="Operations",
            position="Staff",
            hire_date=utc_now(),
            status="active",
        )
        defaults.update(overrides)
        employee = models.Employee(**defaults)
        db_session.add(employee)
        db_session.commit()
        db_session.refresh(employee)
        return employee

    return _make


@pytest.fixture
def auth_headers(db_session):
    """Mint a valid access token + backing UserSession row for a user, bypassing /auth/login."""

    def _make(user):
        session_id = str(__import__("uuid").uuid4())
        access_jti = new_jti()
        role = user.role.value if hasattr(user.role, "value") else str(user.role)
        session = models.UserSession(
            id=session_id,
            user_id=user.id,
            refresh_token_hash=f"test-hash-{session_id}",
            refresh_jti=new_jti(),
            access_jti=access_jti,
            expires_at=utc_now() + timedelta(hours=8),
            last_seen_at=utc_now(),
        )
        db_session.add(session)
        db_session.commit()
        token = create_access_token({
            "sub": str(user.id),
            "role": role,
            "sid": session_id,
            "jti": access_jti,
        })
        return {"Authorization": f"Bearer {token}"}

    return _make
