"""
Cálculo de carta natal con Swiss Ephemeris (pyswisseph).
"""

import logging
import os
import swisseph as swe
from .houses import calc_houses, get_planet_house, longitude_to_sign, degrees_to_dms
from .aspects import find_aspects
from .timezone import resolve_birth_instant

logger = logging.getLogger(__name__)

# Configurar path de efemérides (usa Moshier si no existen los .se1)
EPHE_PATH = os.environ.get("EPHE_PATH", "/usr/share/swisseph/ephe")
swe.set_ephe_path(EPHE_PATH)

_EPHE_MODE: str | None = None


def detect_ephe_mode() -> str:
    """Registra si el runtime usa SWIEPH (.se1) o Moshier."""
    global _EPHE_MODE
    if _EPHE_MODE:
        return _EPHE_MODE
    jd = swe.julday(2000, 1, 1, 12.0)
    try:
        swe.calc_ut(jd, swe.SUN, swe.FLG_SWIEPH)
        try:
            swe.calc_ut(jd, swe.CHIRON, swe.FLG_SWIEPH)
            _EPHE_MODE = "SWIEPH"
        except Exception:
            _EPHE_MODE = "SWIEPH_NO_CHIRON"
    except Exception:
        _EPHE_MODE = "Moshier"
    logger.info("ephe.mode=%s path=%s", _EPHE_MODE, EPHE_PATH)
    return _EPHE_MODE

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


def calc_planet_position(jd: float, planet_id: int) -> dict | None:
    """Calcula la posición de un planeta en una fecha dada (Julian Day).
    Intenta Swiss Ephemeris primero; si falta el archivo .se1, usa Moshier.
    Retorna None si el planeta no está soportado sin efemérides (ej: Quirón).
    """
    for flags in (swe.FLG_SWIEPH | swe.FLG_SPEED, swe.FLG_MOSEPH | swe.FLG_SPEED):
        try:
            result, _ = swe.calc_ut(jd, planet_id, flags)
            return {
                "longitude": result[0],
                "latitude": result[1],
                "speed": result[3],
                "retrograde": result[3] < 0,
            }
        except Exception:
            continue
    return None


def calculate_natal_chart(birth_data: dict) -> dict:
    """
    Calcula la carta natal completa.

    Args:
        birth_data: dict con name, birth_date, birth_time, latitude, longitude, timezone_offset

    Returns:
        dict con planets, houses, ascendant, midheaven, aspects
    """
    instant = resolve_birth_instant(
        birth_data["birth_date"],
        birth_data["birth_time"],
        float(birth_data["timezone_offset"]),
        birth_data.get("tz_name"),
    )
    year = instant["ut_year"]
    month = instant["ut_month"]
    day = instant["ut_day"]
    hour_ut = instant["hour_ut"]
    utc_offset_used = instant["offset_hours"]
    tz_name = instant["tz_name"]
    tz_warning = instant["tz_warning"]

    jd = to_julian_day(year, month, day, hour_ut)

    # Calcular casas y ángulos
    house_data = calc_houses(jd, birth_data["latitude"], birth_data["longitude"])
    house_cusps = [h["cusp_longitude"] for h in house_data["houses"]]

    # Calcular posiciones planetarias
    planets = []
    omitted: list[str] = []
    for planet_name, planet_id in PLANET_IDS.items():
        pos = calc_planet_position(jd, planet_id)
        if pos is None:
            omitted.append(planet_name)
            continue
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

    chart_warning = None
    if omitted:
        chart_warning = "omitted:" + ",".join(omitted)

    return {
        "name": birth_data["name"],
        "birth_date": birth_data["birth_date"],
        "birth_time": birth_data["birth_time"],
        "latitude": birth_data["latitude"],
        "longitude": birth_data["longitude"],
        "timezone_offset": utc_offset_used,
        "tz_name": tz_name,
        "utc_offset_used": utc_offset_used,
        "tz_warning": tz_warning,
        "chart_warning": chart_warning,
        "planets": planets,
        "houses": house_data["houses"],
        "ascendant": house_data["ascendant"],
        "midheaven": house_data["midheaven"],
        "aspects": aspects,
    }


def calculate_solar_return(natal_sun_lon: float, year: int, lat: float, lon: float, tz_offset: float, name: str = "") -> dict:
    """
    Calculate the solar return chart for the given year.
    Finds the exact JD when the Sun returns to natal_sun_lon in `year`,
    then computes a full natal chart for that moment at the birth location.
    """
    # Step 1: find rough crossing with 5-day scan
    jd_start = swe.julday(year, 1, 1, 0.0)
    jd_end   = swe.julday(year + 1, 3, 1, 0.0)

    def sun_lon(jd: float) -> float:
        for flags in (swe.FLG_SWIEPH | swe.FLG_SPEED, swe.FLG_MOSEPH | swe.FLG_SPEED):
            try:
                res, _ = swe.calc_ut(jd, swe.SUN, flags)
                return res[0]
            except Exception:
                continue
        raise RuntimeError("Cannot calculate sun position")

    def circ_diff(jd: float) -> float:
        d = (sun_lon(jd) - natal_sun_lon + 360) % 360
        return d - 360 if d > 180 else d

    # 5-day step scan to find the crossing window
    prev_jd, prev_d = jd_start, circ_diff(jd_start)
    window_a, window_b = jd_start, jd_start + 6
    t = jd_start + 5.0
    while t < jd_end:
        d = circ_diff(t)
        if prev_d * d <= 0:
            window_a = max(jd_start, prev_jd - 1)
            window_b = min(jd_end, t + 1)
            break
        prev_jd, prev_d = t, d
        t += 5.0

    # Step 2: binary search within window
    a, b = window_a, window_b
    for _ in range(60):
        mid = (a + b) / 2
        d   = circ_diff(mid)
        if abs(d) < 1e-7:
            break
        if d < 0:
            a = mid
        else:
            b = mid
    sr_jd = (a + b) / 2

    # Step 3: convert JD to calendar date/time (UT)
    # swe.jdut1_to_utc returns (year, month, day, hour, minute, second)
    y_out, mo, day, h_ut, m_ut, s_ut = swe.jdut1_to_utc(sr_jd, 1)
    h_ut = int(h_ut)
    m_ut = int(round(float(m_ut) + float(s_ut) / 60))
    if m_ut >= 60:
        h_ut += 1
        m_ut -= 60

    # Step 4: convert UT → local
    h_loc_frac = h_ut + m_ut / 60.0 + tz_offset
    h_loc = int(h_loc_frac) % 24
    m_loc = int(round((h_loc_frac - int(h_loc_frac)) * 60)) % 60

    birth_data = {
        "name": name or f"Retorno Solar {year}",
        "birth_date": f"{int(y_out)}-{int(mo):02d}-{int(day):02d}",
        "birth_time": f"{h_ut:02d}:{m_ut:02d}",
        "latitude":   lat,
        "longitude":  lon,
        "timezone_offset": 0,  # already in UT
    }
    result = calculate_natal_chart(birth_data)
    # Add metadata for display
    result["sr_year"] = year
    result["sr_local_time"] = f"{h_loc:02d}:{m_loc:02d}"
    result["sr_ut_time"] = f"{h_ut:02d}:{m_ut:02d}"
    return result
