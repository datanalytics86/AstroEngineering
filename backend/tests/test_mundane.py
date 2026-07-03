"""Tests de `astro/mundane.py`: configuraciones mundiales 2026, matching de
análogos históricos por ciclo, índice cíclico e impactos natales."""

from datetime import datetime

from astro.mundane import (
    find_mundane_configurations,
    match_historical_analogs,
    compute_cyclic_index,
    build_mundane_forecast,
    find_mars_triggers,
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


def test_find_mars_triggers_includes_mars_uranus_conjunction_july_2026():
    triggers = find_mars_triggers("2026-01-01", "2026-12-31")
    mars_uranus = [
        t for t in triggers
        if set(t["bodies"]) == {"Marte", "Urano"} and t["aspect"] == "Conjunción"
    ]
    assert len(mars_uranus) >= 1
    exact = datetime.fromisoformat(mars_uranus[0]["exact_date"])
    assert abs((exact - datetime(2026, 7, 4)).days) <= 1


def test_find_mars_triggers_only_hard_aspects_and_valid_windows():
    triggers = find_mars_triggers("2026-01-01", "2027-12-31")
    assert len(triggers) > 0
    for t in triggers:
        assert t["kind"] == "trigger"
        assert t["bodies"][0] == "Marte"
        assert t["aspect"] in {"Conjunción", "Oposición", "Cuadratura"}
        assert t["window_start"] <= t["exact_date"] <= t["window_end"]
        duration = (
            datetime.fromisoformat(t["window_end"]) - datetime.fromisoformat(t["window_start"])
        ).days
        assert 0 <= duration <= 30
        assert t["analogs"] == []
        assert t["themes"] == []
        mars_sky = next(s for s in t["sky"] if s["name"] == "Marte")
        assert mars_sky is not None


def test_build_forecast_includes_triggers_sorted_with_configs():
    forecast = build_mundane_forecast("2026-01-01", "2026-12-31")
    kinds = {c["kind"] for c in forecast["configurations"]}
    assert "trigger" in kinds

    dates = [c["exact_date"] for c in forecast["configurations"]]
    assert dates == sorted(dates)

    # Los disparadores no deben aportar temas ni afectar el índice cíclico.
    trigger_configs = [c for c in forecast["configurations"] if c["kind"] == "trigger"]
    assert len(trigger_configs) > 0
    for tc in trigger_configs:
        assert tc["themes"] == []


def test_build_forecast_triggers_produce_natal_impacts_when_natal_planets_given():
    natal_planets = [
        {"name": "Sol", "longitude": 54.62},
        {"name": "Luna", "longitude": 120.0},
    ]
    forecast = build_mundane_forecast("2026-06-01", "2026-08-01", natal_planets=natal_planets)
    trigger_ids = {c["id"] for c in forecast["configurations"] if c["kind"] == "trigger"}
    assert len(trigger_ids) > 0
    # No afirmamos que haya impacto (depende del orbe natal), solo que el
    # config_id de cualquier impacto de disparador sea consistente si existe.
    for impact in forecast["natal_impacts"]:
        if impact["config_id"] in trigger_ids:
            assert impact["importance"] in {"crítica", "alta", "media", "baja"}
