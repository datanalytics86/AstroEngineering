"""Tests de alto valor para hardening Tier-1 (CORS, handlers, Sentry fail-soft)."""

from unittest.mock import patch

from fastapi.testclient import TestClient

import main
from slowapi.errors import RateLimitExceeded


def test_rate_limit_handler_is_official_slowapi_handler():
    """RateLimitExceeded usa el handler oficial (devuelve Response, no dict)."""
    handler = main.app.exception_handlers[RateLimitExceeded]
    assert handler is main._rate_limit_exceeded_handler


def test_generic_exception_handler_returns_json_without_stack():
    """Excepciones genéricas → 500 JSON limpio, sin stack ni paths internos."""
    import asyncio
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
        "headers": [],
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
    }
    request = Request(scope)
    resp = asyncio.get_event_loop().run_until_complete(
        main.generic_exception_handler(request, RuntimeError("secret path /var/internal/secret"))
    )
    assert resp.status_code == 500
    body = resp.body.decode()
    assert body == '{"detail":"Error interno del servidor"}'
    assert "secret" not in body
    assert "Traceback" not in body
    assert "RuntimeError" not in body


def test_production_cors_excludes_localhost_and_open_regex():
    """Production: solo orígenes exactos; sin localhost ni regex abierta."""
    origins, regex = main.build_cors_config(
        "production",
        frontend_url="https://astro-engineering.vercel.app",
        extra_origins="",
    )
    assert origins == ["https://astro-engineering.vercel.app"]
    assert regex is None
    assert "http://localhost:3000" not in origins

    origins2, regex2 = main.build_cors_config(
        "production",
        frontend_url="https://astro-engineering.vercel.app",
        extra_origins="https://preview.example.com",
    )
    assert origins2 == [
        "https://astro-engineering.vercel.app",
        "https://preview.example.com",
    ]
    assert regex2 is None


def test_development_cors_includes_localhost_and_codespaces_regex():
    origins, regex = main.build_cors_config("development")
    assert "http://localhost:3000" in origins
    assert regex is not None
    assert "github" in regex
    assert "app.github" in regex or r"\.github\." in regex


def test_sentry_disabled_without_dsn():
    """Sin SENTRY_DSN la app sigue viva; flag fail-soft en False en este proceso de test."""
    # El proceso de test no define SENTRY_DSN (CI/local).
    assert main._SENTRY_ENABLED is False
    client = TestClient(main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_chart_error_does_not_leak_exception_text():
    """Errores de cálculo devuelven mensaje genérico (sin PII ni internals)."""
    client = TestClient(main.app, raise_server_exceptions=False)

    with patch(
        "main.calculate_natal_chart",
        side_effect=RuntimeError("internal: /home/astro/secret"),
    ):
        resp = client.post(
            "/api/chart",
            json={
                "name": "Test",
                "birth_date": "1990-05-15",
                "birth_time": "14:30",
                "latitude": -33.45,
                "longitude": -70.67,
                "timezone_offset": -4,
            },
        )
    assert resp.status_code == 500
    assert resp.json() == {"detail": "Error en cálculo de carta"}
    assert "secret" not in resp.text
    assert "internal" not in resp.text
