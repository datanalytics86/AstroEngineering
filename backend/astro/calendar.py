"""
Calendario astrológico diario: resumen día a día de los astros rápidos
(Luna, Sol, Mercurio, Venus, Marte) con eventos (ingresos, fases lunares,
estaciones retrógradas, aspectos mayores exactos, eclipses) para el mes en
curso y los `months` meses siguientes. Astronomía computada en vivo con
Swiss Ephemeris/Moshier — nunca de fechas de memoria.
"""

from __future__ import annotations

import calendar as _pycalendar
from datetime import date, timedelta

import swisseph as swe

from .chart import PLANET_IDS, PLANET_SYMBOLS, calc_planet_position, to_julian_day
from .houses import longitude_to_sign
from .aspects import ASPECTS, angular_distance
from .transits import compute_retrograde_periods
from .mundane import find_eclipses

FAST_BODIES = ["Sol", "Mercurio", "Venus", "Marte"]
SLOW_BODIES = ["Júpiter", "Saturno", "Urano", "Neptuno", "Plutón"]
INGRESS_BODIES = ["Sol", "Luna", "Mercurio", "Venus", "Marte"]
STATION_PLANETS = ("Mercurio", "Venus", "Marte")

MOON_PHASE_NAMES = ["nueva", "creciente", "llena", "menguante"]


def _sky_snapshot(jd: float) -> dict[str, dict]:
    """Posiciones (longitud + signo) al mediodía UT para todos los cuerpos
    rápidos + lentos relevantes al calendario."""
    snapshot = {}
    for name in FAST_BODIES + ["Luna"] + SLOW_BODIES:
        pid = PLANET_IDS.get(name)
        if pid is None:
            continue
        pos = calc_planet_position(jd, pid)
        if pos is None:
            continue
        sign_info = longitude_to_sign(pos["longitude"])
        snapshot[name] = {
            "longitude": pos["longitude"],
            "sign": sign_info["sign"],
            "degree_in_sign": sign_info["degree_in_sign"],
            "speed": pos["speed"],
        }
    return snapshot


def _moon_phase_angle(sun_lon: float, moon_lon: float) -> float:
    """Elongación Luna-Sol en [0, 360)."""
    return (moon_lon - sun_lon) % 360


def _closest_phase_crossing(angle_prev: float, angle_today: float) -> str | None:
    """Detecta si la elongación cruzó 0/90/180/270 entre ayer y hoy."""
    targets = [0.0, 90.0, 180.0, 270.0]
    # normaliza para detectar cruce hacia adelante (la elongación crece salvo
    # el wrap 360->0)
    for idx, target in enumerate(targets):
        lo, hi = angle_prev, angle_today
        if hi < lo:
            hi += 360
        t = target if target >= lo else target + 360
        if lo <= t <= hi:
            return MOON_PHASE_NAMES[idx]
    return None


def _daily_snapshot_cache(start_jd: float, num_days: int) -> list[dict]:
    return [_sky_snapshot(start_jd + i) for i in range(num_days)]


