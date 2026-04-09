"""
Cálculo de casas astrológicas.
Sistema principal: Placidus.
Fallback automático a Whole Sign para latitudes > 66° (donde Placidus falla).
"""

import swisseph as swe

SIGN_NAMES = [
    "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
    "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"
]

SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]


def longitude_to_sign(lon: float) -> dict:
    lon = lon % 360  # normalize to [0, 360)
    idx = int(lon / 30) % 12
    degree_in_sign = lon % 30
    return {
        "sign": SIGN_NAMES[idx],
        "sign_symbol": SIGN_SYMBOLS[idx],
        "degree_in_sign": round(degree_in_sign, 6),
        "degree_display": degrees_to_dms(degree_in_sign),
    }


def degrees_to_dms(degrees: float) -> str:
    """Convierte grados decimales a formato °'\" (ej: 24°14'02\")"""
    d = int(degrees)
    m_float = (degrees - d) * 60
    m = int(m_float)
    s = int((m_float - m) * 60)
    return f"{d:02d}°{m:02d}'{s:02d}\""


def calc_houses(jd: float, lat: float, lon: float) -> dict:
    """
    Calcula casas con Placidus.
    Fallback automático a Whole Sign si la latitud es extrema.
    """
    use_whole_sign = abs(lat) > 66

    if use_whole_sign:
        system = b'W'  # Whole Sign
    else:
        system = b'P'  # Placidus

    try:
        cusps, ascmc = swe.houses(jd, lat, lon, system)
    except Exception:
        # Segunda fallback: Whole Sign
        cusps, ascmc = swe.houses(jd, lat, lon, b'W')
        use_whole_sign = True

    ascendant_lon = ascmc[0]
    mc_lon = ascmc[1]

    houses = []
    for i, cusp in enumerate(cusps):
        sign_data = longitude_to_sign(cusp)
        houses.append({
            "number": i + 1,
            "cusp_longitude": round(cusp, 6),
            "sign": sign_data["sign"],
            "degree_display": degrees_to_dms(cusp % 30),
        })

    asc_sign = longitude_to_sign(ascendant_lon)
    mc_sign = longitude_to_sign(mc_lon)

    return {
        "houses": houses,
        "ascendant": {
            "longitude": round(ascendant_lon, 6),
            "sign": asc_sign["sign"],
            "degree_display": degrees_to_dms(ascendant_lon % 30),
        },
        "midheaven": {
            "longitude": round(mc_lon, 6),
            "sign": mc_sign["sign"],
            "degree_display": degrees_to_dms(mc_lon % 30),
        },
        "house_system": "Whole Sign" if use_whole_sign else "Placidus",
    }


def get_planet_house(planet_lon: float, house_cusps: list[float]) -> int:
    """Determina en qué casa cae un planeta dada su longitud eclíptica."""
    for i in range(12):
        cusp_start = house_cusps[i]
        cusp_end = house_cusps[(i + 1) % 12]

        if cusp_end > cusp_start:
            if cusp_start <= planet_lon < cusp_end:
                return i + 1
        else:
            # Casa que cruza 0° Aries
            if planet_lon >= cusp_start or planet_lon < cusp_end:
                return i + 1

    return 1  # Fallback
