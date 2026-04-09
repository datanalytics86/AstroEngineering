"""
Cálculo de tránsitos futuros de planetas lentos contra carta natal.
Incluye escaneo adaptativo (paso variable por planeta) y refinamiento binario.
"""

import swisseph as swe
from datetime import datetime, timedelta
from .chart import to_julian_day, calc_planet_position, PLANET_IDS
from .houses import longitude_to_sign
from .aspects import ASPECTS, TRANSIT_ORBS, score_transit, importance_label, angular_distance

# Solo planetas lentos con impacto real en pronósticos
TRANSIT_PLANETS = [
    "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón", "Marte",
]

# Paso de escaneo en días por planeta — los planetas lentos se mueven poco
# y no necesitan resolución diaria
SCAN_STEP: dict[str, int] = {
    "Marte":   1,   # ~0.5°/día — necesita resolución diaria
    "Júpiter": 3,   # ~0.08°/día
    "Saturno": 5,   # ~0.03°/día
    "Urano":   10,  # ~0.012°/día
    "Neptuno": 20,  # ~0.006°/día
    "Plutón":  28,  # ~0.004°/día
}

DOMINANT_THEMES = {
    ("Júpiter", "armonioso"):    "expansión y oportunidades",
    ("Júpiter", "tenso"):        "exceso o crecimiento con fricción",
    ("Saturno", "armonioso"):    "disciplina y logros estructurados",
    ("Saturno", "tenso"):        "restricciones y lecciones kármicas",
    ("Urano", "armonioso"):      "cambios positivos e innovación",
    ("Urano", "tenso"):          "disrupciones e imprevistos",
    ("Neptuno", "armonioso"):    "espiritualidad y creatividad",
    ("Neptuno", "tenso"):        "confusión o disolución de límites",
    ("Plutón", "armonioso"):     "transformación y empoderamiento",
    ("Plutón", "tenso"):         "crisis y regeneración profunda",
    ("Marte", "armonioso"):      "energía y acción enfocada",
    ("Marte", "tenso"):          "conflictos y decisiones urgentes",
}


def find_exact_aspect_date(
    planet_id: int, natal_longitude: float, aspect_angle: float, approx_jd: float
) -> str:
    """
    Búsqueda binaria para encontrar el momento exacto del aspecto.
    Precisión: ~1 minuto de tiempo.
    """
    step = 0.5
    best_jd = approx_jd
    best_orb = 999.0

    for _ in range(20):
        for direction in [-1, 0, 1]:
            test_jd = best_jd + direction * step
            pos = calc_planet_position(test_jd, planet_id)
            if pos is None:
                continue
            angle = angular_distance(pos["longitude"], natal_longitude)
            orb = abs(angle - aspect_angle)
            if orb < best_orb:
                best_orb = orb
                best_jd = test_jd
        step /= 2

    year, month, day, hour = swe.revjul(best_jd)
    hour_int = int(hour)
    minute_int = int((hour - hour_int) * 60)
    try:
        dt = datetime(int(year), int(month), int(day), hour_int, minute_int)
        return dt.strftime("%Y-%m-%dT%H:%M:00Z")
    except Exception:
        return f"{int(year)}-{int(month):02d}-{int(day):02d}T{hour_int:02d}:{minute_int:02d}:00Z"


def consolidate_transits(raw_transits: list[dict]) -> list[dict]:
    """
    Agrupa tránsitos continuos del mismo planeta-aspecto-natal en un solo evento.
    Maneja correctamente los triples tránsitos por retrogradación.
    """
    if not raw_transits:
        return []

    def key(t):
        return (t["transit_planet"], t["natal_planet"], t["aspect_name"])

    sorted_transits = sorted(raw_transits, key=lambda t: (key(t), t["date"]))

    consolidated = []
    current_group = None

    for t in sorted_transits:
        k = key(t)
        date = t["date"]

        if current_group is None or key(current_group) != k:
            if current_group:
                consolidated.append(current_group)
            current_group = {**t, "enters_orb": date, "leaves_orb": date}
        else:
            try:
                prev_date = datetime.fromisoformat(current_group["leaves_orb"])
                curr_date = datetime.fromisoformat(date)
                gap = (curr_date - prev_date).days
            except Exception:
                gap = 0

            # Permite hasta 60 días de hueco entre pasadas (cubre retrogradación de Marte)
            planet_step = SCAN_STEP.get(t["transit_planet"], 5)
            max_gap = max(60, planet_step * 3)

            if gap <= max_gap:
                current_group["leaves_orb"] = date
                if t["orb"] < current_group["orb"]:
                    current_group["orb"] = t["orb"]
                    current_group["transit_longitude"] = t["transit_longitude"]
            else:
                consolidated.append(current_group)
                current_group = {**t, "enters_orb": date, "leaves_orb": date}

    if current_group:
        consolidated.append(current_group)

    return consolidated


