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
# Firma = configuración recurrente que enlaza analógicamente con 2026-2027.
# Cada evento puede tener una firma única (`signature`) o varias (`signatures`,
# lista) cuando el momento histórico coincide con más de una configuración
# lenta (ej. Fort Sumter 1861: Urano ingresa Géminis Y Neptuno ingresa Aries).
# TODA firma de este corpus está verificada contra el cielo real calculado con
# Swiss Ephemeris/Moshier — ver backend/scripts/verify_corpus.py. Orbe máximo
# aceptado para firmas de aspecto: 8°. Atribución temática (Cassanya, Barbault,
# Tarnas) — sin citas textuales ni números de página inventados.
HISTORICAL_EVENTS: list[dict] = [
    # ── Saturno–Urano ────────────────────────────────────────────────────────
    {
        "id": "constantinopla_1453",
        "date": "1453-05-29",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Cuadratura"},
        "region": "Mediterráneo oriental / Europa",
        "tags": ["fin_de_ciclo", "cambio_de_era", "colapso_de_estructuras"],
    },
    {
        "id": "imprenta_gutenberg_1454",
        "date": "1454-01-01",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Cuadratura"},
        "region": "Europa central",
        "tags": ["innovacion_tecnologica", "cambio_de_era", "ruptura_con_el_pasado"],
    },
    {
        "id": "lunes_negro_1987",
        "date": "1987-10-19",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["crisis_economica", "ruptura_brusca", "colapso_de_estructuras"],
    },
    {
        "id": "asalto_capitolio_2021",
        "date": "2021-01-06",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Cuadratura"},
        "region": "EE.UU.",
        "tags": ["crisis_de_poder", "ruptura_brusca", "tension_extrema"],
    },
    {
        "id": "crisis_1929",
        "date": "1929-10-24",
        "signature": {"pair": ["Saturno", "Neptuno"], "aspect": "Trígono"},
        "region": "Global",
        "tags": ["colapso_de_estructuras", "crisis_economica", "ruptura_brusca"],
    },
    {
        "id": "crisis_financiera_2008",
        "date": "2008-09-15",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Oposición"},
        "region": "Global",
        "tags": ["crisis_economica", "exceso_y_correccion", "colapso_de_estructuras"],
    },
    {
        "id": "gripe_1918",
        "date": "1918-10-01",
        "signature": {"pair": ["Saturno", "Urano"], "aspect": "Oposición"},
        "region": "Global",
        "tags": ["pandemia", "tension_extrema", "reestructuracion_social"],
    },
    # ── Saturno–Neptuno ──────────────────────────────────────────────────────
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
        "id": "muerte_stalin_1953",
        "date": "1953-03-05",
        "signature": {"pair": ["Saturno", "Neptuno"], "aspect": "Conjunción"},
        "region": "URSS",
        "tags": ["fin_de_ciclo_ideologico", "reestructuracion_social", "fin_de_ciclo"],
    },
    {
        "id": "guerra_civil_espanola_1936",
        "date": "1936-07-17",
        "signature": {"pair": ["Saturno", "Neptuno"], "aspect": "Oposición"},
        "region": "España",
        "tags": ["fractura_nacional", "idealismo_en_conflicto", "disolucion_de_estructuras"],
    },
    # ── Saturno–Plutón ───────────────────────────────────────────────────────
    {
        "id": "pandemia_2020",
        "date": "2020-03-11",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["crisis_de_poder", "fin_de_ciclo", "reestructuracion_social"],
    },
    {
        "id": "wwi_1914",
        "date": "1914-08-01",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Conjunción"},
        "region": "Europa / Global",
        "tags": ["conflicto_global", "crisis_de_poder", "fin_de_ciclo"],
    },
    {
        "id": "doctrina_truman_1947",
        "date": "1947-05-22",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["crisis_de_poder", "guerra_fria", "reestructuracion_social"],
    },
    {
        "id": "guerra_malvinas_1982",
        "date": "1982-04-02",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Conjunción"},
        "region": "Atlántico Sur",
        "tags": ["crisis_de_poder", "tension_extrema", "nacionalismo_emergente"],
    },
    {
        "id": "atentados_11s_2001",
        "date": "2001-09-11",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Oposición"},
        "region": "EE.UU. / Global",
        "tags": ["crisis_de_poder", "terrorismo", "umbral_de_colapso"],
    },
    {
        "id": "reforma_protestante_1517",
        "date": "1517-10-31",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Conjunción"},
        "region": "Europa central",
        "tags": ["revolucion_ideologica", "ruptura_con_el_pasado", "fin_de_ciclo_ideologico"],
    },
    {
        "id": "crisis_petroleo_1973",
        "date": "1973-10-17",
        "signature": {"pair": ["Saturno", "Plutón"], "aspect": "Cuadratura"},
        "region": "Global",
        "tags": ["crisis_economica", "tension_extrema", "reestructuracion_social"],
    },
    # ── Urano–Plutón ─────────────────────────────────────────────────────────
    {
        "id": "crisis_misiles_cuba_1962",
        "date": "1962-10-16",
        "signature": {"pair": ["Urano", "Plutón"], "aspect": "Conjunción"},
        "region": "América / Global",
        "tags": ["crisis_de_poder", "tension_extrema", "umbral_de_colapso"],
    },
    {
        "id": "primavera_arabe_2011",
        "date": "2010-12-01",
        "signature": {"pair": ["Urano", "Plutón"], "aspect": "Cuadratura"},
        "region": "Medio Oriente / Norte de África",
        "tags": ["revolucion_ideologica", "poder_colectivo", "ruptura_con_el_pasado"],
    },
    {
        "id": "rebelion_taiping_1851",
        "date": "1851-01-11",
        "signature": {"pair": ["Urano", "Plutón"], "aspect": "Conjunción"},
        "region": "China",
        "tags": ["revolucion_ideologica", "poder_colectivo", "ruptura_con_el_pasado"],
    },
    {
        "id": "disturbios_watts_1965",
        "date": "1965-08-11",
        "signature": {"pair": ["Urano", "Plutón"], "aspect": "Conjunción"},
        "region": "EE.UU.",
        "tags": ["poder_colectivo", "resistencia_civil", "ruptura_con_el_pasado"],
    },
    {
        "id": "reino_del_terror_1793",
        "date": "1793-09-05",
        "signature": {"pair": ["Urano", "Plutón"], "aspect": "Oposición"},
        "region": "Francia",
        "tags": ["revolucion_ideologica", "ruptura_brusca", "poder_colectivo"],
    },
    # ── Urano–Neptuno (~172 años) ────────────────────────────────────────────
    {
        "id": "independencia_peru_1821",
        "date": "1821-07-28",
        "signature": {"pair": ["Urano", "Neptuno"], "aspect": "Conjunción"},
        "region": "Perú / Sudamérica",
        "tags": ["nacimiento_de_naciones", "ideales_de_libertad", "cambio_de_era"],
    },
    {
        "id": "independencia_grecia_1821",
        "date": "1821-03-25",
        "signature": {"pair": ["Urano", "Neptuno"], "aspect": "Conjunción"},
        "region": "Grecia / Mediterráneo",
        "tags": ["nacimiento_de_naciones", "ideales_de_libertad", "ruptura_con_el_pasado"],
    },
    {
        "id": "tratado_maastricht_1993",
        "date": "1993-11-01",
        "signature": {"pair": ["Urano", "Neptuno"], "aspect": "Conjunción"},
        "region": "Europa",
        "tags": ["integracion_regional", "nueva_era", "reestructuracion_social"],
    },
    {
        "id": "www_dominio_publico_1993",
        "date": "1993-04-30",
        "signature": {"pair": ["Urano", "Neptuno"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["innovacion_tecnologica", "liberacion_de_la_informacion", "nueva_era"],
    },
    # ── Júpiter–Saturno (ciclo social de ~20 años) ──────────────────────────
    {
        "id": "gran_conjuncion_2020",
        "date": "2020-12-21",
        "signature": {"pair": ["Júpiter", "Saturno"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["cambio_de_era", "reestructuracion_social", "nuevo_ciclo_de_20_anos"],
    },
    {
        "id": "muro_berlin_construccion_1961",
        "date": "1961-08-13",
        "signature": {"pair": ["Júpiter", "Saturno"], "aspect": "Conjunción"},
        "region": "Alemania",
        "tags": ["fractura_nacional", "reestructuracion_social", "guerra_fria"],
    },
    {
        "id": "investidura_reagan_1981",
        "date": "1981-01-20",
        "signature": {"pair": ["Júpiter", "Saturno"], "aspect": "Conjunción"},
        "region": "EE.UU.",
        "tags": ["reestructuracion_social", "nuevo_ciclo_de_20_anos", "cambio_de_era"],
    },
    {
        "id": "pico_puntocom_2000",
        "date": "2000-05-28",
        "signature": {"pair": ["Júpiter", "Saturno"], "aspect": "Conjunción"},
        "region": "Global",
        "tags": ["exceso_y_correccion", "crisis_economica", "nuevo_ciclo_de_20_anos"],
    },
    {
        "id": "blitz_londres_1940",
        "date": "1940-09-07",
        "signature": {"pair": ["Júpiter", "Saturno"], "aspect": "Conjunción"},
        "region": "Reino Unido",
        "tags": ["conflicto_global", "tension_extrema", "reestructuracion_social"],
    },
    {
        "id": "llegada_colon_1492",
        "date": "1492-10-12",
        "signature": {"pair": ["Júpiter", "Saturno"], "aspect": "Oposición"},
        "region": "América / Global",
        "tags": ["cambio_de_era", "expansion_territorial", "nueva_era"],
    },
    # ── Júpiter–Urano (hitos técnicos) ───────────────────────────────────────
    {
        "id": "llegada_luna_1969",
        "date": "1969-07-20",
        "signature": {"pair": ["Júpiter", "Urano"], "aspect": "Conjunción"},
        "region": "EE.UU. / Global",
        "tags": ["innovacion_tecnologica", "nueva_era", "disrupcion_irreversible"],
    },
    {
        "id": "vuelo_lindbergh_1927",
        "date": "1927-05-21",
        "signature": {"pair": ["Júpiter", "Urano"], "aspect": "Conjunción"},
        "region": "Atlántico Norte",
        "tags": ["innovacion_tecnologica", "nueva_era"],
    },
    {
        "id": "clonacion_dolly_1997",
        "date": "1997-02-22",
        "signature": {"pair": ["Júpiter", "Urano"], "aspect": "Conjunción"},
        "region": "Reino Unido / Global",
        "tags": ["innovacion_tecnologica", "disrupcion_irreversible", "avance_cientifico"],
    },
    # ── Júpiter–Plutón ───────────────────────────────────────────────────────
    {
        "id": "crisis_bancaria_europea_1931",
        "date": "1931-05-11",
        "signature": {"pair": ["Júpiter", "Plutón"], "aspect": "Conjunción"},
        "region": "Austria / Europa",
        "tags": ["crisis_economica", "colapso_de_estructuras", "exceso_y_correccion"],
    },
    {
        "id": "gran_recesion_2007",
        "date": "2007-12-10",
        "signature": {"pair": ["Júpiter", "Plutón"], "aspect": "Conjunción"},
        "region": "EE.UU. / Global",
        "tags": ["crisis_economica", "colapso_de_estructuras", "exceso_y_correccion"],
    },
    {
        "id": "caida_saigon_1975",
        "date": "1975-04-30",
        "signature": {"pair": ["Júpiter", "Neptuno"], "aspect": "Trígono"},
        "region": "Vietnam",
        "tags": ["fin_de_conflicto", "redefinicion_de_identidad", "cambio_de_era"],
    },
    # ── Neptuno–Plutón ───────────────────────────────────────────────────────
    {
        "id": "sputnik_1957",
        "date": "1957-10-04",
        "signature": {"pair": ["Neptuno", "Plutón"], "aspect": "Sextil"},
        "region": "URSS / Global",
        "tags": ["innovacion_tecnologica", "carrera_espacial", "nueva_era"],
    },
    {
        "id": "chernobyl_1986",
        "date": "1986-04-26",
        "signature": {"pair": ["Neptuno", "Plutón"], "aspect": "Sextil"},
        "region": "Ucrania / URSS",
        "tags": ["accidente_industrial", "disolucion_de_estructuras", "umbral_de_colapso"],
    },
    # ── Ingresos ─────────────────────────────────────────────────────────────
    {
        "id": "constitucion_eeuu_1787",
        "date": "1787-09-17",
        "signature": {"body": "Plutón", "ingress": "Acuario"},
        "region": "América del Norte",
        "tags": ["nacimiento_de_naciones", "reestructuracion_social", "ideales_de_libertad"],
    },
    {
        "id": "revolucion_francesa_1789",
        "date": "1789-07-14",
        "signature": {"body": "Plutón", "ingress": "Acuario"},
        "region": "Francia / Europa",
        "tags": ["revolucion_ideologica", "ruptura_con_el_pasado", "poder_colectivo"],
    },
    {
        "id": "batalla_midway_1942",
        "date": "1942-06-04",
        "signatures": [
            {"body": "Urano", "ingress": "Géminis"},
            {"pair": ["Saturno", "Urano"], "aspect": "Conjunción"},
        ],
        "region": "Pacífico / Global",
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
        "id": "lexington_concord_1775",
        "date": "1775-04-19",
        "signature": {"body": "Urano", "ingress": "Géminis"},
        "region": "América del Norte",
        "tags": ["nacimiento_de_naciones", "ideales_de_libertad", "ruptura_con_el_pasado"],
    },
    {
        "id": "guerra_civil_eeuu_1861",
        "date": "1861-04-14",
        "signatures": [
            {"body": "Neptuno", "ingress": "Aries"},
            {"body": "Urano", "ingress": "Géminis"},
        ],
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
        "id": "caida_urss_1991",
        "date": "1991-12-26",
        "signature": {"body": "Urano", "ingress": "Capricornio"},
        "region": "Eurasia",
        "tags": ["colapso_de_estructuras", "fin_de_ciclo_ideologico", "reestructuracion_social"],
    },
    {
        "id": "anschluss_1938",
        "date": "1938-03-12",
        "signature": {"body": "Saturno", "ingress": "Aries"},
        "region": "Austria / Alemania",
        "tags": ["nacionalismo_emergente", "ocupacion_militar", "expansion_territorial"],
    },
    {
        "id": "guerra_seis_dias_1967",
        "date": "1967-06-05",
        "signature": {"body": "Saturno", "ingress": "Aries"},
        "region": "Medio Oriente",
        "tags": ["tension_extrema", "redefinicion_de_identidad", "expansion_territorial"],
    },
    {
        "id": "caida_kabul_1996",
        "date": "1996-09-27",
        "signature": {"body": "Saturno", "ingress": "Aries"},
        "region": "Afganistán",
        "tags": ["caida_de_regimen", "reestructuracion_social", "ruptura_con_el_pasado"],
    },
]


def _event_signatures(event: dict) -> list[dict]:
    """Normaliza `signature` (singular) / `signatures` (lista) a una lista única."""
    sigs = event.get("signatures")
    if sigs:
        return sigs
    return [event["signature"]]


def match_historical_analogs(config: dict) -> list[dict]:
    """
    Devuelve eventos históricos cuya firma coincide con la de la configuración,
    usando **matching por ciclo** (doctrina de ciclos de Barbault):
      - Config de aspecto: matchea todo evento del MISMO par ordenado de cuerpos.
        Si el aspecto también coincide → match_type="exact"; si el par coincide
        pero el aspecto es otro → match_type="phase" (otra fase del mismo ciclo).
      - Config de ingreso: matching exacto cuerpo + signo (match_type="exact").
    Cada análogo incluye `match_type`, `event_aspect` (el aspecto real del
    evento, si aplica) y su cielo real (compute_mundane_sky) en su fecha.
    Ordena: exact primero, luego phase; dentro de cada grupo, por fecha.
    """
    sig = config["signature"]
    analogs = []
    for event in HISTORICAL_EVENTS:
        best: tuple[str, str | None] | None = None
        for esig in _event_signatures(event):
            if "pair" in sig and "pair" in esig:
                if sorted(sig["pair"]) == sorted(esig["pair"]):
                    match_type = "exact" if sig["aspect"] == esig["aspect"] else "phase"
                    if best is None or (best[0] == "phase" and match_type == "exact"):
                        best = (match_type, esig["aspect"])
            elif "body" in sig and "body" in esig:
                if sig["body"] == esig["body"] and sig["ingress"] == esig["ingress"]:
                    best = ("exact", None)

        if best is not None:
            match_type, event_aspect = best
            analogs.append({
                "id": event["id"],
                "date": event["date"],
                "region": event["region"],
                "tags": event["tags"],
                "sky": compute_mundane_sky(event["date"]),
                "match_type": match_type,
                "event_aspect": event_aspect,
            })

    analogs.sort(key=lambda a: (0 if a["match_type"] == "exact" else 1, a["date"]))
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


def compute_cyclic_index(start_date_str: str, end_date_str: str) -> list[dict]:
    """
    Índice cíclico al estilo Barbault: para el día 15 de cada mes calendario
    dentro de [start, end], suma las separaciones angulares (0-180°) de los
    10 pares posibles entre los 5 cuerpos lentos (Júpiter, Saturno, Urano,
    Neptuno, Plutón). Un valor bajo indica concentración cíclica (los cuerpos
    lentos agrupados); históricamente Barbault asocia sus mínimos con fases
    de tensión/concentración geopolítica. Devuelve un punto por mes.
    """
    start_date = datetime.fromisoformat(start_date_str)
    end_date = datetime.fromisoformat(end_date_str)
    pairs = [(a, b) for i, a in enumerate(MUNDANE_BODIES) for b in MUNDANE_BODIES[i + 1:]]

    points: list[dict] = []
    year, month = start_date.year, start_date.month
    while (year, month) <= (end_date.year, end_date.month):
        jd = to_julian_day(year, month, 15, 12.0)
        positions: dict[str, float] = {}
        for body in MUNDANE_BODIES:
            pos = calc_planet_position(jd, PLANET_IDS[body])
            if pos is not None:
                positions[body] = pos["longitude"]

        total = 0.0
        for body_a, body_b in pairs:
            if body_a in positions and body_b in positions:
                total += angular_distance(positions[body_a], positions[body_b])

        points.append({"month": f"{year:04d}-{month:02d}", "value": round(total, 1)})

        month += 1
        if month > 12:
            month = 1
            year += 1

    return points


def build_mundane_forecast(
    start_date_str: str,
    end_date_str: str,
    natal_planets: list[dict] | None = None,
) -> dict:
    """
    Orquesta el análisis mundial completo:
      - configuraciones (aspectos + ingresos) dentro del rango, con su cielo real
      - análogos históricos por configuración (matching por ciclo, ver
        match_historical_analogs) y temas propios por configuración
      - síntesis temática global agregando tags de análogos coincidentes
      - impactos natales si se proveen natal_planets
      - índice cíclico de Barbault (compute_cyclic_index)
    """
    configs = find_mundane_configurations(start_date_str, end_date_str)

    # Clamp: descarta configuraciones cuya fecha exacta cayó fuera del rango
    # solicitado (puede ocurrir cuando el refinamiento binario de una pasada
    # retrógrada cercana al límite del rango converge fuera de él).
    configs = [
        c for c in configs
        if start_date_str <= c["exact_date"] <= end_date_str
    ]

    configurations_out = []
    theme_counts: dict[str, int] = {}

    for config in configs:
        analogs = match_historical_analogs(config)
        config_theme_counts: dict[str, int] = {}
        for analog in analogs:
            for tag in analog["tags"]:
                theme_counts[tag] = theme_counts.get(tag, 0) + 1
                config_theme_counts[tag] = config_theme_counts.get(tag, 0) + 1

        config_themes = [
            tag for tag, _ in sorted(config_theme_counts.items(), key=lambda kv: -kv[1])
        ][:6]

        configurations_out.append({
            **config,
            "analogs": analogs,
            "themes": config_themes,
        })

    probable_themes = [
        tag for tag, _ in sorted(theme_counts.items(), key=lambda kv: -kv[1])
    ][:8]

    natal_impacts: list[dict] = []
    if natal_planets:
        natal_impacts = find_natal_impacts(configs, natal_planets)

    cyclic_index = compute_cyclic_index(start_date_str, end_date_str)

    return {
        "start_date": start_date_str,
        "end_date": end_date_str,
        "configurations": configurations_out,
        "probable_themes": probable_themes,
        "natal_impacts": natal_impacts,
        "cyclic_index": cyclic_index,
    }
