import pytest
from pydantic import ValidationError

from server.models import UserRole
from server.schemas import (
    CombinedUserCreate,
    ProfileUpdate,
    ProductInteractionCreate,
)


def make_combined_user(**overrides):
    data = dict(
        name="Jane Doe",
        email="jane@example.com",
        password="Str0ngPassw0rd!",
        role=UserRole.employee,
        first_name="Jane",
        last_name="Doe",
        department="Sales",
        position="Rep",
        hire_date="2026-01-01T00:00:00",
    )
    data.update(overrides)
    return CombinedUserCreate(**data)


class TestCombinedUserCreateRole:
    def test_employee_role_accepted(self):
        assert make_combined_user(role=UserRole.employee).role == UserRole.employee

    def test_superadmin_role_accepted(self):
        assert make_combined_user(role=UserRole.superadmin).role == UserRole.superadmin

    def test_admin_role_rejected(self):
        with pytest.raises(ValidationError):
            make_combined_user(role=UserRole.admin)


class TestCombinedUserCreatePhone:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("17123456", "+97517123456"),
            ("77123456", "+97577123456"),
            ("975 17 12 34 56", "+97517123456"),
            ("+975-77-12-34-56", "+97577123456"),
        ],
    )
    def test_valid_bhutan_numbers_normalized(self, raw, expected):
        assert make_combined_user(phone=raw).phone == expected

    def test_none_phone_allowed(self):
        assert make_combined_user(phone=None).phone is None

    @pytest.mark.parametrize(
        "raw",
        [
            "12345678",  # doesn't start with 17/77
            "1712345",  # too short
            "171234567",  # too long
            "abcdefgh",  # not digits
        ],
    )
    def test_invalid_numbers_rejected(self, raw):
        with pytest.raises(ValidationError):
            make_combined_user(phone=raw)


class TestProfileUpdate:
    def test_collapses_internal_whitespace(self):
        assert ProfileUpdate(name="  Jane   Doe  ").name == "Jane Doe"

    def test_empty_phone_becomes_none(self):
        assert ProfileUpdate(name="Jane Doe", phone="   ").phone is None

    def test_name_too_short_rejected(self):
        with pytest.raises(ValidationError):
            ProfileUpdate(name="J")


class TestProductInteractionCreate:
    @pytest.mark.parametrize("event_type", ["view", "quote_add", "quote_submit"])
    def test_allowed_event_types(self, event_type):
        assert ProductInteractionCreate(event_type=event_type).event_type == event_type

    def test_unknown_event_type_rejected(self):
        with pytest.raises(ValidationError):
            ProductInteractionCreate(event_type="delete_everything")