def calculate_transit_timeline(
    natal_planets: list[dict],
    start_date_str: str,
    end_date_str: str,
    lat: float,
    lon: float,
) -> dict:
    """
    Escanea con paso adaptativo las posiciones de planetas transitantes y detecta
    cuándo forman aspectos con planetas natales.
    """
    start_date = datetime.fromisoformat(start_date_str)
    end_date = datetime.fromisoformat(end_date_str)

    raw_transits = []

    for tp_name in TRANSIT_PLANETS:
        if tp_name not in PLANET_IDS:
            continue

        step_days = timedelta(days=SCAN_STEP.get(tp_name, 5))
        current = start_date

        while current <= end_date:
            jd = to_julian_day(current.year, current.month, current.day, 12.0)
            tp = calc_planet_position(jd, PLANET_IDS[tp_name])
            if tp is None:
                current += step_days
                continue
            tp_sign = longitude_to_sign(tp["longitude"])

            for np in natal_planets:
                angle = angular_distance(tp["longitude"], np["longitude"])

                for asp in ASPECTS:
                    orb_limit = TRANSIT_ORBS.get(asp["name"], 2.0)
                    orb = abs(angle - asp["angle"])

                    if orb <= orb_limit:
                        # Applying = orb is decreasing (transit moving toward exact)
                        jd_next = jd + 1.0
                        tp_next = calc_planet_position(jd_next, PLANET_IDS[tp_name])
                        angle_next = angular_distance(tp_next["longitude"], np["longitude"])
                        orb_next = abs(angle_next - asp["angle"])
                        applying = orb_next < orb

                        raw_transits.append({
                            "date": current.date().isoformat(),
                            "transit_planet": tp_name,
                            "transit_longitude": round(tp["longitude"], 4),
                            "transit_sign": tp_sign["sign"],
                            "natal_planet": np["name"],
                            "natal_longitude": np.get("longitude", 0),
                            "aspect_name": asp["name"],
                            "orb": round(orb, 4),
                            "nature": asp["nature"],
                            "applying": applying,
                        })

            current += step_days

    consolidated = consolidate_transits(raw_transits)

    current_transits = []
    exact_aspects_calendar = []

    # Precalcular dict de longitudes de aspectos para lookup rápido
    aspect_angle_map = {a["name"]: a["angle"] for a in ASPECTS}

    for t in consolidated:
        sc = score_transit(t["transit_planet"], t["natal_planet"], t["aspect_name"], t["orb"])

        # Solo calcular fecha exacta para tránsitos significativos (score > 1)
        exact_date = None
        if sc > 1.0:
            try:
                enters_parts = list(map(int, t["enters_orb"].split("-")))
                leaves_parts = list(map(int, t["leaves_orb"].split("-")))
                enters_jd = to_julian_day(*enters_parts, 12.0)
                leaves_jd = to_julian_day(*leaves_parts, 12.0)
                mid_jd = (enters_jd + leaves_jd) / 2
                aspect_angle = aspect_angle_map.get(t["aspect_name"], 0)
                exact_date = find_exact_aspect_date(
                    PLANET_IDS[t["transit_planet"]],
                    t["natal_longitude"],
                    aspect_angle,
                    mid_jd,
                )
            except Exception:
                exact_date = t["enters_orb"] + "T12:00:00Z"

        event = {
            "transit_planet": t["transit_planet"],
            "transit_longitude": t["transit_longitude"],
            "transit_sign": t["transit_sign"],
            "natal_planet": t["natal_planet"],
            "natal_longitude": t["natal_longitude"],
            "aspect_name": t["aspect_name"],
            "orb": t["orb"],
            "applying": t["applying"],
            "exact_date": exact_date,
            "enters_orb": t["enters_orb"],
            "leaves_orb": t["leaves_orb"],
            "nature": t["nature"],
            "importance": importance_label(sc),
            "score": sc,
        }
        current_transits.append(event)

        interp_key = (
            f"{t['transit_planet'].lower()}_"
            f"{t['aspect_name'].lower().replace(' ', '_')}_"
            f"{t['natal_planet'].lower()}"
        )
        exact_date_short = exact_date[:10] if exact_date else t["enters_orb"]
        exact_aspects_calendar.append({
            "date": exact_date_short,
            "transit_planet": t["transit_planet"],
            "aspect": t["aspect_name"],
            "natal_planet": t["natal_planet"],
            "interpretation_key": interp_key,
        })

    current_transits.sort(key=lambda x: x["score"], reverse=True)
    exact_aspects_calendar.sort(key=lambda x: x["date"])

    timeline = build_monthly_timeline(current_transits, start_date, end_date)

    return {
        "current_transits": current_transits,
        "timeline": timeline,
        "exact_aspects_calendar": exact_aspects_calendar,
    }


def build_monthly_timeline(
    transits: list[dict], start_date: datetime, end_date: datetime
) -> list[dict]:
    """Agrupa tránsitos activos por mes y calcula score de intensidad."""
    months: dict[str, list] = {}
    current = start_date.replace(day=1)

    while current <= end_date:
        month_key = current.strftime("%Y-%m")
        months[month_key] = []
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    for t in transits:
        enters = t["enters_orb"][:7]
        leaves = t["leaves_orb"][:7]
        for month_key in months:
            if enters <= month_key <= leaves:
                months[month_key].append(t)

    timeline = []
    for month_key, month_transits in sorted(months.items()):
        if month_transits:
            total_score = sum(t["score"] for t in month_transits)
            intensity = round(total_score / len(month_transits), 2)
            top = max(month_transits, key=lambda t: t["score"])
            theme = DOMINANT_THEMES.get(
                (top["transit_planet"], top["nature"]),
                "período de transición",
            )
        else:
            intensity = 0.0
            theme = "período estable"

        timeline.append({
            "month": month_key,
            "transits_active": month_transits[:5],
            "intensity_score": intensity,
            "dominant_theme": theme,
        })

    return timeline
