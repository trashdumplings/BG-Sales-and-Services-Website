from server.models import UserRole


def catalog_payload(**overrides):
    data = dict(
        sku="ROUTE-SKU-1",
        title="Route Test Router",
        brand="Acme",
        category="networking",
        price=500,
        short_description="Reliable networking gear",
        description="A longer description of the router for tests.",
        is_published=True,
    )
    data.update(overrides)
    return data


class TestPublicProductRoutes:
    def test_list_public_products_no_auth_required(self, client):
        resp = client.get("/api/products/public")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_public_product_404_for_unknown_slug(self, client):
        resp = client.get("/api/products/public/does-not-exist")
        assert resp.status_code == 404

    def test_public_products_expose_presentation_fields_only(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        create_resp = client.post(
            "/api/products",
            json=catalog_payload(stock=7),
            headers=auth_headers(admin),
        )
        slug = create_resp.json()["slug"]

        for response in (
            client.get("/api/products/public"),
            client.get(f"/api/products/public/{slug}"),
        ):
            assert response.status_code == 200
            payload = response.json()
            product = payload[0] if isinstance(payload, list) else payload
            assert product["in_stock"] is True
            assert {"id", "sku", "stock", "is_published", "created_at", "updated_at"}.isdisjoint(product)

    def test_restricted_product_response_retains_operational_fields(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        create_resp = client.post(
            "/api/products",
            json=catalog_payload(stock=7),
            headers=auth_headers(admin),
        )
        product_id = create_resp.json()["id"]
        response = client.get(f"/api/products/{product_id}", headers=auth_headers(admin))
        assert response.status_code == 200
        assert response.json()["sku"] == "ROUTE-SKU-1"
        assert response.json()["stock"] == 7

    def test_record_interaction_rejects_bad_event_type(self, client, make_user, auth_headers, db_session):
        admin = make_user(role=UserRole.superadmin)
        create_resp = client.post("/api/products", json=catalog_payload(), headers=auth_headers(admin))
        slug = create_resp.json()["slug"]
        resp = client.post(f"/api/products/public/{slug}/interaction", json={"event_type": "hack_attempt"})
        assert resp.status_code == 422

    def test_record_interaction_accepts_valid_event_type(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        create_resp = client.post("/api/products", json=catalog_payload(), headers=auth_headers(admin))
        slug = create_resp.json()["slug"]
        resp = client.post(f"/api/products/public/{slug}/interaction", json={"event_type": "view"})
        assert resp.status_code == 204


class TestAdminProductRoutesPermissions:
    def test_list_requires_auth(self, client):
        resp = client.get("/api/products")
        assert resp.status_code == 401

    def test_employee_without_permission_forbidden(self, client, make_user, auth_headers):
        employee = make_user(role=UserRole.employee, module_permissions=[])
        resp = client.get("/api/products", headers=auth_headers(employee))
        assert resp.status_code == 403

    def test_employee_with_products_permission_allowed(self, client, make_user, auth_headers):
        employee = make_user(role=UserRole.employee, module_permissions=["products"])
        resp = client.get("/api/products", headers=auth_headers(employee))
        assert resp.status_code == 200

    def test_hr_without_explicit_products_permission_forbidden(self, client, make_user, auth_headers):
        hr = make_user(role=UserRole.hr)
        resp = client.get("/api/products", headers=auth_headers(hr))
        assert resp.status_code == 403

    def test_superadmin_always_allowed(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        resp = client.get("/api/products", headers=auth_headers(admin))
        assert resp.status_code == 200


class TestAdminProductCrud:
    def test_create_and_delete_empty_category(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        headers = auth_headers(admin)
        created = client.post("/api/products/categories", json={"name": "Security Cameras"}, headers=headers)
        assert created.status_code == 201
        assert created.json()["slug"] == "security-cameras"
        assert any(item["slug"] == "security-cameras" for item in client.get("/api/products/categories", headers=headers).json())
        assert client.delete(f"/api/products/categories/{created.json()['id']}", headers=headers).status_code == 204

    def test_category_in_use_cannot_be_deleted(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        headers = auth_headers(admin)
        category = client.post("/api/products/categories", json={"name": "Routers"}, headers=headers).json()
        client.post("/api/products", json=catalog_payload(category=category["slug"]), headers=headers)
        response = client.delete(f"/api/products/categories/{category['id']}", headers=headers)
        assert response.status_code == 409
        assert "Move or delete" in response.json()["detail"]

    def test_create_and_fetch_product(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        create_resp = client.post("/api/products", json=catalog_payload(), headers=auth_headers(admin))
        assert create_resp.status_code == 201
        product_id = create_resp.json()["id"]
        get_resp = client.get(f"/api/products/{product_id}", headers=auth_headers(admin))
        assert get_resp.status_code == 200
        assert get_resp.json()["sku"] == "ROUTE-SKU-1"

    def test_create_duplicate_sku_rejected(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        client.post("/api/products", json=catalog_payload(), headers=auth_headers(admin))
        resp = client.post("/api/products", json=catalog_payload(slug="different-slug"), headers=auth_headers(admin))
        assert resp.status_code == 400

    def test_create_rejects_negative_price(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        resp = client.post("/api/products", json=catalog_payload(price=-10), headers=auth_headers(admin))
        assert resp.status_code == 422

    def test_delete_product(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        create_resp = client.post("/api/products", json=catalog_payload(), headers=auth_headers(admin))
        product_id = create_resp.json()["id"]
        delete_resp = client.delete(f"/api/products/{product_id}", headers=auth_headers(admin))
        assert delete_resp.status_code == 204
        get_resp = client.get(f"/api/products/{product_id}", headers=auth_headers(admin))
        assert get_resp.status_code == 404

    def test_published_product_appears_in_public_listing(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        client.post("/api/products", json=catalog_payload(is_published=True), headers=auth_headers(admin))
        resp = client.get("/api/products/public")
        assert len(resp.json()) == 1

    def test_unpublished_product_absent_from_public_listing(self, client, make_user, auth_headers):
        admin = make_user(role=UserRole.superadmin)
        client.post("/api/products", json=catalog_payload(is_published=False), headers=auth_headers(admin))
        resp = client.get("/api/products/public")
        assert resp.json() == []
