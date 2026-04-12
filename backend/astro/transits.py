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
    ("Júpiter", "tenso"):        "crecimiento con fricciones",
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

# Narrativa de 1-2 oraciones para cada combinación planeta/naturaleza
MONTHLY_SUMMARIES = {
    ("Júpiter", "armonioso"):    "Las energías favorecen el crecimiento y la expansión. Aprovecha para avanzar en proyectos de largo plazo y ampliar horizontes.",
    ("Júpiter", "tenso"):        "Oportunidades que vienen con exceso o desafíos de juicio. Avanza, pero con discernimiento y moderación.",
    ("Saturno", "armonioso"):    "El trabajo disciplinado consolida logros duraderos. Momento propicio para asentar estructuras y compromisos.",
    ("Saturno", "tenso"):        "Período de pruebas y responsabilidades inevitables. Las restricciones actuales forjan madurez y carácter.",
    ("Urano", "armonioso"):      "Cambios inesperados que liberan y renuevan. Mantente abierto a lo novedoso: puede transformar positivamente tu rumbo.",
    ("Urano", "tenso"):          "Disrupciones e imprevistos rompen lo establecido. Flexibilidad y adaptabilidad serán tus mejores aliados.",
    ("Neptuno", "armonioso"):    "Intuición y creatividad en su punto más alto. Período ideal para proyectos artísticos, espirituales o de sanación.",
    ("Neptuno", "tenso"):        "Riesgo de confusión, evasión o ilusiones. Mantén los pies en la tierra y valida decisiones importantes con hechos concretos.",
    ("Plutón", "armonioso"):     "Transformación profunda que empodera. Proceso de regeneración hacia una versión más auténtica y capaz.",
    ("Plutón", "tenso"):         "Ciclo de crisis y regeneración intensa. Lo que cae ya no servía; los cambios abren paso a algo más verdadero.",
    ("Marte", "armonioso"):      "Energía, impulso y acción decidida. Momento para iniciar, avanzar y demostrar coraje.",
    ("Marte", "tenso"):          "Tensión, conflictos o decisiones urgentes. Canaliza la energía físicamente y evita reacciones impulsivas.",
}

# Áreas de vida por planeta transitante
LIFE_AREAS_MAP: dict[str, list[str]] = {
    "Júpiter": ["expansión personal", "carrera y proyectos", "viajes y educación"],
    "Saturno": ["estructura y disciplina", "carrera y logros", "responsabilidades"],
    "Urano":   ["cambios inesperados", "libertad e innovación", "tecnología"],
    "Neptuno": ["espiritualidad y creatividad", "salud emocional", "intuición"],
    "Plutón":  ["transformaciones profundas", "poder personal", "psicología"],
    "Marte":   ["energía y acción", "relaciones y conflictos", "decisiones urgentes"],
}


