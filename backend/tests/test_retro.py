"""Tests de `astro/transits.py::compute_retrograde_periods`: verifica que las
retrogradaciones de Mercurio, Venus y Marte para 2026 caen dentro de rangos
astronómicamente esperados (sin valores inventados, solo cotas conocidas de
duración típica de cada planeta) y que el endpoint las expone."""

from fastapi.testclient import TestClient

from astro.transits import compute_retrograde_periods
from astro.houses import SIGN_NAMES

import main

client = TestClient(main.app)


def test_mercury_retrogrades_2026():
    periods = [p for p in compute_retrograde_periods(2026) if p["planet"] == "Mercurio"]
    # Mercurio retrograda 3-4 veces al año
    assert 3 <= len(periods) <= 4
    for p in periods:
        assert p["start_date"] < p["end_date"]
        assert 15 <= p["days"] <= 35
        assert p["start_sign"] in SIGN_NAMES
        assert p["end_sign"] in SIGN_NAMES
        assert p["symbol"] == "☿"


def test_venus_retrogrades_2026():
    periods = [p for p in compute_retrograde_periods(2026) if p["planet"] == "Venus"]
    assert 0 <= len(periods) <= 1
    for p in periods:
        assert p["start_date"] < p["end_date"]
        assert 35 <= p["days"] <= 50
        assert p["start_sign"] in SIGN_NAMES
        assert p["end_sign"] in SIGN_NAMES


def test_mars_retrogrades_2026():
    periods = [p for p in compute_retrograde_periods(2026) if p["planet"] == "Marte"]
    assert 0 <= len(periods) <= 1
    for p in periods:
        assert p["start_date"] < p["end_date"]
        assert 55 <= p["days"] <= 85
        assert p["start_sign"] in SIGN_NAMES
        assert p["end_sign"] in SIGN_NAMES


def test_retro_periods_sorted_and_dated():
    periods = compute_retrograde_periods(2026)
    assert periods == sorted(periods, key=lambda p: p["start_date"])
    for p in periods:
        assert p["start_date"] < p["end_date"]


def test_transits_endpoint_includes_retro_periods():
    natal_planets = [{"name": "Sol", "longitude": 54.62}]
    resp = client.post("/api/transits", json={
        "natal_planets": natal_planets,
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "latitude": -33.4489,
        "longitude": -70.6693,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "retro_periods" in data
    assert len(data["retro_periods"]) >= 1
    for p in data["retro_periods"]:
        assert set(p.keys()) >= {
            "planet", "symbol", "start_date", "end_date",
            "start_sign", "end_sign", "days",
        }
