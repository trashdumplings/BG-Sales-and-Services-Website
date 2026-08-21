from datetime import date, timedelta

from server.models import UserRole


def leave_payload(start, end, leave_type="annual", reason="Family trip"):
    return {
        "leave_type": leave_type,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "reason": reason,
    }


class TestCreateLeaveRequest:
    def test_requires_linked_employee_record(self, client, make_user, auth_headers):
        user = make_user(role=UserRole.employee)  # no matching Employee row
        resp = client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=2)),
            headers=auth_headers(user),
        )
        assert resp.status_code == 400

    def test_creates_leave_for_linked_employee(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="leaveuser@example.com", role=UserRole.employee)
        make_employee(user=user)
        start = date.today()
        end = start + timedelta(days=2)
        resp = client.post("/api/leaves", json=leave_payload(start, end), headers=auth_headers(user))
        assert resp.status_code == 201
        assert resp.json()["total_days"] == 3

    def test_end_before_start_rejected(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="badrange@example.com", role=UserRole.employee)
        make_employee(user=user)
        start = date.today()
        end = start - timedelta(days=1)
        resp = client.post("/api/leaves", json=leave_payload(start, end), headers=auth_headers(user))
        assert resp.status_code == 400

    def test_overlapping_request_rejected(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="overlap@example.com", role=UserRole.employee)
        make_employee(user=user)
        start = date.today()
        end = start + timedelta(days=3)
        client.post("/api/leaves", json=leave_payload(start, end), headers=auth_headers(user))
        overlap_resp = client.post(
            "/api/leaves",
            json=leave_payload(start + timedelta(days=1), end + timedelta(days=1)),
            headers=auth_headers(user),
        )
        assert overlap_resp.status_code == 400


class TestListLeaveRequests:
    def test_employee_sees_only_own_requests(self, client, make_user, make_employee, auth_headers):
        user_a = make_user(email="a@example.com", role=UserRole.employee)
        make_employee(user=user_a)
        user_b = make_user(email="b@example.com", role=UserRole.employee)
        make_employee(user=user_b)
        client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=1)),
            headers=auth_headers(user_a),
        )
        resp = client.get("/api/leaves", headers=auth_headers(user_b))
        assert resp.json() == []

    def test_hr_sees_all_requests(self, client, make_user, make_employee, auth_headers):
        user_a = make_user(email="c@example.com", role=UserRole.employee)
        make_employee(user=user_a)
        hr = make_user(role=UserRole.hr)
        client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=1)),
            headers=auth_headers(user_a),
        )
        resp = client.get("/api/leaves", headers=auth_headers(hr))
        assert len(resp.json()) == 1


class TestApproveRejectLeave:
    def test_employee_cannot_approve(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="d@example.com", role=UserRole.employee)
        make_employee(user=user)
        create = client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=1)),
            headers=auth_headers(user),
        )
        leave_id = create.json()["id"]
        resp = client.post(f"/api/leaves/{leave_id}/approve", headers=auth_headers(user))
        assert resp.status_code == 403

    def test_hr_can_approve_pending_request(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="e@example.com", role=UserRole.employee)
        make_employee(user=user)
        hr = make_user(role=UserRole.hr)
        create = client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=1)),
            headers=auth_headers(user),
        )
        leave_id = create.json()["id"]
        resp = client.post(f"/api/leaves/{leave_id}/approve", headers=auth_headers(hr))
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"

    def test_cannot_approve_twice(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="f@example.com", role=UserRole.employee)
        make_employee(user=user)
        hr = make_user(role=UserRole.hr)
        create = client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=1)),
            headers=auth_headers(user),
        )
        leave_id = create.json()["id"]
        client.post(f"/api/leaves/{leave_id}/approve", headers=auth_headers(hr))
        resp = client.post(f"/api/leaves/{leave_id}/approve", headers=auth_headers(hr))
        assert resp.status_code == 400

    def test_reject_requires_reason(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="g@example.com", role=UserRole.employee)
        make_employee(user=user)
        hr = make_user(role=UserRole.hr)
        create = client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=1)),
            headers=auth_headers(user),
        )
        leave_id = create.json()["id"]
        resp = client.post(f"/api/leaves/{leave_id}/reject", params={"reason": "Understaffed"}, headers=auth_headers(hr))
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"


class TestLeaveBalance:
    def test_balance_reflects_approved_annual_days(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="h@example.com", role=UserRole.employee)
        make_employee(user=user)
        hr = make_user(role=UserRole.hr)
        create = client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=4)),  # 5 days
            headers=auth_headers(user),
        )
        leave_id = create.json()["id"]
        client.post(f"/api/leaves/{leave_id}/approve", headers=auth_headers(hr))

        resp = client.get("/api/leaves/balance", headers=auth_headers(user))
        body = resp.json()
        assert body["annual_entitlement"] == 24
        assert body["annual_used"] == 5
        assert body["annual_remaining"] == 19

    def test_balance_ignores_pending_requests(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="i@example.com", role=UserRole.employee)
        make_employee(user=user)
        client.post(
            "/api/leaves",
            json=leave_payload(date.today(), date.today() + timedelta(days=2)),
            headers=auth_headers(user),
        )
        resp = client.get("/api/leaves/balance", headers=auth_headers(user))
        assert resp.json()["annual_used"] == 0
