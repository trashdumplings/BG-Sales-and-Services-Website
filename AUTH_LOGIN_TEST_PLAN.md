# Authentication Login Test Plan

Use this checklist before calling authentication production-ready.

## Functional

- Valid credentials redirect to the correct dashboard.
- Invalid username, invalid password, and invalid username plus password all return a generic error.
- Refreshing the page after login preserves the session.
- Opening a new tab preserves the session.
- Closing and reopening the browser preserves the session only when `Remember me` was selected.
- Passwords with special characters, mixed case, and spaces are accepted when they match the stored password.

## Negative And Security

- SQL injection payloads in email/password return a generic login error.
- Disabled users cannot log in and no `user_sessions` row is created.
- Reusing an old refresh token returns `401` and revokes the session.
- Old access tokens stop working after refresh rotation.
- Logged-out access tokens return `401`.
- Repeated failed logins trigger verification and then `429` throttling.
- Production runs with `DEBUG=false`, HTTPS, a strong `JWT_SECRET`, and exact `CORS_ORIGINS`.

## UI And Accessibility

- Email and password fields have labels and autocomplete attributes.
- `Remember me`, `Forgot password?`, `Sign Up`, and submit are reachable by keyboard.
- Focus indicators are visible.
- Login errors use `role="alert"`.
- Success messages use `role="status"`.
- Layout works at desktop, tablet, and mobile widths.

## Performance

- Login API response should normally be under 2 seconds.
- Concurrent login testing should monitor status codes, response time, database CPU, and backend memory.
