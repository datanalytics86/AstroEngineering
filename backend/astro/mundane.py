"""
Astrología Mundana — tránsitos de planetas lentos sobre cartas nacionales.

Función principal: calculate_mundane_response(country_key, start_date, end_date)

Bibliografía:
  - Campion, N. (1995). The Book of World Horoscopes.
  - Baigent, Campion & Harvey (1984). Mundane Astrology.
  - Tarnas, R. (2006). Cosmos and Psyche.
  - Barbault, A. (2011). Planetary Cycles.
"""

from datetime import datetime, timedelta
import swisseph as swe

from .mundane_charts import NATIONAL_CHARTS
from .chart import calculate_natal_chart, calc_planet_position, to_julian_day, PLANET_IDS, PLANET_SYMBOLS
from .houses import longitude_to_sign, degrees_to_dms
from .transits import calculate_transit_timeline

# Planetas de la rueda de hoy (todos los que mostramos en el cielo actual)
CURRENT_SKY_PLANETS = [
    "Sol", "Luna", "Mercurio", "Venus", "Marte",
    "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón",
    "Nodo Norte", "Quirón",
]

# Planetas cuyas ingresos de signo rastreamos
INGRESS_PLANETS = [
    "Sol", "Mercurio", "Venus", "Marte",
    "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón",
]

SIGN_NAMES = [
    "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
    "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
]

# Paso de escaneo para ingresos
INGRESS_STEP: dict[str, int] = {
    "Sol": 1, "Mercurio": 1, "Venus": 1, "Marte": 1,
    "Júpiter": 3, "Saturno": 5, "Urano": 10, "Neptuno": 20, "Plutón": 28,
}


def _compute_current_sky(today: datetime) -> list[dict]:
    """Posiciones actuales de todos los planetas principales."""
    jd = to_julian_day(today.year, today.month, today.day, 12.0)
    result = []
    for planet_name in CURRENT_SKY_PLANETS:
        planet_id = PLANET_IDS.get(planet_name)
        if planet_id is None:
            continue
        pos = calc_planet_position(jd, planet_id)
        if pos is None:
            continue
        sign_data = longitude_to_sign(pos["longitude"])
        result.append({
            "name": planet_name,
            "symbol": PLANET_SYMBOLS.get(planet_name, ""),
            "longitude": round(pos["longitude"], 4),
            "sign": sign_data["sign"],
            "sign_symbol": sign_data["sign_symbol"],
            "degree_in_sign": round(sign_data["degree_in_sign"], 4),
            "degree_display": degrees_to_dms(sign_data["degree_in_sign"]),
            "house": 1,           # sin carta natal de ref → siempre 1
            "retrograde": pos["retrograde"],
            "speed": round(pos["speed"], 6),
        })
    return result


def _compute_ingresses(start_date: datetime, end_date: datetime) -> list[dict]:
    """
    Detecta cuándo un planeta cambia de signo en el período dado.
    Devuelve lista ordenada por fecha.
    """
    ingresses = []

    for planet_name in INGRESS_PLANETS:
        planet_id = PLANET_IDS.get(planet_name)
        if planet_id is None:
            continue

        step = timedelta(days=INGRESS_STEP.get(planet_name, 1))
        current = start_date
        prev_sign_idx: int | None = None

        while current <= end_date:
            jd = to_julian_day(current.year, current.month, current.day, 12.0)
            pos = calc_planet_position(jd, planet_id)
            if pos is not None:
                sign_idx = int(pos["longitude"] / 30) % 12
                if prev_sign_idx is not None and sign_idx != prev_sign_idx:
                    # Refinar fecha exacta (bisección ±step)
                    exact_date = _refine_ingress_date(
                        planet_id, prev_sign_idx, current - step, current
                    )
                    ingresses.append({
                        "date": exact_date,
                        "planet": planet_name,
                        "sign": SIGN_NAMES[sign_idx],
                        "retrograde": pos["retrograde"],
                    })
                prev_sign_idx = sign_idx
            current += step

    ingresses.sort(key=lambda x: x["date"])
    return ingresses


def _refine_ingress_date(
    planet_id: int,
    from_sign_idx: int,
    date_before: datetime,
    date_after: datetime,
) -> str:
    """Bisección para encontrar la fecha exacta de ingreso de signo (±1 día)."""
    low_jd = to_julian_day(date_before.year, date_before.month, date_before.day, 12.0)
    high_jd = to_julian_day(date_after.year, date_after.month, date_after.day, 12.0)

    for _ in range(16):
        mid_jd = (low_jd + high_jd) / 2
        pos = calc_planet_position(mid_jd, planet_id)
        if pos is None:
            break
        mid_sign_idx = int(pos["longitude"] / 30) % 12
        if mid_sign_idx == from_sign_idx:
            low_jd = mid_jd
        else:
            high_jd = mid_jd

    year, month, day, _hour = swe.revjul(high_jd)
    try:
        return datetime(int(year), int(month), int(day)).strftime("%Y-%m-%d")
    except Exception:
        return f"{int(year)}-{int(month):02d}-{int(day):02d}"


def calculate_mundane_response(
    country_key: str,
    start_date_str: str,
    end_date_str: str,
) -> dict:
    """
    Calcula:
      1. Carta natal del país (usando calculate_natal_chart)
      2. Cielo actual (posiciones hoy)
      3. Tránsitos de planetas lentos sobre la carta nacional
      4. Timeline mensual de 12 meses
      5. Ingresos de signo en el período

    Returns dict con estructura compatible con MundaneResponse TypeScript.
    """
    if country_key not in NATIONAL_CHARTS:
        raise ValueError(f"País no encontrado: {country_key}. Opciones: {list(NATIONAL_CHARTS.keys())}")

    meta = NATIONAL_CHARTS[country_key]
    start_date = datetime.fromisoformat(start_date_str)
    end_date   = datetime.fromisoformat(end_date_str)
    today      = datetime.utcnow()

    # ── 1. Carta natal nacional ───────────────────────────────────────────────
    birth_data = {
        "name":            meta["name"],
        "birth_date":      meta["birth_date"],
        "birth_time":      meta["birth_time"],
        "latitude":        meta["latitude"],
        "longitude":       meta["longitude"],
        "timezone_offset": meta["timezone_offset"],
    }
    natal = calculate_natal_chart(birth_data)

    national_chart = {
        "country_key":   country_key,
        "country_name":  meta["name"],
        "founding_date": meta["birth_date"],
        "founding_time": meta["birth_time"],
        "location":      meta["location"],
        "source":        meta["source"],
        "planets":       natal["planets"],
        "ascendant":     natal.get("ascendant"),
        "midheaven":     natal.get("midheaven"),
        "houses":        natal.get("houses"),
        "aspects":       natal.get("aspects"),
    }

    # ── 2. Cielo actual ───────────────────────────────────────────────────────
    current_sky = _compute_current_sky(today)

    # ── 3 & 4. Tránsitos sobre carta nacional ─────────────────────────────────
    transit_result = calculate_transit_timeline(
        natal_planets=natal["planets"],
        start_date_str=start_date_str,
        end_date_str=end_date_str,
        lat=meta["latitude"],
        lon=meta["longitude"],
    )

    # ── 5. Ingresos de signo ──────────────────────────────────────────────────
    ingresses = _compute_ingresses(start_date, end_date)

    return {
        "country_key":    country_key,
        "country_name":   meta["name"],
        "national_chart": national_chart,
        "current_sky":    current_sky,
        "current_transits": transit_result["current_transits"],
        "timeline":         transit_result["timeline"],
        "ingresses":        ingresses,
    }
