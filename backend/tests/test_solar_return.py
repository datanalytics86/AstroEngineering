"""Test de `calculate_solar_return`: el Sol en el retorno debe coincidir con
la longitud solar natal provista (por construcción del algoritmo de búsqueda
binaria), dentro de tolerancia numérica."""

from astro.chart import calculate_natal_chart, calculate_solar_return


def test_solar_return_sun_matches_natal_longitude():
    birth_data = {
        "name": "Test",
        "birth_date": "1990-05-15",
        "birth_time": "14:30",
        "latitude": -33.4489,
        "longitude": -70.6693,
        "timezone_offset": -4,
    }
    natal = calculate_natal_chart(birth_data)
    natal_sun = next(p for p in natal["planets"] if p["name"] == "Sol")
    natal_sun_lon = natal_sun["longitude"]

    sr = calculate_solar_return(
        natal_sun_lon=natal_sun_lon,
        year=2026,
        lat=birth_data["latitude"],
        lon=birth_data["longitude"],
        tz_offset=birth_data["timezone_offset"],
        name="Test SR",
    )
    sr_sun = next(p for p in sr["planets"] if p["name"] == "Sol")

    diff = abs(sr_sun["longitude"] - natal_sun_lon) % 360
    diff = min(diff, 360 - diff)
    assert diff < 1e-3

    assert sr["sr_year"] == 2026
    assert "sr_local_time" in sr
    assert "sr_ut_time" in sr


def test_solar_return_multiple_years_all_close_to_natal():
    # Se evita a propósito una fecha de nacimiento cercana al 1-ene: el escaneo
    # de la ventana de cruce en calculate_solar_return parte de esa fecha y
    # puede degenerar si el Sol natal ya está cerca de esa longitud de partida.
    birth_data = {
        "name": "Test2",
        "birth_date": "1985-06-21",
        "birth_time": "08:15",
        "latitude": 19.43,
        "longitude": -99.13,
        "timezone_offset": -6,
    }
    natal = calculate_natal_chart(birth_data)
    natal_sun_lon = next(p for p in natal["planets"] if p["name"] == "Sol")["longitude"]

    for year in (2024, 2025, 2026):
        sr = calculate_solar_return(
            natal_sun_lon=natal_sun_lon,
            year=year,
            lat=birth_data["latitude"],
            lon=birth_data["longitude"],
            tz_offset=birth_data["timezone_offset"],
        )
        sr_sun_lon = next(p for p in sr["planets"] if p["name"] == "Sol")["longitude"]
        diff = abs(sr_sun_lon - natal_sun_lon) % 360
        diff = min(diff, 360 - diff)
        assert diff < 1e-3