def compute_daily_calendar(year: int, month: int, months: int = 3) -> list[dict]:
    """Calcula `months` meses (empezando en `year`-`month`) de calendario
    astrológico diario. Retorna lista de dicts {year, month, days: [...]}."""
    # Rango total de días a cubrir, con 1 día de margen antes para comparar
    # ingresos/fases del primer día del primer mes.
    first_day = date(year, month, 1)
    # último día del último mes del rango
    end_month = month + months - 1
    end_year = year + (end_month - 1) // 12
    end_month_norm = ((end_month - 1) % 12) + 1
    last_day_num = _pycalendar.monthrange(end_year, end_month_norm)[1]
    last_day = date(end_year, end_month_norm, last_day_num)

    range_start = first_day - timedelta(days=1)
    total_days = (last_day - range_start).days + 1

    start_jd = to_julian_day(range_start.year, range_start.month, range_start.day, 12.0)
    snapshots = _daily_snapshot_cache(start_jd, total_days)

    # Eclipses del rango completo (una sola llamada, se distribuyen por fecha)
    eclipses_raw = find_eclipses(first_day.isoformat(), last_day.isoformat())
    eclipses_by_date: dict[str, dict] = {e["exact_date"]: e for e in eclipses_raw}

    # Estaciones retro de Mercurio/Venus/Marte para los años involucrados
    years_involved = sorted({first_day.year, last_day.year})
    stations_by_date: dict[str, list[dict]] = {}
    for y in years_involved:
        for period in compute_retrograde_periods(y, planets=STATION_PLANETS):
            stations_by_date.setdefault(period["start_date"], []).append(
                {"planet": period["planet"], "type": "retrograde", "sign": period["start_sign"]}
            )
            stations_by_date.setdefault(period["end_date"], []).append(
                {"planet": period["planet"], "type": "direct", "sign": period["end_sign"]}
            )

    days_out: dict[str, dict] = {}

    for i, cur_date in enumerate([range_start + timedelta(days=k) for k in range(total_days)]):
        if cur_date < first_day:
            continue  # solo margen para comparación, no se emite
        iso = cur_date.isoformat()
        today = snapshots[i]
        yesterday = snapshots[i - 1] if i > 0 else None

        events: list[dict] = []

        # a) Ingresos de signo (comparando ayer vs hoy)
        if yesterday:
            for body in INGRESS_BODIES:
                if body not in today or body not in yesterday:
                    continue
                if today[body]["sign"] != yesterday[body]["sign"]:
                    events.append({
                        "type": "ingress",
                        "body": body,
                        "sign": today[body]["sign"],
                    })

        # b) Fase lunar (cruce de elongación)
        if yesterday and "Sol" in today and "Luna" in today and "Sol" in yesterday and "Luna" in yesterday:
            angle_prev = _moon_phase_angle(yesterday["Sol"]["longitude"], yesterday["Luna"]["longitude"])
            angle_today = _moon_phase_angle(today["Sol"]["longitude"], today["Luna"]["longitude"])
            phase = _closest_phase_crossing(angle_prev, angle_today)
            if phase:
                events.append({"type": "moon_phase", "phase": phase})

        # c) Estaciones
        for st in stations_by_date.get(iso, []):
            events.append({
                "type": "station",
                "body": st["planet"],
                "station": st["type"],
                "sign": st["sign"],
            })

        # d) Aspectos mayores exactos rápido-lento o rápido-rápido (sin Luna)
        aspect_candidates = []
        pairable = FAST_BODIES + SLOW_BODIES
        prev_snap = yesterday
        next_snap = snapshots[i + 1] if i + 1 < len(snapshots) else None
        for bi, b1 in enumerate(pairable):
            for b2 in pairable[bi + 1:]:
                if b1 in FAST_BODIES and b2 in FAST_BODIES:
                    pass  # rápido-rápido permitido
                elif b1 in SLOW_BODIES and b2 in SLOW_BODIES:
                    continue  # lento-lento fuera de alcance del calendario diario
                if b1 not in today or b2 not in today:
                    continue
                angle_today = angular_distance(today[b1]["longitude"], today[b2]["longitude"])
                for asp in ASPECTS:
                    if asp["name"] not in ("Conjunción", "Sextil", "Cuadratura", "Trígono", "Oposición"):
                        continue
                    orb_today = abs(angle_today - asp["angle"])
                    if orb_today > 1.0:
                        continue
                    # mínimo local: comparar con ayer/mañana si existen
                    is_local_min = True
                    if prev_snap and b1 in prev_snap and b2 in prev_snap:
                        angle_prev = angular_distance(prev_snap[b1]["longitude"], prev_snap[b2]["longitude"])
                        if abs(angle_prev - asp["angle"]) < orb_today:
                            is_local_min = False
                    if next_snap and b1 in next_snap and b2 in next_snap:
                        angle_next = angular_distance(next_snap[b1]["longitude"], next_snap[b2]["longitude"])
                        if abs(angle_next - asp["angle"]) < orb_today:
                            is_local_min = False
                    if is_local_min:
                        aspect_candidates.append({
                            "type": "aspect",
                            "bodies": [b1, b2],
                            "aspect": asp["name"],
                            "orb": round(orb_today, 3),
                        })
        aspect_candidates.sort(key=lambda a: a["orb"])
        events.extend(aspect_candidates[:2])

        # e) Eclipses
        if iso in eclipses_by_date:
            ecl = eclipses_by_date[iso]
            events.append({
                "type": "eclipse",
                "eclipse_type": ecl["eclipse_type"],
                "eclipse_subtype": ecl["eclipse_subtype"],
            })

        moon_sign = today.get("Luna", {}).get("sign", "")
        moon_deg = today.get("Luna", {}).get("degree_in_sign", 0.0)
        moon_lon = today.get("Luna", {}).get("longitude", 0.0)
        sun_sign = today.get("Sol", {}).get("sign", "")
        sun_deg = today.get("Sol", {}).get("degree_in_sign", 0.0)

        days_out[iso] = {
            "date": iso,
            "moon": {"sign": moon_sign, "degree_in_sign": round(moon_deg, 2), "longitude": round(moon_lon, 4)},
            "sun": {"sign": sun_sign, "degree_in_sign": round(sun_deg, 2)},
            "events": events,
        }

    # Agrupar por mes en orden
    months_out: list[dict] = []
    cursor_year, cursor_month = year, month
    for _ in range(months):
        num_days = _pycalendar.monthrange(cursor_year, cursor_month)[1]
        month_days = []
        for d in range(1, num_days + 1):
            iso = date(cursor_year, cursor_month, d).isoformat()
            if iso in days_out:
                month_days.append(days_out[iso])
        months_out.append({"year": cursor_year, "month": cursor_month, "days": month_days})
        cursor_month += 1
        if cursor_month > 12:
            cursor_month = 1
            cursor_year += 1

    return months_out
