from datetime import timedelta

import pytest
from jose import jwt

from server.models import User, UserRole
from server.utils.auth import (
    get_password_hash,
    verify_password,
    users_with_default_passwords,
    create_access_token,
    create_refresh_token,
    is_session_active,
    has_module_permission,
    is_admin_or_superadmin,
    is_superadmin,
    settings,
    utc_now,
)


class TestPasswordHashing:
    def test_hash_and_verify_round_trip(self):
        hashed = get_password_hash("CorrectHorseBattery1!")
        assert verify_password("CorrectHorseBattery1!", hashed)

    def test_verify_rejects_wrong_password(self):
        hashed = get_password_hash("CorrectHorseBattery1!")
        assert not verify_password("WrongPassword", hashed)

    def test_hash_is_never_plaintext(self):
        hashed = get_password_hash("anypassword")
        assert hashed != "anypassword"

    def test_password_longer_than_72_bytes_does_not_crash(self):
        long_password = "x" * 200
        hashed = get_password_hash(long_password)
        assert verify_password(long_password, hashed)


class TestUsersWithDefaultPasswords:
    def _stub_user(self, email, password, is_active=True):
        return type("U", (), {"email": email, "is_active": is_active, "password_hash": get_password_hash(password)})()

    def test_flags_known_default_password(self):
        user = self._stub_user("admin@example.com", "superadmin123")
        assert users_with_default_passwords([user]) == ["admin@example.com"]

    def test_ignores_inactive_users(self):
        user = self._stub_user("gone@example.com", "superadmin123", is_active=False)
        assert users_with_default_passwords([user]) == []

    def test_ignores_strong_passwords(self):
        user = self._stub_user("safe@example.com", "Str0ng!Passw0rd")
        assert users_with_default_passwords([user]) == []


class TestJWTTokens:
    def test_access_token_has_correct_claims(self):
        token = create_access_token({"sub": "42", "role": "employee", "sid": "abc"})
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert payload["sub"] == "42"
        assert payload["type"] == "access"
        assert "exp" in payload
        assert "jti" in payload

    def test_refresh_token_type_is_refresh(self):
        token = create_refresh_token({"sub": "42", "role": "employee", "sid": "abc"})
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert payload["type"] == "refresh"

    def test_explicit_jti_is_preserved(self):
        token = create_access_token({"sub": "1", "jti": "fixed-jti"})
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert payload["jti"] == "fixed-jti"


class TestIsSessionActive:
    def _session(self, **overrides):
        defaults = dict(
            revoked_at=None,
            expires_at=utc_now() + timedelta(hours=1),
            last_seen_at=utc_now(),
        )
        defaults.update(overrides)
        return type("S", (), defaults)()

    def test_none_session_is_inactive(self):
        assert is_session_active(None) is False

    def test_revoked_session_is_inactive(self):
        assert is_session_active(self._session(revoked_at=utc_now())) is False

    def test_expired_session_is_inactive(self):
        assert is_session_active(self._session(expires_at=utc_now() - timedelta(seconds=1))) is False

    def test_idle_timeout_makes_session_inactive(self):
        session = self._session(last_seen_at=utc_now() - timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES + 1))
        assert is_session_active(session) is False

    def test_fresh_session_is_active(self):
        assert is_session_active(self._session()) is True


class TestRoleHelpers:
    def _user(self, role, permissions=None):
        return type("U", (), {"role": role, "module_permissions": permissions or []})()

    def test_is_superadmin_true_for_superadmin(self):
        assert is_superadmin(self._user(UserRole.superadmin))

    def test_is_superadmin_false_for_admin_role(self):
        # `admin` is a distinct role from `superadmin`; naming is misleading but behavior is intentional.
        assert not is_superadmin(self._user(UserRole.admin))

    def test_is_admin_or_superadmin_excludes_admin_role_despite_name(self):
        assert not is_admin_or_superadmin(self._user(UserRole.admin))
        assert is_admin_or_superadmin(self._user(UserRole.superadmin))

    def test_has_module_permission_superadmin_always_true(self):
        assert has_module_permission(self._user(UserRole.superadmin), "inventory")

    def test_has_module_permission_admin_always_true(self):
        assert has_module_permission(self._user(UserRole.admin), "inventory")

    def test_has_module_permission_hr_gets_reports_and_employees_implicitly(self):
        hr = self._user(UserRole.hr)
        assert has_module_permission(hr, "reports")
        assert has_module_permission(hr, "employees")
        assert not has_module_permission(hr, "inventory")

    def test_has_module_permission_employee_needs_explicit_grant(self):
        employee = self._user(UserRole.employee, permissions=["products"])
        assert has_module_permission(employee, "products")
        assert not has_module_permission(employee, "inventory")
