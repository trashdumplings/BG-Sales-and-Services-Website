from server.models import UserRole
from server.modules import auth as auth_module


def login(client, email, password, **extra):
    data = {"username": email, "password": password, **extra}
    return client.post("/auth/login", data=data)


def solve_challenge(client, email):
    challenge = client.post("/auth/challenge", data={"username": email}).json()
    left, right = challenge["question"].split(" + ")
    right = right.split(" =")[0]
    answer = str(int(left) + int(right))
    return challenge["challenge_id"], answer


def fail_login(client, email, password="WrongPassword"):
    """One failed login attempt, transparently solving the CAPTCHA once it's required
    (from the 4th attempt onward) so the failure actually gets recorded rather than
    short-circuiting on a 403 'captcha_required' response."""
    resp = login(client, email, password)
    if resp.status_code == 403 and resp.json().get("detail", {}).get("captcha_required"):
        challenge_id, answer = solve_challenge(client, email)
        resp = login(client, email, password, challenge_id=challenge_id, challenge_answer=answer)
    return resp


class TestRegister:
    def test_register_creates_employee_role_user(self, client, monkeypatch, db_session):
        monkeypatch.setattr(auth_module.settings, "ALLOW_PUBLIC_REGISTRATION", True)
        resp = client.post("/auth/register", json={"name": "New User", "email": "new@example.com", "password": "River!Stone84"})
        assert resp.status_code == 202
        user = db_session.query(auth_module.User).filter(auth_module.User.email == "new@example.com").one()
        assert user.role == UserRole.employee

    def test_register_disabled_returns_403(self, client, monkeypatch):
        monkeypatch.setattr(auth_module.settings, "ALLOW_PUBLIC_REGISTRATION", False)
        resp = client.post("/auth/register", json={"name": "New User", "email": "blocked@example.com", "password": "River!Stone84"})
        assert resp.status_code == 403

    def test_register_duplicate_email_has_same_response_as_new_email(self, client, monkeypatch):
        monkeypatch.setattr(auth_module.settings, "ALLOW_PUBLIC_REGISTRATION", True)
        payload = {"name": "First User", "email": "dupe@example.com", "password": "River!Stone84"}
        first = client.post("/auth/register", json=payload)
        second = client.post("/auth/register", json={**payload, "name": "Second User"})
        assert first.status_code == second.status_code == 202
        assert first.json() == second.json()

    def test_register_rejects_common_password(self, client, monkeypatch):
        monkeypatch.setattr(auth_module.settings, "ALLOW_PUBLIC_REGISTRATION", True)
        resp = client.post(
            "/auth/register",
            json={"name": "Weak User", "email": "weak@example.com", "password": "Password123!"},
        )
        assert resp.status_code == 422


class TestLogin:
    def test_successful_login_returns_token_and_sets_cookie(self, client, make_user):
        make_user(email="login@example.com", password="Correct1Pass!")
        resp = login(client, "login@example.com", "Correct1Pass!")
        assert resp.status_code == 200
        body = resp.json()
        assert body["access_token"]
        assert body["user"]["email"] == "login@example.com"
        assert "refresh_token" in resp.cookies

    def test_wrong_password_returns_401(self, client, make_user):
        make_user(email="login2@example.com", password="Correct1Pass!")
        resp = login(client, "login2@example.com", "WrongPassword")
        assert resp.status_code == 401

    def test_inactive_user_returns_403(self, client, make_user):
        make_user(email="inactive@example.com", password="Correct1Pass!", is_active=False)
        resp = login(client, "inactive@example.com", "Correct1Pass!")
        assert resp.status_code == 403

    def test_unknown_user_returns_401_not_500(self, client):
        resp = login(client, "doesnotexist@example.com", "whatever")
        assert resp.status_code == 401

    def test_login_is_case_insensitive_on_email(self, client, make_user):
        make_user(email="mixedcase@example.com", password="Correct1Pass!")
        resp = login(client, "MixedCase@Example.com", "Correct1Pass!")
        assert resp.status_code == 200