def find_exact_aspect_date(
    planet_id: int,
    natal_longitude: float,
    aspect_angle: float,
    approx_jd: float,
    search_radius_days: int = 45,
) -> str:
    """
    Encuentra el momento exacto de un aspecto en dos fases:
      1) Barrido grueso ±search_radius_days (paso 1 día) para localizar la pasada
         más cercana — tolera errores grandes en el approx_jd de inicio,
         típicos cuando un tránsito tiene múltiples pasadas retrógradas.
      2) Refinamiento binario ±1 día con 20 iteraciones (precisión ~1 minuto).
    """
    best_jd = approx_jd
    best_orb = 999.0

    # Fase 1: barrido grueso
    for offset in range(-search_radius_days, search_radius_days + 1):
        test_jd = approx_jd + offset
        pos = calc_planet_position(test_jd, planet_id)
        if pos is None:
            continue
        angle = angular_distance(pos["longitude"], natal_longitude)
        orb = abs(angle - aspect_angle)
        if orb < best_orb:
            best_orb = orb
            best_jd = test_jd

    # Fase 2: refinamiento binario simétrico
    step = 0.5
    for _ in range(20):
        for direction in (-1, 1):
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
                        if tp_next is None:
                            applying = False
                        else:
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
    """
    Agrupa tránsitos activos por mes con intensidad ponderada por fase y narrativa.

    Mejoras respecto a la versión anterior:
    - Intensidad ponderada: exactos (1.8×) > entrando (1.4×) > saliendo (0.8×) > continuos (0.4×)
    - Tema dominante prioriza tránsitos exactos o entrantes este mes (no solo el de mayor score)
    - Muestra tránsitos variados: exactos primero, luego entrantes, luego continuos por orbe
    - Incluye narrativa (theme_summary) y áreas de vida (life_areas_affected)
    """
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
        if not month_transits:
            timeline.append({
                "month": month_key,
                "transits_active": [],
                "intensity_score": 0.0,
                "dominant_theme": "período estable",
                "theme_summary": "Mes de relativa calma astrológica. Buen momento para consolidar lo ganado.",
                "life_areas_affected": [],
            })
            continue

        # Clasificar por fase
        exact_this = [t for t in month_transits
                      if t.get("exact_date") and t["exact_date"][:7] == month_key]
        entering_this = [t for t in month_transits
                         if t["enters_orb"][:7] == month_key and t not in exact_this]
        leaving_this = [t for t in month_transits
                        if t["leaves_orb"][:7] == month_key
                        and t not in exact_this and t not in entering_this]
        ongoing = [t for t in month_transits
                   if t not in exact_this and t not in entering_this and t not in leaving_this]

        # Intensidad ponderada por fase + orbe
        weighted_total = 0.0
        for t in month_transits:
            if t in exact_this:
                phase_mult = 1.8
            elif t in entering_this:
                phase_mult = 1.4
            elif t in leaving_this:
                phase_mult = 0.8
            else:
                phase_mult = 0.4  # Continuos de larga duración: bajo impacto mensual
            orb_factor = max(0.4, 1.2 - t["orb"] * 0.15)
            weighted_total += t["score"] * phase_mult * orb_factor

        intensity = min(10.0, round(weighted_total / max(len(month_transits), 1), 2))

        # Tema: prioridad → exacto → entrante → orbe más cerrado
        theme_source = None
        if exact_this:
            theme_source = max(exact_this, key=lambda t: t["score"])
        elif entering_this:
            theme_source = max(entering_this, key=lambda t: t["score"])
        else:
            theme_source = min(month_transits, key=lambda t: t["orb"])

        theme = DOMINANT_THEMES.get(
            (theme_source["transit_planet"], theme_source["nature"]),
            "período de transición",
        )
        theme_summary = MONTHLY_SUMMARIES.get(
            (theme_source["transit_planet"], theme_source["nature"]),
            "Período de transición y ajustes. Mantente abierto a las señales del entorno.",
        )

        # Áreas de vida (deduplicate, max 4)
        life_areas: list[str] = []
        seen_planets: set[str] = set()
        for t in sorted(month_transits, key=lambda x: x["score"], reverse=True):
            if t["transit_planet"] not in seen_planets:
                for area in LIFE_AREAS_MAP.get(t["transit_planet"], [])[:2]:
                    if area not in life_areas:
                        life_areas.append(area)
                seen_planets.add(t["transit_planet"])
        life_areas = life_areas[:4]

        # Orden de visualización: exactos → entrantes → continuos por orbe (dedup por (tp, np, asp))
        display_order = (
            sorted(exact_this, key=lambda t: -t["score"]) +
            sorted(entering_this, key=lambda t: -t["score"]) +
            sorted(leaving_this + ongoing, key=lambda t: t["orb"])
        )
        seen_keys: set[tuple] = set()
        display_transits = []
        for t in display_order:
            k = (t["transit_planet"], t["natal_planet"], t["aspect_name"])
            if k not in seen_keys:
                seen_keys.add(k)
                display_transits.append(t)

        timeline.append({
            "month": month_key,
            "transits_active": display_transits[:5],
            "intensity_score": intensity,
            "dominant_theme": theme,
            "theme_summary": theme_summary,
            "life_areas_affected": life_areas,
        })

    return timeline
