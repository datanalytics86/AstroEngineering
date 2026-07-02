"""Tests de `astro/mundane.py`: configuraciones mundiales 2026, matching de
análogos históricos por ciclo, índice cíclico e impactos natales."""

from astro.mundane import (
    find_mundane_configurations,
    match_historical_analogs,
    compute_cyclic_index,
    build_mundane_forecast,
)


def test_find_configurations_includes_saturn_neptune_conjunction_2026():
    configs = find_mundane_configurations("2026-01-01", "2026-12-31")
    saturn_neptune = [
        c for c in configs
        if c["kind"] == "aspect"
        and set(c["bodies"]) == {"Saturno", "Neptuno"}
        and c["aspect"] == "Conjunción"
    ]
    assert len(saturn_neptune) >= 1
    assert saturn_neptune[0]["exact_date"] == "2026-02-20"


def test_build_forecast_configs_within_requested_range():
    forecast = build_mundane_forecast("2026-01-01", "2026-12-31")
    for cfg in forecast["configurations"]:
        assert "2026-01-01" <= cfg["exact_date"] <= "2026-12-31"


def test_match_historical_analogs_saturn_uranus_2026_includes_constantinople_phase():
    configs = find_mundane_configurations("2026-01-01", "2026-12-31")
    saturn_uranus = [c for c in configs if set(c["bodies"]) == {"Saturno", "Urano"}]
    assert len(saturn_uranus) >= 1

    found_phase_match = False
    for cfg in saturn_uranus:
        analogs = match_historical_analogs(cfg)
        for analog in analogs:
            if analog["id"] == "constantinopla_1453":
                assert analog["match_type"] == "phase"
                found_phase_match = True
    assert found_phase_match


def test_compute_cyclic_index_twelve_points_positive():
    points = compute_cyclic_index("2026-01-01", "2026-12-31")
    assert len(points) == 12
    for p in points:
        assert p["value"] > 0
        assert p["month"].startswith("2026-")


def test_build_forecast_with_natal_planets_produces_valid_impacts():
    natal_planets = [
        {"name": "Sol", "longitude": 54.62},
        {"name": "Luna", "longitude": 120.0},
        {"name": "Ascendente", "longitude": 200.0},
    ]
    forecast = build_mundane_forecast("2026-01-01", "2026-12-31", natal_planets=natal_planets)
    config_ids = {c["id"] for c in forecast["configurations"]}
    assert len(forecast["natal_impacts"]) > 0
    for impact in forecast["natal_impacts"]:
        assert impact["config_id"] in config_ids
        assert impact["natal_planet"] in {"Sol", "Luna", "Ascendente"}
        assert impact["importance"] in {"crítica", "alta", "media", "baja"}


def test_build_forecast_without_natal_planets_has_no_impacts():
    forecast = build_mundane_forecast("2026-01-01", "2026-06-30")
    assert forecast["natal_impacts"] == []
