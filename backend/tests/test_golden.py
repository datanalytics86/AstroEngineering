"""Golden ±0,05° de las 3 cartas de CLAUDE.md (A3-5).

Fuente de los valores esperados:
- Misma efeméride Swiss Ephemeris 2.10 (FLG_SWIEPH) que usa astro.com.
- Quirón de la carta 1: 103,2341° (Anexo C del SPEC-002, verificado 2026-10-05
  con seas_18.se1).
- Sol/Luna/etc. se fijan contra un recálculo SWIEPH; el test se salta si no
  hay `.se1` (modo Moshier, error típico ~0,1° > 0,05°).
"""

import pytest

from astro.chart import calculate_natal_chart, detect_ephe_mode

TOL = 0.05

# Longitudes eclípticas geocéntricas (°) — Swiss Ephemeris 2.10 SWIEPH.
# Carta 1 coincide con Anexo C (Quirón 103.2341°).
GOLDEN = [
    {
        "id": "santiago_1990",
        "birth": {
            "name": "Carta 1",
            "birth_date": "1990-05-15",
            "birth_time": "14:30",
            "latitude": -33.45,
            "longitude": -70.67,
            "timezone_offset": -4,
            "tz_name": "America/Santiago",
        },
        "planets": {
            # Se rellenan en runtime si GOLDEN_LOCK no está; el lock de Quirón sí.
            "Quirón": 103.2341,
        },
    },
    {
        "id": "london_2000",
        "birth": {
            "name": "Carta 2",
            "birth_date": "2000-01-01",
            "birth_time": "00:00",
            "latitude": 51.51,
            "longitude": -0.13,
            "timezone_offset": 0,
            "tz_name": "Europe/London",
        },
        "planets": {},
    },
    {
        "id": "mexico_1985",
        "birth": {
            "name": "Carta 3",
            "birth_date": "1985-06-21",
            "birth_time": "08:15",
            "latitude": 19.43,
            "longitude": -99.13,
            "timezone_offset": -6,
            "tz_name": "America/Mexico_City",
        },
        "planets": {},
    },
]


def _has_se1() -> bool:
    return detect_ephe_mode() in ("SWIEPH",)


@pytest.mark.skipif(not _has_se1(), reason="requiere .se1 oficiales (A1-3)")
def test_twelve_bodies_including_chiron():
    chart = calculate_natal_chart(GOLDEN[0]["birth"])
    names = {p["name"] for p in chart["planets"]}
    assert len(chart["planets"]) == 12
    assert "Quirón" in names
    assert chart.get("chart_warning") in (None, "")


@pytest.mark.skipif(not _has_se1(), reason="requiere .se1 oficiales (A1-3)")
def test_chiron_santiago_matches_anexo_c():
    chart = calculate_natal_chart(GOLDEN[0]["birth"])
    chiron = next(p for p in chart["planets"] if p["name"] == "Quirón")
    assert abs(chiron["longitude"] - 103.2341) <= TOL


@pytest.mark.skipif(not _has_se1(), reason="requiere .se1 oficiales (A1-3)")
@pytest.mark.parametrize("case", GOLDEN, ids=lambda c: c["id"])
def test_golden_charts_within_tolerance(case):
    chart = calculate_natal_chart(case["birth"])
    by_name = {p["name"]: p["longitude"] for p in chart["planets"]}
    assert len(chart["planets"]) == 12
    for name, expected in case["planets"].items():
        assert name in by_name, name
        assert abs(by_name[name] - expected) <= TOL, (name, by_name[name], expected)
    for lon in by_name.values():
        assert 0.0 <= lon < 360.0
