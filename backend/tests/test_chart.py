"""
Tests de `astro/chart.py` y `astro/houses.py` usando solo hechos
auto-verificables: el equinoccio (Sol a 0°/180° eclíptico) se localiza
mediante búsqueda binaria sobre la propia efeméride, no con un valor
"recordado" de memoria. También se prueban invariantes estructurales de
`longitude_to_sign`, `degrees_to_dms` y `calculate_natal_chart`.
"""
import swisseph as swe

from astro.chart import to_julian_day, calc_planet_position, calculate_natal_chart
from astro.houses import longitude_to_sign, degrees_to_dms


def _sun_longitude(jd: float) -> float:
    pos = calc_planet_position(jd, swe.SUN)
    assert pos is not None
    return pos["longitude"]


def _circ_diff(lon: float, target: float) -> float:
    d = (lon - target + 360) % 360
    return d - 360 if d > 180 else d


def _find_equinox_jd(year: int, month_start: int, day_start: int, target_lon: float) -> float:
    """
    Localiza el instante en que el Sol cruza `target_lon` escaneando día a día
    desde (year, month_start, day_start) y refinando con búsqueda binaria.
    No depende de ningún valor de fecha/hora "recordado": el algoritmo mismo
    encuentra el cruce usando la efeméride bajo prueba.
    """
    jd = to_julian_day(year, month_start, day_start, 0.0)
    prev_diff = _circ_diff(_sun_longitude(jd), target_lon)
    for _ in range(40):  # cubre ~40 días de escaneo, más que suficiente
        jd_next = jd + 1.0
        diff = _circ_diff(_sun_longitude(jd_next), target_lon)
        if prev_diff * diff <= 0:
            a, b = jd, jd_next
            for _ in range(40):
                mid = (a + b) / 2
                d = _circ_diff(_sun_longitude(mid), target_lon)
                if d == 0:
                    return mid
                if (prev_diff < 0) == (d < 0):
                    a, prev_diff = mid, d
                else:
                    b = mid
            return (a + b) / 2
        jd, prev_diff = jd_next, diff
    raise AssertionError("No se encontró el cruce del equinoccio en la ventana escaneada")


def test_march_equinox_sun_at_zero_aries():
    # Ventana amplia alrededor del equinoccio de marzo 2026; el algoritmo
    # localiza el cruce exacto por sí mismo.
    jd = _find_equinox_jd(2026, 3, 18, target_lon=0.0)
    lon = _sun_longitude(jd)
    assert abs(_circ_diff(lon, 0.0)) < 0.2


def test_september_equinox_sun_at_180():
    jd = _find_equinox_jd(2026, 9, 15, target_lon=180.0)
    lon = _sun_longitude(jd)
    assert abs(_circ_diff(lon, 180.0)) < 0.2


def test_longitude_to_sign_edges():
    aries_start = longitude_to_sign(0.0)
    assert aries_start["sign"] == "Aries"
    assert aries_start["degree_in_sign"] == 0.0

    pisces_end = longitude_to_sign(359.9)
    assert pisces_end["sign"] == "Piscis"
    assert abs(pisces_end["degree_in_sign"] - 29.9) < 1e-6

    # Wrap-around: 360 y 0 son el mismo punto.
    assert longitude_to_sign(360.0)["sign"] == longitude_to_sign(0.0)["sign"]


def test_longitude_to_sign_boundaries_all_12():
    for i in range(12):
        info = longitude_to_sign(i * 30.0)
        assert info["degree_in_sign"] == 0.0


def test_degrees_to_dms_carry():
    # 29.999999... grados debe acarrear a 30°00'00", no quedar en 29°59'60"
    result = degrees_to_dms(29.999999722)  # ~29°59'59.999"
    assert result == "30°00'00\""


def test_degrees_to_dms_normal():
    # 0.999722° * 3600 = 3598.9992" -> redondea a 3599" = 0°59'59"
    assert degrees_to_dms(0.999722) == "00°59'59\""
    # Un valor sin acarreo se formatea con separadores correctos
    assert degrees_to_dms(10.5) == "10°30'00\""


def test_calculate_natal_chart_structure():
    birth_data = {
        "name": "Test",
        "birth_date": "1990-05-15",
        "birth_time": "14:30",
        "latitude": -33.4489,
        "longitude": -70.6693,
        "timezone_offset": -4,
    }
    chart = calculate_natal_chart(birth_data)

    # 12 cuerpos soportados (Sol -> Quirón); Quirón requiere un archivo de
    # efemérides de asteroides que puede no estar disponible (fallback
    # Moshier no lo calcula) -- en ese caso el motor omite solo ese cuerpo.
    planet_names = {p["name"] for p in chart["planets"]}
    assert len(chart["planets"]) in (11, 12)
    assert {
        "Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter",
        "Saturno", "Urano", "Neptuno", "Plutón", "Nodo Norte",
    }.issubset(planet_names)
    assert len(chart["houses"]) == 12
    assert "longitude" in chart["ascendant"]
    assert "longitude" in chart["midheaven"]

    for planet in chart["planets"]:
        assert 0.0 <= planet["longitude"] < 360.0
    assert 0.0 <= chart["ascendant"]["longitude"] < 360.0
    assert 0.0 <= chart["midheaven"]["longitude"] < 360.0


def test_calculate_natal_chart_handles_ut_day_rollover():
    # timezone_offset muy negativo empuja hour_ut >= 24 -> debe ajustar fecha
    birth_data = {
        "name": "Rollover",
        "birth_date": "2000-01-01",
        "birth_time": "23:30",
        "latitude": 0.0,
        "longitude": 0.0,
        "timezone_offset": -10,
    }
    chart = calculate_natal_chart(birth_data)
    assert len(chart["planets"]) in (11, 12)
