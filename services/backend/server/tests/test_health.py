from sqlalchemy.exc import OperationalError


def test_readiness_checks_database(client):
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"


def test_readiness_fails_closed_when_database_is_unavailable(client, monkeypatch):
    from server import main

    class BrokenEngine:
        def connect(self):
            raise OperationalError("SELECT 1", {}, RuntimeError("offline"))

    monkeypatch.setattr(main, "engine", BrokenEngine())
    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json() == {"detail": "Database unavailable"}
