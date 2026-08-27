from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import PyJWTError
from passlib.context import CryptContext
import bcrypt
import hashlib
from uuid import uuid4
from sqlalchemy.orm import Session
from ..config import get_settings
from ..db import get_db
from ..models import User, UserRole, UserSession

settings = get_settings()

# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__ident="2b",
    bcrypt__rounds=12,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain_password, password_hash)
    except (ValueError, TypeError):
        try:
            pwd_bytes = plain_password.encode('utf-8')[:72]
            hash_bytes = password_hash.encode('utf-8')
            return bcrypt.checkpw(pwd_bytes, hash_bytes)
        except Exception:
            return False

def get_password_hash(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        password = password_bytes.decode('utf-8', errors='ignore')
    
    try:
        return pwd_context.hash(password)
    except (ValueError, TypeError) as e:
        if "72 bytes" in str(e).lower() or "longer than" in str(e).lower():
            pwd_bytes = password.encode('utf-8')[:72]
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(pwd_bytes, salt)
            return hashed.decode('utf-8')
        raise

def users_with_default_passwords(users) -> list[str]:
    known_defaults = ("superadmin123", "hr123", "emp123", "admin123")
    return [
        user.email
        for user in users
        if user.is_active
        and any(verify_password(password, user.password_hash) for password in known_defaults)
    ]

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value

def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def new_jti() -> str:
    return str(uuid4())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = utc_now() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.setdefault("jti", new_jti())
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_at: Optional[datetime] = None) -> str:
    expire = expires_at or (utc_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode = data.copy()
    to_encode.setdefault("jti", new_jti())
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_session_tokens(db: Session, user: User, request: Request, remember_me: bool = False) -> tuple[str, str, UserSession, int]:
    session_id = str(uuid4())
    access_jti = new_jti()
    refresh_jti = new_jti()
    max_age = (
        settings.REFRESH_TOKEN_REMEMBER_DAYS * 24 * 3600
        if remember_me
        else settings.REFRESH_TOKEN_SESSION_HOURS * 3600
    )
    expires_at = utc_now() + timedelta(seconds=max_age)
    role = user.role.value if hasattr(user.role, "value") else str(user.role)

    access_token = create_access_token({
        "sub": str(user.id),
        "role": role,
        "sid": session_id,
        "jti": access_jti,
    })
    refresh_token = create_refresh_token({
        "sub": str(user.id),
        "role": role,
        "sid": session_id,
        "jti": refresh_jti,
    }, expires_at=expires_at)

    session = UserSession(
        id=session_id,
        user_id=user.id,
        refresh_token_hash=token_hash(refresh_token),
        refresh_jti=refresh_jti,
        access_jti=access_jti,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        last_seen_at=utc_now(),
        expires_at=expires_at,
    )
    db.add(session)
    return access_token, refresh_token, session, max_age

def is_session_active(session: Optional[UserSession]) -> bool:
    if session is None or session.revoked_at is not None:
        return False
    now = utc_now()
    if ensure_aware(session.expires_at) <= now:
        return False
    idle_limit = ensure_aware(session.last_seen_at) + timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES)
    return idle_limit > now

def revoke_session(db: Session, session: UserSession, reason: str) -> None:
    session.revoked_at = utc_now()
    session.revoked_reason = reason
    db.add(session)

def decode_refresh_token(refresh_token: str) -> dict:
    try:
        payload = jwt.decode(refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    return payload

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        session_id: str = payload.get("sid")
        if user_id is None or session_id is None or payload.get("type") != "access":
            raise credentials_exception
        user_id_int = int(user_id)
    except (PyJWTError, ValueError, TypeError):
        raise credentials_exception

    user = db.get(User, user_id_int)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")

    session = db.get(UserSession, session_id)
    if (
        not is_session_active(session)
        or session.user_id != user.id
        or session.access_jti != payload.get("jti")
    ):
        raise credentials_exception
    session.last_seen_at = utc_now()
    session.access_jti = payload.get("jti")
    db.commit()
    return user

def is_admin_or_superadmin(user: User) -> bool:
    return user.role == UserRole.superadmin

def is_superadmin(user: User) -> bool:
    return user.role == UserRole.superadmin

def require_admin_or_superadmin(current_user: User = Depends(get_current_user)):
    if not is_admin_or_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Only SuperAdmin can perform this action")
    return current_user

def require_superadmin(current_user: User = Depends(get_current_user)):
    if not is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Only SuperAdmin can perform this action")
    return current_user

def require_hr_or_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.superadmin, UserRole.hr]:
        raise HTTPException(status_code=403, detail="Only SuperAdmin and HR can perform this action")
    return current_user

def has_module_permission(user: User, permission: str) -> bool:
    if user.role in [UserRole.superadmin, UserRole.admin]:
        return True
    if permission in {"reports", "employees"} and user.role == UserRole.hr:
        return True
    return permission in (user.module_permissions or [])

def require_module_permission(permission: str):
    def dependency(current_user: User = Depends(get_current_user)):
        if not has_module_permission(current_user, permission):
            raise HTTPException(status_code=403, detail=f"You do not have access to the {permission} module")
        return current_user
    return dependency

def set_refresh_cookie(response: Response, token: str, max_age: Optional[int] = None):
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=max_age if max_age is not None else settings.REFRESH_TOKEN_SESSION_HOURS * 3600,
        path="/auth/",
    )

def clear_refresh_cookie(response: Response):
    response.delete_cookie(key="refresh_token", path="/auth/")

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user and verify_password(password, user.password_hash):
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        return user
    return None
