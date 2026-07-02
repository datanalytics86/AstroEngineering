"""Tests de `astro/transits.py::consolidate_transits` con datos sintéticos
(sin cálculos astronómicos): valida el agrupamiento de pasadas retrógradas
por hueco de días."""

from astro.transits import consolidate_transits


def _raw(date, transit_planet="Saturno", natal_planet="Sol", aspect_name="Cuadratura", orb=1.0):
    return {
        "date": date,
        "transit_planet": transit_planet,
        "transit_longitude": 100.0,
        "transit_sign": "Cáncer",
        "transit_retrograde": False,
        "natal_planet": natal_planet,
        "natal_longitude": 10.0,
        "aspect_name": aspect_name,
        "orb": orb,
        "nature": "tenso",
        "applying": True,
    }


def test_consolidate_groups_close_retrograde_passes():
    # Tres pasadas del mismo tránsito con huecos <= 60 días entre ellas
    raw = [
        _raw("2026-01-01", orb=2.0),
        _raw("2026-02-15", orb=0.5),  # 45 días de hueco, <= 60 -> mismo grupo
        _raw("2026-04-01", orb=1.5),  # 45 días de hueco, <= 60 -> mismo grupo
    ]
    consolidated = consolidate_transits(raw)
    assert len(consolidated) == 1
    assert consolidated[0]["enters_orb"] == "2026-01-01"
    assert consolidated[0]["leaves_orb"] == "2026-04-01"
    assert consolidated[0]["orb"] == 0.5  # se queda con el orbe mínimo


def test_consolidate_splits_on_large_gap():
    # Saturno: SCAN_STEP=5 -> max_gap = max(60, 5*3) = 60. Un hueco de 100 días
    # debe partir en dos eventos separados.
    raw = [
        _raw("2026-01-01", orb=1.0),
        _raw("2026-04-11", orb=1.0),  # 100 días de hueco > 60 -> nuevo grupo
    ]
    consolidated = consolidate_transits(raw)
    assert len(consolidated) == 2
    assert consolidated[0]["enters_orb"] == "2026-01-01"
    assert consolidated[1]["enters_orb"] == "2026-04-11"


def test_consolidate_separates_different_aspect_keys():
    raw = [
        _raw("2026-01-01", transit_planet="Saturno", aspect_name="Cuadratura"),
        _raw("2026-01-05", transit_planet="Saturno", aspect_name="Trígono"),
        _raw("2026-01-10", transit_planet="Júpiter", aspect_name="Cuadratura"),
    ]
    consolidated = consolidate_transits(raw)
    assert len(consolidated) == 3


def test_consolidate_empty_input():
    assert consolidate_transits([]) == []


def test_consolidate_mars_shorter_max_gap():
    # Marte: SCAN_STEP=1 -> max_gap = max(60, 1*3) = 60 igualmente (piso de 60 días).
    # Confirmamos que un hueco de 61 días SÍ separa el grupo.
    raw = [
        _raw("2026-01-01", transit_planet="Marte", orb=1.0),
        _raw("2026-03-03", transit_planet="Marte", orb=1.0),  # 61 días de hueco
    ]
    consolidated = consolidate_transits(raw)
    assert len(consolidated) == 2
