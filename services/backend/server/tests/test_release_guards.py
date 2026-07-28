import unittest
from unittest.mock import patch

from pydantic import ValidationError

from server.config import Settings
from server.schemas import ModulePermissionsUpdate, PasswordChange
from server.utils.auth import get_password_hash, users_with_default_passwords


PRODUCTION_ENV = {
    "DEBUG": "false",
    "JWT_SECRET": "a-secure-production-secret-that-is-long-enough-123456",
    "ALLOW_PUBLIC_REGISTRATION": "false",
    "AUTO_CREATE_TABLES": "false",
    "ENFORCE_HTTPS": "true",
    "TRUSTED_HOSTS": "example.com,api.example.com",
    "CORS_ORIGINS": "https://example.com",
}


class ProductionConfigurationTests(unittest.TestCase):
    def settings(self, **overrides):
        values = {**PRODUCTION_ENV, **overrides}
        with patch.dict("os.environ", values, clear=True):
            return Settings(_env_file=None)

    def test_secure_production_configuration_is_accepted(self):
        settings = self.settings()
        settings.validate_production()

    def test_weak_secret_is_rejected(self):
        settings = self.settings(JWT_SECRET="short")
        with self.assertRaisesRegex(RuntimeError, "JWT_SECRET"):
            settings.validate_production()

    def test_placeholder_secret_is_rejected(self):
        settings = self.settings(JWT_SECRET="replace-with-at-least-32-random-characters")
        with self.assertRaisesRegex(RuntimeError, "JWT_SECRET"):
            settings.validate_production()

    def test_public_registration_is_rejected(self):
        settings = self.settings(ALLOW_PUBLIC_REGISTRATION="true")
        with self.assertRaisesRegex(RuntimeError, "ALLOW_PUBLIC_REGISTRATION"):
            settings.validate_production()

    def test_auto_create_tables_is_rejected(self):
        settings = self.settings(AUTO_CREATE_TABLES="true")
        with self.assertRaisesRegex(RuntimeError, "AUTO_CREATE_TABLES"):
            settings.validate_production()

    def test_insecure_origins_are_rejected(self):
        settings = self.settings(CORS_ORIGINS="http://example.com")
        with self.assertRaisesRegex(RuntimeError, "HTTPS"):
            settings.validate_production()


class SecuritySchemaTests(unittest.TestCase):
    def test_default_account_password_is_detected(self):
        user = type("UserStub", (), {
            "email": "admin@example.com",
            "is_active": True,
            "password_hash": get_password_hash("superadmin123"),
        })()
        self.assertEqual(users_with_default_passwords([user]), ["admin@example.com"])

    def test_password_policy_accepts_strong_password(self):
        value = PasswordChange(current_password="old", new_password="Stronger-Password-42")
        self.assertEqual(value.new_password, "Stronger-Password-42")

    def test_password_policy_rejects_weak_password(self):
        with self.assertRaises(ValidationError):
            PasswordChange(current_password="old", new_password="alllowercase")

    def test_module_permissions_are_deduplicated_and_sorted(self):
        value = ModulePermissionsUpdate(permissions=["reports", "products", "reports"])
        self.assertEqual(value.permissions, ["products", "reports"])

    def test_unknown_module_permission_is_rejected(self):
        with self.assertRaises(ValidationError):
            ModulePermissionsUpdate(permissions=["root_access"])


if __name__ == "__main__":
    unittest.main()
