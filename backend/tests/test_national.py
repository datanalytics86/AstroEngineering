"""Tests de `astro/national.py`: cartas nacionales (tradición de Campion) para
el modo "impacto por país" de Geopolítica."""

from astro.national import NATIONAL_CHARTS, NATIONAL_CHART_IDS, compute_national_planets


def test_all_national_charts_compute_nine_bodies_with_valid_longitudes():
    for country_id in NATIONAL_CHART_IDS:
        planets = compute_national_planets(country_id)
        assert len(planets) == 9, f"{country_id}: esperados 9 cuerpos, hubo {len(planets)}"
        names = {p["name"] for p in planets}
        assert names == {
            "Sol", "Mercurio", "Venus", "Marte",
            "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón",
        }
        for p in planets:
            assert p["longitude"] is not None
            assert 0 <= p["longitude"] < 360
            assert p["sign"]


def test_india_sun_in_leo():
    # 15 de agosto -> Sol en Leo. Aritmética de calendario (el Sol recorre
    # Leo entre ~23 jul y ~22 ago), no un dato de memoria astrológica.
    planets = compute_national_planets("india")
    sun = next(p for p in planets if p["name"] == "Sol")
    assert sun["sign"] == "Leo"


def test_chile_sun_in_virgo():
    # 18 de septiembre -> Sol en Virgo (Virgo ~23 ago a ~22 sep).
    planets = compute_national_planets("chile")
    sun = next(p for p in planets if p["name"] == "Sol")
    assert sun["sign"] == "Virgo"


def test_national_charts_cover_expected_countries():
    expected = {
        "chile", "argentina", "mexico", "eeuu", "espana", "francia",
        "reino_unido", "alemania", "italia", "rusia", "china", "japon",
        "india", "brasil", "israel", "ucrania",
    }
    assert NATIONAL_CHART_IDS == expected
    for country_id, chart in NATIONAL_CHARTS.items():
        assert chart["id"] == country_id
        assert chart["name_es"] and chart["name_en"]
        assert chart["chart_note_es"] and chart["chart_note_en"]


def test_compute_national_planets_unknown_country_raises():
    try:
        compute_national_planets("narnia")
        assert False, "debería haber lanzado ValueError"
    except ValueError:
        pass
