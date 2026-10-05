"""H-05: proxy firmado. En production, 403 sin secreto excepto GET /health."""

from fastapi.testclient import TestClient

import main


def test_production_rejects_unsigned_chart(monkeypatch):
    monkeypatch.setattr(main, "_env", "production")
    monkeypatch.setattr(main, "_PROXY_KEY", "test-secret")
    client = TestClient(main.app)
    resp = client.post("/api/chart", json={
        "name": "Ada",
        "birth_date": "1990-05-15",
        "birth_time": "14:30",
        "latitude": -33.45,
        "longitude": -70.67,
        "timezone_offset": -4,
    })
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Forbidden"


def test_production_health_open_without_key(monkeypatch):
    monkeypatch.setattr(main, "_env", "production")
    monkeypatch.setattr(main, "_PROXY_KEY", "test-secret")
    client = TestClient(main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_production_accepts_signed_health_and_chart_key_only(monkeypatch):
    monkeypatch.setattr(main, "_env", "production")
    monkeypatch.setattr(main, "_PROXY_KEY", "test-secret")
    client = TestClient(main.app)
    resp = client.get(
        "/health",
        headers={"X-Astro-Proxy-Key": "test-secret", "X-Astro-Client-IP": "203.0.113.9"},
    )
    assert resp.status_code == 200


def test_signed_client_ip_prefers_proxy_header():
    from starlette.requests import Request

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/",
        "raw_path": b"/",
        "query_string": b"",
        "headers": [(b"x-astro-client-ip", b"203.0.113.9")],
        "client": ("127.0.0.1", 50000),
        "server": ("testserver", 80),
    }
    request = Request(scope)
    assert main.signed_client_ip(request) == "203.0.113.9"
