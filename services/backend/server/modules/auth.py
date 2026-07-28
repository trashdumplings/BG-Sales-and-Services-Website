from datetime import timedelta
from random import randint
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..db import get_db
from ..models import User, UserRole, UserSession
from ..schemas import TokenResponse, UserOut, RegisterIn, SessionOut, ChallengeOut, PasswordChange
from ..utils.auth import (
    authenticate_user, 
    create_access_token, 
    create_refresh_token, 
    create_session_tokens,
    decode_refresh_token,
    get_password_hash, 
    verify_password,
    set_refresh_cookie, 
    clear_refresh_cookie,
    get_current_user,
    is_session_active,
    revoke_session,
    token_hash,
    utc_now,
    new_jti,
    ensure_aware,
    settings,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

FAILED_LOGIN_WINDOW_MINUTES = 15
FAILED_LOGIN_LIMIT = 5
# Absolute ceiling within the window that no solved captcha can bypass. Without this,
# a scripted client can keep fetching a fresh /auth/challenge and solving the trivial
# arithmetic answer to guess passwords at unlimited speed.
HARD_LOCKOUT_LIMIT = 10
CAPTCHA_TRIGGER_ATTEMPTS = 3
CHALLENGE_TTL_SECONDS = 300
failed_login_attempts = {}
login_challenges = {}

def login_attempt_key(request: Request, username: str) -> str:
    ip = request.client.host if request.client else "unknown"
    return f"{ip}:{username.lower()}"

def enforce_login_throttle(request: Request, username: str, challenge_verified: bool = False) -> None:
    key = login_attempt_key(request, username)
    now = utc_now()
    attempts = [
        attempt
        for attempt in failed_login_attempts.get(key, [])
        if attempt > now - timedelta(minutes=FAILED_LOGIN_WINDOW_MINUTES)
    ]
    failed_login_attempts[key] = attempts
    if len(attempts) >= HARD_LOCKOUT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Too many failed login attempts. Try again later.",
                "captcha_required": True,
            },
        )
    if len(attempts) >= FAILED_LOGIN_LIMIT and not challenge_verified:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Too many failed login attempts. Try again later.",
                "captcha_required": True,
            },
        )

def record_failed_login(request: Request, username: str) -> None:
    key = login_attempt_key(request, username)
    failed_login_attempts.setdefault(key, []).append(utc_now())

def clear_failed_logins(request: Request, username: str) -> None:
    failed_login_attempts.pop(login_attempt_key(request, username), None)

def current_failed_login_count(request: Request, username: str) -> int:
    key = login_attempt_key(request, username)
    now = utc_now()
    attempts = [
        attempt
        for attempt in failed_login_attempts.get(key, [])
        if attempt > now - timedelta(minutes=FAILED_LOGIN_WINDOW_MINUTES)
    ]
    failed_login_attempts[key] = attempts
    return len(attempts)

def create_login_challenge(request: Request, username: str) -> dict:
    left = randint(2, 9)
    right = randint(2, 9)
    challenge_id = str(uuid4())
    login_challenges[challenge_id] = {
        "key": login_attempt_key(request, username),
        "answer": str(left + right),
        "expires_at": utc_now() + timedelta(seconds=CHALLENGE_TTL_SECONDS),
    }
    return {
        "challenge_id": challenge_id,
        "question": f"{left} + {right} = ?",
        "expires_in_seconds": CHALLENGE_TTL_SECONDS,
    }

def verify_login_challenge(request: Request, username: str, challenge_id: str | None, challenge_answer: str | None) -> bool:
    if current_failed_login_count(request, username) < CAPTCHA_TRIGGER_ATTEMPTS:
        return False
    challenge = login_challenges.get(challenge_id or "")
    if (
        not challenge
        or challenge["key"] != login_attempt_key(request, username)
        or challenge["expires_at"] <= utc_now()
        or str(challenge_answer or "").strip() != challenge["answer"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Additional verification is required.",
                "captcha_required": True,
            },
        )
    login_challenges.pop(challenge_id, None)
    return True

