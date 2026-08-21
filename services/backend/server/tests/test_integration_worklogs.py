from datetime import date

from server.models import UserRole


def work_log_payload(**overrides):
    data = dict(date=date.today().isoformat(), task_name="Server maintenance", hours=4)
    data.update(overrides)
    return data


class TestCreateWorkLog:
    def test_requires_linked_employee(self, client, make_user, auth_headers):
        user = make_user(role=UserRole.employee)
        resp = client.post("/api/work-logs", json=work_log_payload(), headers=auth_headers(user))
        assert resp.status_code == 400

    def test_creates_as_draft(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl1@example.com", role=UserRole.employee)
        make_employee(user=user)
        resp = client.post("/api/work-logs", json=work_log_payload(), headers=auth_headers(user))
        assert resp.status_code == 201
        assert resp.json()["workflow_status"] == "draft"


class TestWorkLogWorkflowTransitions:
    def _create_draft(self, client, user, auth_headers):
        resp = client.post("/api/work-logs", json=work_log_payload(), headers=auth_headers(user))
        return resp.json()["id"]

    def test_submit_moves_draft_to_submitted(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl2@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        resp = client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["workflow_status"] == "submitted"

    def test_cannot_submit_twice(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl3@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        resp = client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        assert resp.status_code == 400

    def test_management_cannot_edit_employee_content(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl4@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        hr = make_user(role=UserRole.hr)
        resp = client.patch(f"/api/work-logs/{log_id}", json={"task_name": "Rewritten"}, headers=auth_headers(hr))
        assert resp.status_code == 403

    def test_owner_can_edit_draft(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl5@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        resp = client.patch(f"/api/work-logs/{log_id}", json={"task_name": "Updated task"}, headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["task_name"] == "Updated task"

    def test_cannot_edit_after_submission(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl6@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        resp = client.patch(f"/api/work-logs/{log_id}", json={"task_name": "Nope"}, headers=auth_headers(user))
        assert resp.status_code == 400

    def test_employee_cannot_approve(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl7@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        resp = client.post(f"/api/work-logs/{log_id}/approve", json={"reviewer_comment": "ok"}, headers=auth_headers(user))
        assert resp.status_code == 403

    def test_hr_can_approve_submitted_log(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl8@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        hr = make_user(role=UserRole.hr)
        resp = client.post(f"/api/work-logs/{log_id}/approve", json={"reviewer_comment": "Looks good"}, headers=auth_headers(hr))
        assert resp.status_code == 200
        assert resp.json()["workflow_status"] == "approved"
        assert resp.json()["is_approved"] is True

    def test_rejected_log_can_be_resubmitted(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl9@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        hr = make_user(role=UserRole.hr)
        client.post(f"/api/work-logs/{log_id}/reject", json={"reviewer_comment": "Needs detail"}, headers=auth_headers(hr))
        resp = client.post(f"/api/work-logs/{log_id}/resubmit", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["workflow_status"] == "submitted"
        assert resp.json()["is_approved"] is False

    def test_other_employee_cannot_view_log(self, client, make_user, make_employee, auth_headers):
        owner = make_user(email="wl10@example.com", role=UserRole.employee)
        make_employee(user=owner)
        log_id = self._create_draft(client, owner, auth_headers)
        stranger = make_user(email="wl11@example.com", role=UserRole.employee)
        make_employee(user=stranger)
        resp = client.get(f"/api/work-logs/{log_id}", headers=auth_headers(stranger))
        assert resp.status_code == 403

    def test_non_draft_delete_blocked_for_employee(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl12@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        resp = client.delete(f"/api/work-logs/{log_id}", headers=auth_headers(user))
        assert resp.status_code == 400

    def test_management_can_delete_non_draft(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl13@example.com", role=UserRole.employee)
        make_employee(user=user)
        log_id = self._create_draft(client, user, auth_headers)
        client.post(f"/api/work-logs/{log_id}/submit", headers=auth_headers(user))
        hr = make_user(role=UserRole.hr)
        resp = client.delete(f"/api/work-logs/{log_id}", headers=auth_headers(hr))
        assert resp.status_code == 204


class TestReviewQueue:
    def test_employee_forbidden_from_review_queue(self, client, make_user, auth_headers):
        user = make_user(role=UserRole.employee)
        resp = client.get("/api/work-logs/review-queue", headers=auth_headers(user))
        assert resp.status_code == 403

    def test_review_queue_only_shows_submitted(self, client, make_user, make_employee, auth_headers):
        user = make_user(email="wl14@example.com", role=UserRole.employee)
        make_employee(user=user)
        draft_resp = client.post("/api/work-logs", json=work_log_payload(), headers=auth_headers(user))
        submitted_resp = client.post("/api/work-logs", json=work_log_payload(task_name="Submit me"), headers=auth_headers(user))
        client.post(f"/api/work-logs/{submitted_resp.json()['id']}/submit", headers=auth_headers(user))

        hr = make_user(role=UserRole.hr)
        resp = client.get("/api/work-logs/review-queue", headers=auth_headers(hr))
        assert len(resp.json()) == 1
        assert resp.json()[0]["id"] == submitted_resp.json()["id"]