class TestLoginThrottleAndCaptcha:
    def test_plain_attempt_blocked_pending_captcha_after_three_failures(self, client, make_user):
        # Once 3 failures are on record, the server refuses to even evaluate the
        # password again without a solved CAPTCHA (verify_login_challenge runs before
        # enforce_login_throttle), so a 4th plain attempt never reaches the throttle
        # counter itself.
        make_user(email="throttle@example.com", password="Correct1Pass!")
        for _ in range(3):
            login(client, "throttle@example.com", "WrongPassword")
        resp = login(client, "throttle@example.com", "WrongPassword")
        assert resp.status_code == 403
        assert resp.json()["detail"]["captcha_required"] is True

    def test_captcha_challenge_required_after_three_failures(self, client, make_user):
        make_user(email="captcha@example.com", password="Correct1Pass!")
        for _ in range(3):
            login(client, "captcha@example.com", "WrongPassword")
        resp = client.post("/auth/challenge", data={"username": "captcha@example.com"})
        assert resp.status_code == 200
        assert "question" in resp.json()

    def test_challenge_not_required_before_threshold(self, client):
        resp = client.post("/auth/challenge", data={"username": "fresh@example.com"})
        assert resp.status_code == 400

    def test_correct_captcha_does_not_bypass_account_lockout(self, client, make_user):
        make_user(email="solved@example.com", password="Correct1Pass!")
        for _ in range(5):
            fail_login(client, "solved@example.com")
        challenge = client.post("/auth/challenge", data={"username": "solved@example.com"}).json()
        left, right = challenge["question"].split(" + ")
        right = right.split(" =")[0]
        answer = str(int(left) + int(right))
        resp = login(
            client,
            "solved@example.com",
            "Correct1Pass!",
            challenge_id=challenge["challenge_id"],
            challenge_answer=answer,
        )
        assert resp.status_code == 429

    def test_hard_lockout_blocks_even_with_valid_captcha(self, client, make_user):
        make_user(email="hardlock@example.com", password="Correct1Pass!")
        for _ in range(5):
            fail_login(client, "hardlock@example.com")
        challenge_id, answer = solve_challenge(client, "hardlock@example.com")
        resp = login(
            client,
            "hardlock@example.com",
            "Correct1Pass!",
            challenge_id=challenge_id,
            challenge_answer=answer,
        )
        assert resp.status_code == 429

    def test_source_wide_limit_blocks_password_spraying(self, client):
        for index in range(auth_module.SOURCE_FAILED_LOGIN_LIMIT):
            resp = login(client, f"unknown-{index}@example.com", "WrongPassword")
            assert resp.status_code == 401
        blocked = login(client, "another-unknown@example.com", "WrongPassword")
        assert blocked.status_code == 429
        assert blocked.headers["retry-after"] == str(auth_module.FAILED_LOGIN_WINDOW_MINUTES * 60)


class TestRefreshAndLogout:
    def test_refresh_without_cookie_returns_401(self, client):
        resp = client.post("/auth/refresh")
        assert resp.status_code == 401

    def test_refresh_rotates_tokens(self, client, make_user):
        make_user(email="refresh@example.com", password="Correct1Pass!")
        login_resp = login(client, "refresh@example.com", "Correct1Pass!")
        old_access = login_resp.json()["access_token"]
        refresh_resp = client.post("/auth/refresh")
        assert refresh_resp.status_code == 200
        new_access = refresh_resp.json()["access_token"]
        assert new_access != old_access

    def test_reusing_rotated_refresh_token_is_rejected(self, client, make_user):
        make_user(email="reuse@example.com", password="Correct1Pass!")
        login(client, "reuse@example.com", "Correct1Pass!")
        old_cookie = client.cookies.get("refresh_token")
        client.post("/auth/refresh")  # rotates the cookie
        client.cookies.set("refresh_token", old_cookie)  # simulate replay of stale token
        resp = client.post("/auth/refresh")
        assert resp.status_code == 401

    def test_logout_clears_cookie_and_revokes_session(self, client, make_user):
        make_user(email="logout@example.com", password="Correct1Pass!")
        login(client, "logout@example.com", "Correct1Pass!")
        resp = client.post("/auth/logout")
        assert resp.status_code == 204
        refresh_resp = client.post("/auth/refresh")
        assert refresh_resp.status_code == 401


class TestMe:
    def test_me_requires_authentication(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_me_returns_current_user(self, client, make_user, auth_headers):
        user = make_user(email="me@example.com", role=UserRole.hr)
        resp = client.get("/auth/me", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@example.com"
        assert resp.json()["role"] == "hr"


class TestChangePassword:
    def test_wrong_current_password_rejected(self, client, make_user, auth_headers):
        user = make_user(email="cp1@example.com", password="Correct1Pass!")
        resp = client.post(
            "/auth/change-password",
            headers=auth_headers(user),
            json={"current_password": "WrongOne!", "new_password": "NewStrongPass1!"},
        )
        assert resp.status_code == 400

    def test_same_new_password_rejected(self, client, make_user, auth_headers):
        user = make_user(email="cp2@example.com", password="Correct1Pass!")
        resp = client.post(
            "/auth/change-password",
            headers=auth_headers(user),
            json={"current_password": "Correct1Pass!", "new_password": "Correct1Pass!"},
        )
        assert resp.status_code == 400

    def test_successful_change_revokes_existing_sessions(self, client, make_user):
        user = make_user(email="cp3@example.com", password="Correct1Pass!")
        login_resp = login(client, "cp3@example.com", "Correct1Pass!")
        access_token = login_resp.json()["access_token"]
        resp = client.post(
            "/auth/change-password",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"current_password": "Correct1Pass!", "new_password": "BrandNewPass1!"},
        )
        assert resp.status_code == 204
        refresh_resp = client.post("/auth/refresh")
        assert refresh_resp.status_code == 401
