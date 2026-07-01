"""
Astrología mundial (geopolítica) — configuraciones planetarias lentas,
análogos históricos y su impacto sobre una carta natal.

Principio: este módulo es analogía cíclica, NO predicción factual. Reutiliza
toda la maquinaria astronómica/de aspectos ya existente; no redefine nada.
"""

import swisseph as swe
from datetime import datetime, timedelta
from .chart import to_julian_day, calc_planet_position, PLANET_IDS, PLANET_SYMBOLS
from .houses import longitude_to_sign, degrees_to_dms
from .aspects import ASPECTS, TRANSIT_ORBS, angular_distance, score_transit, importance_label

# Cuerpos lentos relevantes para astrología mundial (Cassanya, Barbault, Tarnas)
MUNDANE_BODIES = ["Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"]

# Aspectos mayores considerados para configuraciones mundiales
MUNDANE_ASPECTS = ["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]

# Orbe de búsqueda al escanear configuraciones mundiales (más amplio que tránsitos natales)
MUNDANE_SCAN_ORB = 3.0

# Paso de escaneo en días por planeta (mismo criterio que astro/transits.py SCAN_STEP,
# pero algo más fino porque buscamos la fecha exacta de eventos mundiales)
MUNDANE_SCAN_STEP: dict[str, int] = {
    "Júpiter": 3,
    "Saturno": 5,
    "Urano":   10,
    "Neptuno": 20,
    "Plutón":  28,
}


def _slugify(text: str) -> str:
    """Convierte texto a slug ascii simple para ids deterministas."""
    replacements = {
        "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n", "ü": "u",
    }
    out = text.lower()
    for k, v in replacements.items():
        out = out.replace(k, v)
    out = "".join(c if c.isalnum() else "_" for c in out)
    while "__" in out:
        out = out.replace("__", "_")
    return out.strip("_")


def compute_mundane_sky(date_str: str) -> list[dict]:
    """
    Posiciones de los cuerpos lentos (+ Sol) en una fecha dada (mediodía UT).
    Soporta fechas históricas (pre-1800 incluido) vía fallback Moshier automático
    en calc_planet_position. Omite cuerpos que no se puedan calcular.
    """
    year, month, day = map(int, date_str.split("-"))
    jd = to_julian_day(year, month, day, 12.0)

    bodies = ["Sol"] + MUNDANE_BODIES
    sky: list[dict] = []
    for name in bodies:
        pid = PLANET_IDS.get(name)
        if pid is None:
            continue
        pos = calc_planet_position(jd, pid)
        if pos is None:
            continue
        si = longitude_to_sign(pos["longitude"])
        sky.append({
            "name": name,
            "symbol": PLANET_SYMBOLS.get(name, ""),
            "longitude": round(pos["longitude"], 4),
            "sign": si["sign"],
            "sign_symbol": si["sign_symbol"],
            "degree_in_sign": round(si["degree_in_sign"], 4),
            "degree_display": degrees_to_dms(si["degree_in_sign"]),
            "retrograde": pos["retrograde"],
            "speed": round(pos["speed"], 6),
        })
    return sky


def _find_exact_mundane_date(
    planet_a_id: int,
    planet_b_id: int,
    aspect_angle: float,
    approx_jd: float,
    search_radius_days: int = 60,
) -> str:
    """
    Refina la fecha exacta de un aspecto entre dos cuerpos lentos.
    Imita el patrón de find_exact_aspect_date en astro/transits.py:
    barrido grueso + refinamiento binario.
    """
    best_jd = approx_jd
    best_orb = 999.0

    for offset in range(-search_radius_days, search_radius_days + 1, 2):
        test_jd = approx_jd + offset
        pa = calc_planet_position(test_jd, planet_a_id)
        pb = calc_planet_position(test_jd, planet_b_id)
        if pa is None or pb is None:
            continue
        angle = angular_distance(pa["longitude"], pb["longitude"])
        orb = abs(angle - aspect_angle)
        if orb < best_orb:
            best_orb = orb
            best_jd = test_jd

    step = 1.0
    for _ in range(20):
        for direction in (-1, 1):
            test_jd = best_jd + direction * step
            pa = calc_planet_position(test_jd, planet_a_id)
            pb = calc_planet_position(test_jd, planet_b_id)
            if pa is None or pb is None:
                continue
            angle = angular_distance(pa["longitude"], pb["longitude"])
            orb = abs(angle - aspect_angle)
            if orb < best_orb:
                best_orb = orb
                best_jd = test_jd
        step /= 2

    year, month, day, hour = swe.revjul(best_jd)
    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"


def _find_exact_ingress_date(
    planet_id: int,
    sign_index: int,
    approx_jd: float,
    search_radius_days: int = 60,
) -> str:
    """Refina la fecha exacta en que un cuerpo cruza el inicio de un signo (sign_index*30°)."""
    target_lon = (sign_index * 30) % 360
    best_jd = approx_jd
    best_diff = 999.0

    for offset in range(-search_radius_days, search_radius_days + 1, 2):
        test_jd = approx_jd + offset
        p = calc_planet_position(test_jd, planet_id)
        if p is None:
            continue
        diff = abs(((p["longitude"] - target_lon + 180) % 360) - 180)
        if diff < best_diff:
            best_diff = diff
            best_jd = test_jd

    step = 1.0
    for _ in range(20):
        for direction in (-1, 1):
            test_jd = best_jd + direction * step
            p = calc_planet_position(test_jd, planet_id)
            if p is None:
                continue
            diff = abs(((p["longitude"] - target_lon + 180) % 360) - 180)
            if diff < best_diff:
                best_diff = diff
                best_jd = test_jd
        step /= 2

    year, month, day, hour = swe.revjul(best_jd)
    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"


def find_mundane_configurations(start_date_str: str, end_date_str: str) -> list[dict]:
    """
    Escanea pares de MUNDANE_BODIES buscando aspectos mayores (orbe ~2-3°) e
    ingresos de signo dentro del rango [start, end]. Refina cada hallazgo con
    búsqueda binaria. Devuelve una lista de configuraciones con id estable.
    """
    start_date = datetime.fromisoformat(start_date_str)
    end_date = datetime.fromisoformat(end_date_str)

    aspect_angle_map = {a["name"]: a["angle"] for a in ASPECTS if a["name"] in MUNDANE_ASPECTS}

    configs: list[dict] = []
    seen_aspect_keys: set[tuple] = set()
    seen_ingress_keys: set[tuple] = set()

    # ── Aspectos entre pares de cuerpos lentos ──────────────────────────────
    pairs = [(a, b) for i, a in enumerate(MUNDANE_BODIES) for b in MUNDANE_BODIES[i + 1:]]

    for body_a, body_b in pairs:
        id_a, id_b = PLANET_IDS[body_a], PLANET_IDS[body_b]
        step_days = max(MUNDANE_SCAN_STEP.get(body_a, 10), MUNDANE_SCAN_STEP.get(body_b, 10))
        step = timedelta(days=step_days)

        # 1) Muestrear el orbe de cada aspecto a lo largo del rango.
        samples: dict[str, list[tuple[float, float]]] = {a: [] for a in MUNDANE_ASPECTS}  # (jd, orb)
        current = start_date
        while current <= end_date:
            jd = to_julian_day(current.year, current.month, current.day, 12.0)
            pa = calc_planet_position(jd, id_a)
            pb = calc_planet_position(jd, id_b)
            if pa is not None and pb is not None:
                angle = angular_distance(pa["longitude"], pb["longitude"])
                for aspect_name in MUNDANE_ASPECTS:
                    orb = abs(angle - aspect_angle_map[aspect_name])
                    samples[aspect_name].append((jd, orb))
            current += step

        # 2) Registrar UNA sola configuración por pasada: cada mínimo local del orbe
        #    dentro de MUNDANE_SCAN_ORB (una pasada aplicativa→separativa). La
        #    retrogradación puede producir varias pasadas; cada una es su propio mínimo.
        for aspect_name in MUNDANE_ASPECTS:
            aspect_angle = aspect_angle_map[aspect_name]
            seq = samples[aspect_name]
            for i, (jd, orb) in enumerate(seq):
                if orb > MUNDANE_SCAN_ORB:
                    continue
                prev_orb = seq[i - 1][1] if i > 0 else None
                next_orb = seq[i + 1][1] if i < len(seq) - 1 else None
                is_local_min = (prev_orb is None or orb <= prev_orb) and (next_orb is None or orb <= next_orb)
                if not is_local_min:
                    continue

                exact_date = _find_exact_mundane_date(id_a, id_b, aspect_angle, jd)

                # Dedupe por la fecha exacta refinada (colapsa mínimos adyacentes iguales).
                key = (body_a, body_b, aspect_name, exact_date)
                if key in seen_aspect_keys:
                    continue
                seen_aspect_keys.add(key)

                sky = compute_mundane_sky(exact_date)
                pa_sky = next((s for s in sky if s["name"] == body_a), None)
                pb_sky = next((s for s in sky if s["name"] == body_b), None)
                if pa_sky is None or pb_sky is None:
                    continue

                pair_sorted = sorted([body_a, body_b])
                # El id incluye la fecha exacta → único aunque haya varias pasadas (retrógradas) el mismo año.
                config_id = (
                    f"{_slugify(pair_sorted[0])}_{_slugify(pair_sorted[1])}_"
                    f"{_slugify(aspect_name)}_{exact_date.replace('-', '')}"
                )

                configs.append({
                    "id": config_id,
                    "exact_date": exact_date,
                    "kind": "aspect",
                    "bodies": pair_sorted,
                    "aspect": aspect_name,
                    "sign": None,
                    "longitudes": {
                        body_a: pa_sky["longitude"],
                        body_b: pb_sky["longitude"],
                    },
                    "signature": {"pair": pair_sorted, "aspect": aspect_name},
                    "sky": sky,
                })

    # ── Ingresos de signo de cada cuerpo lento ──────────────────────────────
    for body in MUNDANE_BODIES:
        pid = PLANET_IDS[body]
        step = timedelta(days=MUNDANE_SCAN_STEP.get(body, 10))

        current = start_date
        prev_sign_idx = None

        while current <= end_date:
            jd = to_julian_day(current.year, current.month, current.day, 12.0)
            p = calc_planet_position(jd, pid)
            if p is None:
                current += step
                continue
            sign_idx = int((p["longitude"] % 360) // 30)

            if prev_sign_idx is not None and sign_idx != prev_sign_idx:
                # Cruce de signo detectado entre el paso anterior y este.
                # Determinamos a qué signo entró usando el índice actual.
                exact_date = _find_exact_ingress_date(pid, sign_idx, jd)
                sign_name = longitude_to_sign(sign_idx * 30)["sign"]

                key = (body, sign_idx, exact_date)
                if key not in seen_ingress_keys:
                    seen_ingress_keys.add(key)

                    sky = compute_mundane_sky(exact_date)
                    # El id incluye la fecha exacta → único aunque un retrógrado recruce el mismo signo.
                    config_id = f"{_slugify(body)}_ingreso_{_slugify(sign_name)}_{exact_date.replace('-', '')}"

                    configs.append({
                        "id": config_id,
                        "exact_date": exact_date,
                        "kind": "ingress",
                        "bodies": [body],
                        "aspect": None,
                        "sign": sign_name,
                        "longitudes": {body: sign_idx * 30.0},
                        "signature": {"body": body, "ingress": sign_name},
                        "sky": sky,
                    })

            prev_sign_idx = sign_idx
            current += step

    configs.sort(key=lambda c: c["exact_date"])
    return configs


# ── Eventos históricos curados ────────────────────────────────────────────────
# Firma = configuración recurrente que enlaza analógicamente con 2025-2027.
# Atribución temática (Cassanya, Barbault, Tarnas) — sin citas textuales ni
# números de página inventados.
HISTORICAL_EVENTS: list[dict] = [
    {
        "id": "constantinopla_1453",
        "date": "1453-05-29",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Conjunción"},
        "region": "Mediterráneo oriental / Europa",
        "tags": ["fin_de_ciclo", "cambio_de_era", "colapso_de_estructuras"],
    },
    {
        "id": "revolucion_rusa_1917",
        "date": "1917-11-07",
        "signature": {"pair": ["Saturno", "Neptuno"], "aspect": "Conjunción"},
        "region": "Rusia / Europa del Este",
        "tags": ["disolucion_de_estructuras", "utopias_colectivas", "revolucion_ideologica"],
    },
    {
        "id": "muro_berlin_1989",
        "date": "1989-11-09",
        "signature": {"pair": ["Saturno", "Neptuno"], "aspect": "Conjunción"},
        "region": "Europa central",
        "tags": ["disolucion_de_fronteras", "fin_de_ciclo_ideologico", "reunificacion"],
    },
    {
        "id": "independencia_eeuu_1776",
        "date": "1776-07-04",
        "signature": {"body": "Plutón", "ingress": "Acuario"},
        "region": "América del Norte",
        "tags": ["nacimiento_de_naciones", "ideales_de_libertad", "ruptura_con_el_pasado"],
    },
    {
        "id": "revolucion_francesa_1789",
        "date": "1789-07-14",
        "signature": {"body": "Plutón", "ingress": "Acuario"},
        "region": "Francia / Europa",
        "tags": ["revolucion_ideologica", "ruptura_con_el_pasado", "poder_colectivo"],
    },
    {
        "id": "segunda_guerra_mundial_1942",
        "date": "1942-01-01",
        "signature": {"body": "Urano", "ingress": "Géminis"},
        "region": "Global",
        "tags": ["conflicto_global", "innovacion_tecnologica", "ruptura_de_alianzas"],
    },
    {
        "id": "bomba_atomica_1945",
        "date": "1945-08-06",
        "signature": {"body": "Urano", "ingress": "Géminis"},
        "region": "Japón / Global",
        "tags": ["innovacion_tecnologica", "disrupcion_irreversible", "nueva_era"],
    },
    {
        "id": "guerra_civil_eeuu_1861",
        "date": "1861-04-12",
        "signature": {"body": "Neptuno", "ingress": "Aries"},
        "region": "América del Norte",
        "tags": ["fractura_nacional", "idealismo_en_conflicto", "redefinicion_de_identidad"],
    },
    {
        "id": "unificacion_alemania_1871",
        "date": "1871-01-18",
        "signature": {"body": "Neptuno", "ingress": "Aries"},
        "region": "Europa central",
        "tags": ["redefinicion_de_identidad", "nacionalismo_emergente", "nueva_era"],
    },
    {
        "id": "gran_conjuncion_2020",
        "date": "2020-12-21",
        "signature": {"pair": ["Júpiter", "Saturno"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["cambio_de_era", "reestructuracion_social", "nuevo_ciclo_de_20_anos"],
    },
    {
        "id": "crisis_1929",
        "date": "1929-10-24",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Cuadratura"},
        "region": "Global",
        "tags": ["colapso_de_estructuras", "crisis_economica", "ruptura_brusca"],
    },
    {
        "id": "crisis_misiles_cuba_1962",
        "date": "1962-10-16",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Cuadratura"},
        "region": "América / Global",
        "tags": ["crisis_de_poder", "tension_extrema", "umbral_de_colapso"],
    },
    {
        "id": "caida_urss_1991",
        "date": "1991-12-26",
        "signature": {"body": "Urano", "ingress": "Capricornio"},
        "region": "Eurasia",
        "tags": ["colapso_de_estructuras", "fin_de_ciclo_ideologico", "reestructuracion_social"],
    },
    {
        "id": "crisis_financiera_2008",
        "date": "2008-09-15",
        "signature": {"pair": ["Júpiter", "Plutón"], "aspect": "Cuadratura"},
        "region": "Global",
        "tags": ["crisis_economica", "exceso_y_correccion", "colapso_de_estructuras"],
    },
    {
        "id": "primavera_arabe_2011",
        "date": "2011-01-14",
        "signature": {"pair": ["Urano", "Plutón"], "aspect": "Cuadratura"},
        "region": "Medio Oriente / Norte de África",
        "tags": ["revolucion_ideologica", "poder_colectivo", "ruptura_con_el_pasado"],
    },
    {
        "id": "pandemia_2020",
        "date": "2020-03-11",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["crisis_de_poder", "fin_de_ciclo", "reestructuracion_social"],
    },
]


def match_historical_analogs(config: dict) -> list[dict]:
    """
    Devuelve eventos históricos cuya firma coincide con la de la configuración:
    mismo par de cuerpos + familia de aspecto, o mismo cuerpo + signo de ingreso.
    Cada análogo incluye su cielo real (compute_mundane_sky) en su fecha.
    """
    sig = config["signature"]
    matches = []
    for event in HISTORICAL_EVENTS:
        esig = event["signature"]
        if "pair" in sig and "pair" in esig:
            if sorted(sig["pair"]) == sorted(esig["pair"]) and sig["aspect"] == esig["aspect"]:
                matches.append(event)
        elif "body" in sig and "body" in esig:
            if sig["body"] == esig["body"] and sig["ingress"] == esig["ingress"]:
                matches.append(event)

    analogs = []
    for event in matches:
        analogs.append({
            "id": event["id"],
            "date": event["date"],
            "region": event["region"],
            "tags": event["tags"],
            "sky": compute_mundane_sky(event["date"]),
        })
    return analogs


def find_natal_impacts(configs: list[dict], natal_planets: list[dict]) -> list[dict]:
    """
    Para cada configuración, detecta aspectos entre las longitudes de sus
    cuerpos y los planetas natales provistos. Usa los mismos pesos/orbes que
    los tránsitos normales (TRANSIT_ORBS, score_transit, importance_label).
    """
    impacts: list[dict] = []
    aspect_angle_map = {a["name"]: a["angle"] for a in ASPECTS}

    for config in configs:
        for body, lon in config["longitudes"].items():
            for np in natal_planets:
                np_lon = np.get("longitude")
                np_name = np.get("name")
                if np_lon is None or np_name is None:
                    continue
                angle = angular_distance(lon, np_lon)
                for aspect_name, aspect_angle in aspect_angle_map.items():
                    orb_limit = TRANSIT_ORBS.get(aspect_name, 2.0)
                    orb = abs(angle - aspect_angle)
                    if orb <= orb_limit:
                        sc = score_transit(body, np_name, aspect_name, orb)
                        impacts.append({
                            "config_id": config["id"],
                            "natal_planet": np_name,
                            "body": body,
                            "aspect": aspect_name,
                            "orb": round(orb, 4),
                            "importance": importance_label(sc),
                        })
    return impacts


def build_mundane_forecast(
    start_date_str: str,
    end_date_str: str,
    natal_planets: list[dict] | None = None,
) -> dict:
    """
    Orquesta el análisis mundial completo:
      - configuraciones (aspectos + ingresos) dentro del rango, con su cielo real
      - análogos históricos por configuración
      - síntesis temática agregando tags de análogos coincidentes
      - impactos natales si se proveen natal_planets
    """
    configs = find_mundane_configurations(start_date_str, end_date_str)

    configurations_out = []
    theme_counts: dict[str, int] = {}

    for config in configs:
        analogs = match_historical_analogs(config)
        for analog in analogs:
            for tag in analog["tags"]:
                theme_counts[tag] = theme_counts.get(tag, 0) + 1

        configurations_out.append({
            **config,
            "analogs": analogs,
        })

    probable_themes = [
        tag for tag, _ in sorted(theme_counts.items(), key=lambda kv: -kv[1])
    ][:8]

    natal_impacts: list[dict] = []
    if natal_planets:
        natal_impacts = find_natal_impacts(configs, natal_planets)

    return {
        "start_date": start_date_str,
        "end_date": end_date_str,
        "configurations": configurations_out,
        "probable_themes": probable_themes,
        "natal_impacts": natal_impacts,
    }
