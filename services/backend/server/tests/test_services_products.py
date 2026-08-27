import pytest
from fastapi import HTTPException

from server.services.products import (
    make_slug,
    normalize_catalog_payload,
    ensure_unique_catalog_identity,
    create_catalog_product_service,
    update_catalog_product_service,
    delete_catalog_product_service,
    get_public_product_service,
    list_public_products_service,
    list_product_categories_service,
)
from server.schemas import CatalogProductCreate, CatalogProductUpdate


def make_payload(**overrides):
    data = dict(
        sku="sku-001",
        title="Test Laptop",
        brand="Acme",
        category="laptop",
        price=1000,
        short_description="A perfectly fine laptop",
        description="A longer description of the laptop.",
    )
    data.update(overrides)
    return CatalogProductCreate(**data)


class TestMakeSlug:
    def test_lowercases_and_hyphenates(self):
        assert make_slug("HP LaserJet Pro") == "hp-laserjet-pro"

    def test_strips_leading_trailing_punctuation(self):
        assert make_slug("--Wireless Mouse!!--") == "wireless-mouse"

    def test_empty_input_falls_back_to_product(self):
        assert make_slug("") == "product"

    def test_only_symbols_falls_back_to_product(self):
        assert make_slug("***") == "product"


class TestNormalizeCatalogPayload:
    def test_normalizes_slug_sku_and_specs(self):
        data = {"slug": "My Slug", "sku": " abc-1 ", "specs": ["  16GB RAM  ", "", "   "]}
        result = normalize_catalog_payload(data)
        assert result["slug"] == "my-slug"
        assert result["sku"] == "ABC-1"
        assert result["specs"] == ["16GB RAM"]

    def test_leaves_missing_fields_untouched(self):
        data = {"title": "Untouched"}
        result = normalize_catalog_payload(data)
        assert result == {"title": "Untouched"}


class TestEnsureUniqueCatalogIdentity:
    def test_allows_first_product(self, db_session):
        ensure_unique_catalog_identity(db_session, "unique-slug", "UNIQUE-SKU")

    def test_rejects_duplicate_slug(self, db_session):
        create_catalog_product_service(db_session, make_payload(slug="dup-slug", sku="SKU-A"))
        with pytest.raises(HTTPException) as exc:
            ensure_unique_catalog_identity(db_session, "dup-slug", "SKU-B")
        assert exc.value.status_code == 400
        assert "slug" in exc.value.detail

    def test_rejects_duplicate_sku(self, db_session):
        create_catalog_product_service(db_session, make_payload(slug="slug-a", sku="DUP-SKU"))
        with pytest.raises(HTTPException) as exc:
            ensure_unique_catalog_identity(db_session, "slug-b", "DUP-SKU")
        assert exc.value.status_code == 400
        assert "SKU" in exc.value.detail

    def test_excludes_self_on_update(self, db_session):
        product = create_catalog_product_service(db_session, make_payload(slug="slug-c", sku="SKU-C"))
        # Should not raise when checking against its own id
        ensure_unique_catalog_identity(db_session, "slug-c", "SKU-C", product_id=product.id)


class TestCreateCatalogProductService:
    def test_category_list_includes_defaults_and_categories_already_in_use(self, db_session):
        create_catalog_product_service(db_session, make_payload(category="security-cameras"))
        categories = list_product_categories_service(db_session)
        slugs = {category.slug for category in categories}
        assert {"laptop", "desktop", "printer", "security-cameras"}.issubset(slugs)

    def test_defaults_slug_from_title_when_missing(self, db_session):
        product = create_catalog_product_service(db_session, make_payload(slug=None, title="Brand New Router"))
        assert product.slug == "brand-new-router"

    def test_uppercases_and_strips_sku(self, db_session):
        product = create_catalog_product_service(db_session, make_payload(sku="  low-case-sku  "))
        assert product.sku == "LOW-CASE-SKU"

    def test_strips_empty_specs(self, db_session):
        product = create_catalog_product_service(db_session, make_payload(specs=["Fast", "  ", "Reliable"]))
        assert product.specs == ["Fast", "Reliable"]

    def test_duplicate_sku_rejected(self, db_session):
        create_catalog_product_service(db_session, make_payload(slug="first", sku="SAME-SKU"))
        with pytest.raises(HTTPException):
            create_catalog_product_service(db_session, make_payload(slug="second", sku="SAME-SKU"))


