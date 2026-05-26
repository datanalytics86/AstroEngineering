import re
from astro.chart import calculate_natal_chart, calculate_solar_return
from astro.transits import calculate_transit_timeline

SANTIAGO = {"name": "Test", "birth_date": "1990-05-15", "birth_time": "14:30",
            "latitude": -33.4489, "longitude": -70.6693, "timezone_offset": -4}


def test_natal_chart_structure():
    r = calculate_natal_chart(SANTIAGO)
    assert len(r["planets"]) >= 10          # 10 clásicos como mínimo
    assert r["ascendant"] and r["midheaven"]
    assert len(r["houses"]) == 12
    for p in r["planets"]:
        assert 0 <= p["longitude"] < 360
        assert 1 <= p["house"] <= 12


def test_sun_in_taurus_mid_may():
    # El Sol está en Tauro a mediados de mayo (hecho astronómico estable)
    r = calculate_natal_chart(SANTIAGO)
    sun = next(p for p in r["planets"] if p["name"] == "Sol")
    assert sun["sign"] == "Tauro"


def test_solar_return_time_strings_valid():
    # Regresión del bug de "24:00": las horas deben ser siempre HH:MM válidas
    for sun in (0.0, 54.62, 200.0, 359.9):
        for y in (2024, 2025, 2026):
            r = calculate_solar_return(sun, y, -33.45, -70.67, -4, "T")
            for k in ("sr_ut_time", "sr_local_time", "birth_time"):
                assert re.fullmatch(r"[0-2]\d:[0-5]\d", r[k]), (k, r[k])
                assert int(r[k][:2]) < 24


def test_transit_timeline_phases():
    c = calculate_natal_chart(SANTIAGO)
    res = calculate_transit_timeline(natal_planets=c["planets"],
                                     start_date_str="2026-01-01", end_date_str="2026-12-31",
                                     lat=-33.45, lon=-70.67)
    assert len(res["timeline"]) >= 1
    for month in res["timeline"]:
        for t in month["transits_active"]:
            assert t.get("_phase") in {"exact", "entering", "leaving", "ongoing"}
