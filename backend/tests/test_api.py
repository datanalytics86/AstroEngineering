"""Tests de integración de `main.py` vía TestClient (sin red real).
El rate limit del endpoint /api/mundane es 5/min: cada test usa como máximo
una llamada para no agotarlo dentro del mismo proceso de test."""

from fastapi.testclient import TestClient

import main

client = TestClient(main.app)

CHART_EXAMPLE = {
    "name": "Nicolás",
    "birth_date": "1990-05-15",
    "birth_time": "14:30",
    "latitude": -33.4489,
    "longitude": -70.6693,
    "timezone_offset": -4,
}


def test_health_ok():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_chart_endpoint_ok():
    resp = client.post("/api/chart", json=CHART_EXAMPLE)
    assert resp.status_code == 200
    data = resp.json()
    # Quirón puede faltar si no hay archivo de efemérides de asteroides
    # disponible (fallback Moshier no lo calcula); el resto siempre está.
    assert len(data["planets"]) in (11, 12)
    assert len(data["houses"]) == 12


def test_chart_endpoint_validation_error():
    bad = dict(CHART_EXAMPLE)
    bad["birth_date"] = "not-a-date"
    resp = client.post("/api/chart", json=bad)
    assert resp.status_code == 422


def test_mundane_endpoint_world_mode_ok():
    resp = client.post("/api/mundane", json={
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "natal_planets": [],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "configurations" in data
    assert "cyclic_index" in data


def test_mundane_endpoint_natal_mode_ok():
    resp = client.post("/api/mundane", json={
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "natal_planets": [{"name": "Sol", "longitude": 54.62}],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["natal_impacts"], list)


def test_mundane_endpoint_validation_error():
    resp = client.post("/api/mundane", json={
        "start_date": "2026-12-31",
        "end_date": "2026-01-01",  # end antes que start -> inválido
        "natal_planets": [],
    })
    assert resp.status_code == 422


# ── A-5: validación estructural de natal_planets ─────────────────────────────

TRANSIT_EXAMPLE = {
    "natal_planets": [{"name": "Sol", "longitude": 54.62}],
    "start_date": "2026-01-01",
    "end_date": "2026-06-30",
    "latitude": -33.4489,
    "longitude": -70.6693,
}


def test_transits_endpoint_rejects_out_of_range_longitude():
    bad = dict(TRANSIT_EXAMPLE)
    bad["natal_planets"] = [{"name": "Sol", "longitude": 999}]
    resp = client.post("/api/transits", json=bad)
    assert resp.status_code == 422


def test_transits_endpoint_rejects_empty_name():
    bad = dict(TRANSIT_EXAMPLE)
    bad["natal_planets"] = [{"name": "", "longitude": 54.62}]
    resp = client.post("/api/transits", json=bad)
    assert resp.status_code == 422


def test_transits_endpoint_accepts_full_planet_position_payload():
    # El frontend envía objetos PlanetPosition completos (con symbol, sign,
    # casa, etc.); pydantic v2 debe ignorar los campos extra y seguir
    # aceptando el payload real.
    full = dict(TRANSIT_EXAMPLE)
    full["natal_planets"] = [{
        "name": "Sol", "symbol": "☉", "longitude": 54.62, "sign": "Géminis",
        "sign_symbol": "♊", "degree_in_sign": 24.62, "degree_display": "24°37'",
        "house": 10, "retrograde": False, "speed": 0.96,
    }]
    resp = client.post("/api/transits", json=full)
    assert resp.status_code == 200


def test_mundane_endpoint_rejects_invalid_natal_planet():
    resp = client.post("/api/mundane", json={
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "natal_planets": [{"name": "Sol", "longitude": -10}],
    })
    assert resp.status_code == 422