class TestUpdateCatalogProductService:
    def test_partial_update_only_changes_given_fields(self, db_session):
        product = create_catalog_product_service(db_session, make_payload(title="Original Title"))
        updated = update_catalog_product_service(db_session, product.id, CatalogProductUpdate(price=1234))
        assert updated.title == "Original Title"
        assert float(updated.price) == 1234

    def test_reslugs_when_slug_explicitly_provided(self, db_session):
        product = create_catalog_product_service(db_session, make_payload())
        updated = update_catalog_product_service(db_session, product.id, CatalogProductUpdate(slug="New Slug Here"))
        assert updated.slug == "new-slug-here"

    def test_missing_product_raises_404(self, db_session):
        with pytest.raises(HTTPException) as exc:
            update_catalog_product_service(db_session, 999999, CatalogProductUpdate(price=1))
        assert exc.value.status_code == 404

    def test_update_to_duplicate_sku_rejected(self, db_session):
        create_catalog_product_service(db_session, make_payload(slug="p1", sku="SKU-ONE"))
        p2 = create_catalog_product_service(db_session, make_payload(slug="p2", sku="SKU-TWO"))
        with pytest.raises(HTTPException):
            update_catalog_product_service(db_session, p2.id, CatalogProductUpdate(sku="SKU-ONE"))


class TestDeleteCatalogProductService:
    def test_delete_removes_product(self, db_session):
        product = create_catalog_product_service(db_session, make_payload())
        delete_catalog_product_service(db_session, product.id)
        with pytest.raises(HTTPException):
            update_catalog_product_service(db_session, product.id, CatalogProductUpdate(price=1))

    def test_delete_missing_product_raises_404(self, db_session):
        with pytest.raises(HTTPException) as exc:
            delete_catalog_product_service(db_session, 999999)
        assert exc.value.status_code == 404


class TestPublicProductServices:
    def test_unpublished_product_not_visible(self, db_session):
        product = create_catalog_product_service(db_session, make_payload(is_published=False))
        with pytest.raises(HTTPException) as exc:
            get_public_product_service(db_session, product.slug)
        assert exc.value.status_code == 404

    def test_published_product_visible(self, db_session):
        product = create_catalog_product_service(db_session, make_payload(is_published=True))
        found = get_public_product_service(db_session, product.slug)
        assert found.id == product.id

    def test_list_public_excludes_unpublished(self, db_session):
        create_catalog_product_service(db_session, make_payload(slug="pub", sku="PUB-1", is_published=True))
        create_catalog_product_service(db_session, make_payload(slug="unpub", sku="UNPUB-1", is_published=False))
        results = list_public_products_service(db_session)
        slugs = {p.slug for p in results}
        assert slugs == {"pub"}

    def test_list_public_filters_by_category(self, db_session):
        create_catalog_product_service(db_session, make_payload(slug="l1", sku="L-1", category="laptop", is_published=True))
        create_catalog_product_service(db_session, make_payload(slug="d1", sku="D-1", category="desktop", is_published=True))
        results = list_public_products_service(db_session, category="laptop")
        assert {p.slug for p in results} == {"l1"}

    def test_list_public_filters_by_search(self, db_session):
        create_catalog_product_service(db_session, make_payload(slug="find-me", sku="FM-1", title="Special Router", is_published=True))
        create_catalog_product_service(db_session, make_payload(slug="not-me", sku="NM-1", title="Ordinary Printer", is_published=True))
        results = list_public_products_service(db_session, search="router")
        assert {p.slug for p in results} == {"find-me"}