@router.post("/challenge", response_model=ChallengeOut)
def issue_challenge(
    request: Request,
    username: str = Form(...),
):
    if current_failed_login_count(request, username) < CAPTCHA_TRIGGER_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Challenge is not required for this login.")
    return create_login_challenge(request, username)

@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if not settings.ALLOW_PUBLIC_REGISTRATION:
        raise HTTPException(status_code=403, detail="Public registration is disabled.")
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=UserRole.employee,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    remember_me: bool = Form(False),
    challenge_id: str | None = Form(None),
    challenge_answer: str | None = Form(None),
    db: Session = Depends(get_db),
):
    challenge_verified = verify_login_challenge(request, form_data.username, challenge_id, challenge_answer)
    enforce_login_throttle(request, form_data.username, challenge_verified)
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        record_failed_login(request, form_data.username)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        record_failed_login(request, form_data.username)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is disabled")
    clear_failed_logins(request, form_data.username)

    access_token, refresh_token, _, max_age = create_session_tokens(db, user, request, remember_me=remember_me)
    db.commit()

    set_refresh_cookie(response, refresh_token, max_age=max_age)

    return TokenResponse(
        access_token=access_token,
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role, "module_permissions": user.module_permissions or []},
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    payload = decode_refresh_token(refresh_token)
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    session_id = payload.get("sid")
    refresh_jti = payload.get("jti")
    if not session_id or not refresh_jti:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User no longer exists")

    session = db.get(UserSession, session_id)
    if (
        not is_session_active(session)
        or session.user_id != user.id
        or session.refresh_jti != refresh_jti
        or session.refresh_token_hash != token_hash(refresh_token)
    ):
        if session:
            revoke_session(db, session, "refresh_token_reuse_or_invalid")
            db.commit()
        clear_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Session expired or revoked")

    role = user.role.value if hasattr(user.role, "value") else str(user.role)
    access_jti = new_jti()
    new_refresh_jti = new_jti()
    access_token = create_access_token({
        "sub": str(user.id),
        "role": role,
        "sid": session.id,
        "jti": access_jti,
    })
    new_refresh = create_refresh_token({
        "sub": str(user.id),
        "role": role,
        "sid": session.id,
        "jti": new_refresh_jti,
    }, expires_at=session.expires_at)

    session.refresh_token_hash = token_hash(new_refresh)
    session.refresh_jti = new_refresh_jti
    session.access_jti = access_jti
    session.last_seen_at = utc_now()
    db.commit()

    max_age = max(0, int((ensure_aware(session.expires_at) - utc_now()).total_seconds()))
    set_refresh_cookie(response, new_refresh, max_age=max_age)

    return TokenResponse(
        access_token=access_token,
        user={"id": user.id, "name": user.name, "email": user.email, "role": user.role, "module_permissions": user.module_permissions or []},
    )

@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_refresh_token(refresh_token)
            session_id = payload.get("sid")
            session = db.get(UserSession, session_id) if session_id else None
            if session and session.revoked_at is None:
                revoke_session(db, session, "logout")
                db.commit()
        except HTTPException:
            pass
    clear_refresh_cookie(response)
    return None

@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password", status_code=204)
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="New password must be different")
    current_user.password_hash = get_password_hash(payload.new_password)
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.revoked_at.is_(None),
    ).all()
    for session in sessions:
        revoke_session(db, session, "password_changed")
    db.commit()
    return None

@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(UserSession)
        .filter(UserSession.user_id == current_user.id)
        .order_by(UserSession.last_seen_at.desc())
        .all()
    )

@router.delete("/sessions/{session_id}", status_code=204)
def revoke_user_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.get(UserSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.revoked_at is None:
        revoke_session(db, session, "revoked_by_user")
        db.commit()
    return None
