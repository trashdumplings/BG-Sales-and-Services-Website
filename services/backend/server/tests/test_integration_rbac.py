from server.models import UserRole


class TestAdminUserManagement:
    def test_non_superadmin_forbidden_from_users_list(self, client, make_user, auth_headers):
        hr = make_user(role=UserRole.hr)
        resp = client.get("/admin/users", headers=auth_headers(hr))
        assert resp.status_code == 403

    def test_superadmin_can_list_users(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        resp = client.get("/admin/users", headers=auth_headers(admin))
        assert resp.status_code == 200
        assert any(u["email"] == admin.email for u in resp.json())

    def test_create_combined_user_creates_user_and_employee(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        payload = {
            "name": "New Hire",
            "email": "newhire@example.com",
            "password": "Str0ngPassword!",
            "role": "employee",
            "first_name": "New",
            "last_name": "Hire",
            "department": "Sales",
            "position": "Associate",
            "hire_date": "2026-01-01T00:00:00",
        }
        resp = client.post("/admin/users", json=payload, headers=auth_headers(admin))
        assert resp.status_code == 201
        assert resp.json()["employee_number"].startswith("EMP-")

    def test_create_combined_user_rejects_admin_role(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        payload = {
            "name": "Bad Role",
            "email": "badrole@example.com",
            "password": "Str0ngPassword!",
            "role": "admin",
            "first_name": "Bad",
            "last_name": "Role",
            "department": "Sales",
            "position": "Associate",
            "hire_date": "2026-01-01T00:00:00",
        }
        resp = client.post("/admin/users", json=payload, headers=auth_headers(admin))
        assert resp.status_code == 422

    def test_duplicate_email_returns_400(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        payload = {
            "name": "Dup",
            "email": admin.email,
            "password": "Str0ngPassword!",
            "role": "employee",
            "first_name": "Dup",
            "last_name": "Licate",
            "department": "Sales",
            "position": "Associate",
            "hire_date": "2026-01-01T00:00:00",
        }
        resp = client.post("/admin/users", json=payload, headers=auth_headers(admin))
        assert resp.status_code == 400


class TestModulePermissions:
    def test_update_permissions_for_employee(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        employee = make_user(email="perm@example.com", role=UserRole.employee)
        resp = client.patch(
            f"/admin/users/{employee.id}/permissions",
            json={"permissions": ["products", "reports"]},
            headers=auth_headers(admin),
        )
        assert resp.status_code == 200
        assert resp.json()["module_permissions"] == ["products", "reports"]

    def test_cannot_set_permissions_on_superadmin(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        other_admin = make_user(email="admin2@example.com", role=UserRole.superadmin)
        resp = client.patch(
            f"/admin/users/{other_admin.id}/permissions",
            json={"permissions": ["products"]},
            headers=auth_headers(admin),
        )
        assert resp.status_code == 400

    def test_unsupported_permission_rejected(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        employee = make_user(email="perm2@example.com", role=UserRole.employee)
        resp = client.patch(
            f"/admin/users/{employee.id}/permissions",
            json={"permissions": ["root_access"]},
            headers=auth_headers(admin),
        )
        assert resp.status_code == 422

    def test_non_superadmin_cannot_update_permissions(self, client, make_user, auth_headers):
        hr = make_user(role=UserRole.hr)
        employee = make_user(email="perm3@example.com", role=UserRole.employee)
        resp = client.patch(
            f"/admin/users/{employee.id}/permissions",
            json={"permissions": ["products"]},
            headers=auth_headers(hr),
        )
        assert resp.status_code == 403


class TestEmployeeRoutes:
    def test_create_employee_requires_hr_or_admin(self, client, make_user, auth_headers):
        employee = make_user(role=UserRole.employee, module_permissions=["employees"])
        payload = {
            "employee_id": "EMP-9001",
            "first_name": "A",
            "last_name": "B",
            "email": "ab@example.com",
            "department": "Ops",
            "position": "Staff",
            "hire_date": "2026-01-01T00:00:00",
        }
        resp = client.post("/api/employees", json=payload, headers=auth_headers(employee))
        assert resp.status_code == 403

    def test_hr_can_create_employee(self, client, make_user, auth_headers):
        hr = make_user(role=UserRole.hr)
        payload = {
            "employee_id": "EMP-9002",
            "first_name": "A",
            "last_name": "B",
            "email": "ab2@example.com",
            "department": "Ops",
            "position": "Staff",
            "hire_date": "2026-01-01T00:00:00",
        }
        resp = client.post("/api/employees", json=payload, headers=auth_headers(hr))
        assert resp.status_code == 201

    def test_duplicate_employee_id_rejected(self, client, make_user, auth_headers):
        hr = make_user(role=UserRole.hr)
        payload = {
            "employee_id": "EMP-9003",
            "first_name": "A",
            "last_name": "B",
            "email": "ab3@example.com",
            "department": "Ops",
            "position": "Staff",
            "hire_date": "2026-01-01T00:00:00",
        }
        client.post("/api/employees", json=payload, headers=auth_headers(hr))
        resp = client.post(
            "/api/employees",
            json={**payload, "email": "different@example.com"},
            headers=auth_headers(hr),
        )
        assert resp.status_code == 400

    def test_only_superadmin_can_delete_employee(self, client, make_user, make_employee, auth_headers):
        hr = make_user(role=UserRole.hr)
        employee = make_employee()
        resp = client.delete(f"/api/employees/{employee.id}", headers=auth_headers(hr))
        assert resp.status_code == 403
        admin = make_user(role=UserRole.superadmin)
        resp2 = client.delete(f"/api/employees/{employee.id}", headers=auth_headers(admin))
        assert resp2.status_code == 204


class TestAuditLogs:
    def test_audit_logs_require_superadmin(self, client, make_user, auth_headers):
        hr = make_user(role=UserRole.hr)
        resp = client.get("/admin/audit-logs", headers=auth_headers(hr))
        assert resp.status_code == 403

    def test_superadmin_can_view_audit_logs(self, client, make_user, make_employee, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        user = make_user(email="audited@example.com", role=UserRole.employee)
        make_employee(user=user)
        client.post(
            "/api/work-logs",
            json={"date": "2026-01-01", "task_name": "Test", "hours": 1},
            headers=auth_headers(user),
        )
        resp = client.get("/admin/audit-logs", headers=auth_headers(admin))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1
