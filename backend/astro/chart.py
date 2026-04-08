"""
Cálculo de carta natal con Swiss Ephemeris (pyswisseph).
"""

import os
import swisseph as swe
from .houses import calc_houses, get_planet_house, longitude_to_sign, degrees_to_dms
from .aspects import find_aspects

# Configurar path de efemérides (usa Moshier si no existen los .se1)
EPHE_PATH = os.environ.get("EPHE_PATH", "/usr/share/swisseph/ephe")
swe.set_ephe_path(EPHE_PATH)

PLANET_IDS = {
    "Sol":        swe.SUN,
    "Luna":       swe.MOON,
    "Mercurio":   swe.MERCURY,
    "Venus":      swe.VENUS,
    "Marte":      swe.MARS,
    "Júpiter":    swe.JUPITER,
    "Saturno":    swe.SATURN,
    "Urano":      swe.URANUS,
    "Neptuno":    swe.NEPTUNE,
    "Plutón":     swe.PLUTO,
    "Nodo Norte": swe.MEAN_NODE,
    "Quirón":     swe.CHIRON,
}

PLANET_SYMBOLS = {
    "Sol": "☉", "Luna": "☽", "Mercurio": "☿", "Venus": "♀",
    "Marte": "♂", "Júpiter": "♃", "Saturno": "♄", "Urano": "♅",
    "Neptuno": "♆", "Plutón": "♇", "Nodo Norte": "☊", "Quirón": "⚷",
}


def local_to_ut(hour_local: float, tz_offset: float) -> float:
    """Convierte hora local a Universal Time."""
    return hour_local - tz_offset


def to_julian_day(year: int, month: int, day: int, hour_ut: float) -> float:
    """Convierte fecha y hora UT a Julian Day Number."""
    return swe.julday(year, month, day, hour_ut)


def calc_planet_position(jd: float, planet_id: int) -> dict:
    """Calcula la posición de un planeta en una fecha dada (Julian Day)."""
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    result, _ = swe.calc_ut(jd, planet_id, flags)
    return {
        "longitude": result[0],
        "latitude": result[1],
        "speed": result[3],
        "retrograde": result[3] < 0,
    }


def calculate_natal_chart(birth_data: dict) -> dict:
    """
    Calcula la carta natal completa.

    Args:
        birth_data: dict con name, birth_date, birth_time, latitude, longitude, timezone_offset

    Returns:
        dict con planets, houses, ascendant, midheaven, aspects
    """
    # Parsear fecha y hora
    year, month, day = map(int, birth_data["birth_date"].split("-"))
    hh, mm = map(int, birth_data["birth_time"].split(":"))
    hour_local = hh + mm / 60.0

    # Convertir a UT
    hour_ut = local_to_ut(hour_local, birth_data["timezone_offset"])

    # Ajustar día si la hora UT cruza medianoche
    if hour_ut < 0:
        hour_ut += 24
        day -= 1
    elif hour_ut >= 24:
        hour_ut -= 24
        day += 1

    jd = to_julian_day(year, month, day, hour_ut)

    # Calcular casas y ángulos
    house_data = calc_houses(jd, birth_data["latitude"], birth_data["longitude"])
    house_cusps = [h["cusp_longitude"] for h in house_data["houses"]]

    # Calcular posiciones planetarias
    planets = []
    for planet_name, planet_id in PLANET_IDS.items():
        pos = calc_planet_position(jd, planet_id)
        sign_info = longitude_to_sign(pos["longitude"])
        house_num = get_planet_house(pos["longitude"], house_cusps)

        planets.append({
            "name": planet_name,
            "symbol": PLANET_SYMBOLS.get(planet_name, ""),
            "longitude": round(pos["longitude"], 6),
            "sign": sign_info["sign"],
            "sign_symbol": sign_info["sign_symbol"],
            "degree_in_sign": round(sign_info["degree_in_sign"], 4),
            "degree_display": degrees_to_dms(sign_info["degree_in_sign"]),
            "house": house_num,
            "retrograde": pos["retrograde"],
            "speed": round(pos["speed"], 6),
        })

    # Detectar aspectos entre planetas natales
    aspects = find_aspects(planets)

    return {
        "name": birth_data["name"],
        "birth_date": birth_data["birth_date"],
        "birth_time": birth_data["birth_time"],
        "latitude": birth_data["latitude"],
        "longitude": birth_data["longitude"],
        "timezone_offset": birth_data["timezone_offset"],
        "planets": planets,
        "houses": house_data["houses"],
        "ascendant": house_data["ascendant"],
        "midheaven": house_data["midheaven"],
        "aspects": aspects,
    }
