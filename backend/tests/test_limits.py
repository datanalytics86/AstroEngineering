"""H-03 / H-06 / H-29: límites de entrada, health sin cupo, strip_whitespace."""

from fastapi.testclient import TestClient

import main

client = TestClient(main.app)

CHART = {
    "name": "  Ada  ",
    "birth_date": "1990-05-15",
    "birth_time": "14:30",
    "latitude": -33.4489,
    "longitude": -70.6693,
    "timezone_offset": -4,
}


def test_health_unlimited():
    codes = [client.get("/health").status_code for _ in range(15)]
    assert codes == [200] * 15


def test_strip_whitespace_on_name():
    resp = client.post("/api/chart", json=CHART)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Ada"


def test_transits_rejects_400_planets_fast():
    planets = [{"name": f"P{i}", "longitude": i % 360} for i in range(400)]
    resp = client.post("/api/transits", json={
        "natal_planets": planets,
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "latitude": -33.45,
        "longitude": -70.67,
    })
    assert resp.status_code == 422


def test_transits_rejects_empty_natal_planets():
    resp = client.post("/api/transits", json={
        "natal_planets": [],
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "latitude": -33.45,
        "longitude": -70.67,
    })
    assert resp.status_code == 422


def test_transits_rejects_21_planets():
    planets = [{"name": f"P{i}", "longitude": 1.0} for i in range(21)]
    resp = client.post("/api/transits", json={
        "natal_planets": planets,
        "start_date": "2026-01-01",
        "end_date": "2026-06-30",
        "latitude": -33.45,
        "longitude": -70.67,
    })
    assert resp.status_code == 422


def test_body_over_64kb_is_413():
    huge = dict(CHART)
    huge["name"] = "x" * (70 * 1024)
    resp = client.post("/api/chart", json=huge)
    assert resp.status_code in (413, 422)
