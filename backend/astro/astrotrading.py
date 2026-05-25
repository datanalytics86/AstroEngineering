"""
AstroTrading — señales direccionales LONG/SHORT/NEUTRAL basadas en tránsitos
planetarios sobre cartas de inicio de mercados financieros.

Esto es SOLO entretenimiento y exploración de la tradición astro-financiera
(Meridian, Merriman, Gann, Morris). No constituye asesoría financiera.

Bibliografía:
  - Meridian, B. "Planetary Stock Trading" (varias ediciones).
  - Merriman, R. "The Ultimate Book on Stock Market Timing".
  - Gann, W.D. "The Tunnel Thru the Air" / market cycle studies.
"""

import math
from datetime import datetime

from .market_charts import MARKET_CHARTS
from .chart import calculate_natal_chart
from .transits import calculate_transit_timeline
from .mundane import _compute_current_sky
from .aspects import angular_distance, ASPECTS, TRANSIT_ORBS, score_transit

# ── Tabla de sesgo direccional ────────────────────────────────────────────────
# (transit_planet, nature) → voto con signo: + alcista / − bajista
# Base: benéficos expanden (alcista), maléficos contraen (bajista);
#       aspecto armonioso suaviza, tenso agrava.
_DIRECTIONAL_BIAS: dict[tuple[str, str], float] = {
    ("Júpiter",  "armonioso"): +2.0,
    ("Júpiter",  "tenso"):     +0.5,   # benefic under stress → exceso, aún levemente alcista
    ("Júpiter",  "neutro"):    +0.5,
    ("Júpiter",  "menor"):     +0.3,
    ("Venus",    "armonioso"): +1.5,
    ("Venus",    "tenso"):     -0.5,
    ("Venus",    "neutro"):    +0.5,
    ("Venus",    "menor"):     +0.3,
    ("Saturno",  "armonioso"): +1.0,   # soporte/estructura → positivo
    ("Saturno",  "tenso"):     -2.0,   # restricción/corrección
    ("Saturno",  "neutro"):    +0.2,
    ("Saturno",  "menor"):     -0.3,
    ("Plutón",   "armonioso"): +1.0,
    ("Plutón",   "tenso"):     -1.5,
    ("Plutón",   "neutro"):    +0.2,
    ("Plutón",   "menor"):     -0.2,
    ("Marte",    "armonioso"): +0.5,
    ("Marte",    "tenso"):     -1.5,
    ("Marte",    "neutro"):    -0.3,
    ("Marte",    "menor"):     -0.2,
    # Urano → volatilidad; sesgo 0 (no direccional por sí mismo)
    ("Urano",    "armonioso"):  0.0,
    ("Urano",    "tenso"):      0.0,
    ("Urano",    "neutro"):     0.0,
    ("Urano",    "menor"):      0.0,
    # Neptuno → neblina/especulación; sesgo negativo solo en tensión
    ("Neptuno",  "armonioso"):  0.0,
    ("Neptuno",  "tenso"):     -0.5,
    ("Neptuno",  "neutro"):     0.0,
    ("Neptuno",  "menor"):      0.0,
    # Planetas rápidos (para señal corto plazo)
    ("Sol",      "armonioso"): +0.5,
    ("Sol",      "tenso"):     -0.5,
    ("Sol",      "neutro"):    +0.2,
    ("Sol",      "menor"):     +0.1,
    ("Mercurio", "armonioso"): +0.3,
    ("Mercurio", "tenso"):     -0.3,
    ("Mercurio", "neutro"):     0.0,
    ("Mercurio", "menor"):      0.0,
    ("Luna",     "armonioso"): +0.3,
    ("Luna",     "tenso"):     -0.3,
    ("Luna",     "neutro"):    +0.1,
    ("Luna",     "menor"):      0.0,
}

_CONSENSUS_THRESHOLD = 0.15   # consensus > +0.15 → LONG, < -0.15 → SHORT


def _house_multiplier(house: int) -> float:
    """Ponderación por casa natal del planeta natal afectado."""
    if house in (2, 8):
        return 1.4   # casas de dinero/transformación
    if house in (5, 11):
        return 1.25  # casas de especulación/ganancias
    return 1.0


def derive_signal(
    transits: list[dict],
    current_sky: list[dict] | None = None,
    house_map: dict[str, int] | None = None,
) -> dict:
    """
    Calcula la señal LONG/SHORT/NEUTRAL con CONSENSO NORMALIZADO.

    Algoritmo (calidad > cantidad):
      weight_i  = (score_i / 10) * house_mult(natal_house_i)
      vote_i    = bias_i * weight_i
      bullish   = Σ vote_i  donde vote_i > 0
      bearish   = Σ vote_i  donde vote_i < 0
      gross     = bullish + abs(bearish)   ← presión total
      net       = bullish + bearish
      consensus = net / gross  si gross > 0, si no 0.0   ∈ [-1, 1]
      activity  = 1 - exp(-gross / 5.0)                  ∈ [0, 1]
      confidence = round(|consensus| * activity * caution_factor, 2)
      direction: LONG si consensus >= +0.15 ; SHORT si <= -0.15 ; NEUTRAL

    current_sky: para detectar caution_flags (Mercurio Rx, etc.).
    house_map: {nombre_planeta_natal: número_de_casa}
    """
    if house_map is None:
        house_map = {}

    bullish_score = 0.0
    bearish_score = 0.0
    votes: list[tuple[float, str]] = []
    has_uranus  = False
    has_neptune = False

    for t in transits:
        planet  = t["transit_planet"] if isinstance(t, dict) else t.transit_planet
        nature  = t["nature"]         if isinstance(t, dict) else t.nature
        score   = t["score"]          if isinstance(t, dict) else t.score
        aspect  = t["aspect_name"]    if isinstance(t, dict) else t.aspect_name
        natal_p = t["natal_planet"]   if isinstance(t, dict) else t.natal_planet

        # Filtro de ruido: ignora aspectos menores de baja calidad
        if score < 2 or nature == "menor":
            continue

        if planet == "Urano":
            has_uranus = True
        if planet == "Neptuno":
            has_neptune = True

        bias = _DIRECTIONAL_BIAS.get((planet, nature), 0.0)
        house = house_map.get(natal_p, 0)
        weight = (score / 10.0) * _house_multiplier(house)
        vote = bias * weight

        if vote > 0:
            bullish_score += vote
        elif vote < 0:
            bearish_score += vote

        direction_tag = "alcista" if vote > 0 else "bajista" if vote < 0 else "neutro"
        votes.append((abs(vote), f"{planet} {aspect} {natal_p} ({direction_tag}, score {score:.1f})"))

    net_score = bullish_score + bearish_score
    gross = bullish_score + abs(bearish_score)
    consensus = (net_score / gross) if gross > 0 else 0.0
    activity = 1.0 - math.exp(-gross / 5.0)

    # ── Volatilidad ───────────────────────────────────────────────────────────
    volatility = "alta" if has_uranus else ("media" if abs(consensus) > 0.3 else "baja")

    # ── Caution flags ─────────────────────────────────────────────────────────
    caution_flags: list[str] = []
    if current_sky:
        for p in current_sky:
            name  = p["name"]      if isinstance(p, dict) else p.name
            retro = p["retrograde"] if isinstance(p, dict) else p.retrograde
            if name == "Mercurio" and retro:
                caution_flags.append("☿ Mercurio retrógrado")
    if has_neptune:
        caution_flags.append("♆ Neptuno activo — niebla/especulación")
    if has_uranus:
        caution_flags.append("♅ Urano activo — alta volatilidad e imprevistos")

    # ── Confianza ─────────────────────────────────────────────────────────────
    caution_factor = 0.85 ** len(caution_flags)
    confidence = round(abs(consensus) * activity * caution_factor, 2)

    # ── Dirección ─────────────────────────────────────────────────────────────
    if consensus >= _CONSENSUS_THRESHOLD:
        direction = "LONG"
    elif consensus <= -_CONSENSUS_THRESHOLD:
        direction = "SHORT"
    else:
        direction = "NEUTRAL"

    # ── Rationale (top 4 por |vote|) ─────────────────────────────────────────
    votes.sort(key=lambda x: x[0], reverse=True)
    rationale = [desc for _, desc in votes[:4]] if votes else ["Sin tránsitos activos significativos"]

    return {
        "direction":     direction,
        "confidence":    confidence,
        "bullish_score": round(bullish_score, 2),
        "bearish_score": round(bearish_score, 2),
        "net_score":     round(net_score, 2),
        "consensus":     round(consensus, 3),
        "volatility":    volatility,
        "rationale":     rationale,
        "caution_flags": caution_flags,
    }


def compute_current_fast_aspects(
    current_sky: list[dict],
    inception_planets: list[dict],
) -> list[dict]:
    """
    Detecta aspectos entre planetas rápidos (Sol, Luna, Mercurio, Venus, Marte)
    del cielo actual y los planetas de la carta de inicio.

    Orbe estricto: ≤ 3° para planetas solares; ≤ 5° para la Luna.
    Devuelve dicts con la misma forma que TransitEvent para que derive_signal
    los procese sin modificaciones.
    """
    FAST_PLANETS = {"Sol", "Luna", "Mercurio", "Venus", "Marte"}
    FAST_ORB_DEFAULT = 3.0
    FAST_ORB_LUNA    = 5.0

    sky_by_name = {
        (p["name"] if isinstance(p, dict) else p.name): p
        for p in current_sky
    }

    results = []
    for sky_p in current_sky:
        t_name = sky_p["name"] if isinstance(sky_p, dict) else sky_p.name
        if t_name not in FAST_PLANETS:
            continue
        t_lon = sky_p["longitude"] if isinstance(sky_p, dict) else sky_p.longitude

        for natal_p in inception_planets:
            n_name = natal_p["name"] if isinstance(natal_p, dict) else natal_p.name
            n_lon  = natal_p["longitude"] if isinstance(natal_p, dict) else natal_p.longitude
            n_house = natal_p.get("house", 1) if isinstance(natal_p, dict) else getattr(natal_p, "house", 1)

            dist = angular_distance(t_lon, n_lon)
            max_orb = FAST_ORB_LUNA if t_name == "Luna" else FAST_ORB_DEFAULT

            for asp in ASPECTS:
                orb = abs(dist - asp["angle"])
                if orb <= min(asp["orb"], max_orb):
                    sc = score_transit(t_name, n_name, asp["name"], orb)
                    results.append({
                        "transit_planet":    t_name,
                        "transit_longitude": t_lon,
                        "transit_sign":      "",
                        "natal_planet":      n_name,
                        "natal_longitude":   n_lon,
                        "aspect_name":       asp["name"],
                        "orb":               round(orb, 3),
                        "applying":          False,
                        "exact_date":        None,
                        "enters_orb":        "",
                        "leaves_orb":        "",
                        "nature":            asp["nature"],
                        "importance":        "media",
                        "score":             sc,
                        "natal_house":       n_house,
                    })
    return results


def _compute_lunar_info(current_sky: list[dict]) -> dict:
    """
    Calcula fase lunar, iluminación y estado de Mercurio.
    """
    sky_by_name: dict[str, dict] = {}
    for p in current_sky:
        name = p["name"] if isinstance(p, dict) else p.name
        sky_by_name[name] = p

    sol  = sky_by_name.get("Sol")
    luna = sky_by_name.get("Luna")
    merc = sky_by_name.get("Mercurio")

    if sol is None or luna is None:
        return {
            "phase_name": "Desconocida",
            "phase_angle": 0.0,
            "illumination": 0.0,
            "mercury_retrograde": False,
            "note": "",
        }

    sol_lon  = sol["longitude"]  if isinstance(sol,  dict) else sol.longitude
    luna_lon = luna["longitude"] if isinstance(luna, dict) else luna.longitude
    merc_rx  = (merc["retrograde"] if isinstance(merc, dict) else merc.retrograde) if merc else False

    sep = (luna_lon - sol_lon) % 360
    illumination = round((1 - math.cos(math.radians(sep))) / 2, 2)

    if sep < 22.5 or sep >= 337.5:
        phase_name = "Luna nueva"
    elif sep < 67.5:
        phase_name = "Creciente"
    elif sep < 112.5:
        phase_name = "Cuarto creciente"
    elif sep < 157.5:
        phase_name = "Gibosa creciente"
    elif sep < 202.5:
        phase_name = "Luna llena"
    elif sep < 247.5:
        phase_name = "Gibosa menguante"
    elif sep < 292.5:
        phase_name = "Cuarto menguante"
    else:
        phase_name = "Menguante"

    is_turn_point = phase_name in ("Luna nueva", "Luna llena")
    note_parts = []
    if is_turn_point:
        note_parts.append(f"{phase_name}: posible punto de giro en mercados")
    if merc_rx:
        note_parts.append("Mercurio Rx: cautela en contratos y comunicaciones")

    return {
        "phase_name":        phase_name,
        "phase_angle":       round(sep, 1),
        "illumination":      illumination,
        "mercury_retrograde": merc_rx,
        "note":              " · ".join(note_parts),
    }


def calculate_astrotrading_response(
    market_key: str,
    start_date_str: str,
    end_date_str: str,
) -> dict:
    """
    Calcula:
      1. Carta de inicio (inception chart) del mercado
      2. Cielo actual
      3. Tránsitos de planetas lentos sobre la carta del mercado
      4. Señal tendencia macro LONG/SHORT/NEUTRAL (planetas lentos)
      5. Señal corto plazo (planetas rápidos vs carta de inicio)
      6. Señales mensuales (12 meses) con consensus
      7. Fase lunar + estado de Mercurio
      8. Calendario de fechas exactas

    Returns dict compatible con AstroTradingResponse.
    ⚠️ Solo entretenimiento. No es asesoría financiera.
    """
    if market_key not in MARKET_CHARTS:
        raise ValueError(
            f"Mercado no encontrado: {market_key}. Opciones: {list(MARKET_CHARTS.keys())}"
        )

    meta = MARKET_CHARTS[market_key]
    today = datetime.utcnow()

    # ── 1. Carta de inicio ────────────────────────────────────────────────────
    birth_data = {
        "name":            meta["name"],
        "birth_date":      meta["birth_date"],
        "birth_time":      meta["birth_time"],
        "latitude":        meta["latitude"],
        "longitude":       meta["longitude"],
        "timezone_offset": meta["timezone_offset"],
    }
    natal = calculate_natal_chart(birth_data)

    inception_chart = {
        "country_key":   market_key,
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

    # Mapa planeta_natal → número de casa (para house_multiplier)
    house_map: dict[str, int] = {
        p["name"]: p.get("house", 1)
        for p in natal["planets"]
        if isinstance(p, dict)
    }

    # ── 2. Cielo actual ───────────────────────────────────────────────────────
    current_sky = _compute_current_sky(today)

    # ── 3 & 4. Tránsitos + timeline ──────────────────────────────────────────
    transit_result = calculate_transit_timeline(
        natal_planets=natal["planets"],
        start_date_str=start_date_str,
        end_date_str=end_date_str,
        lat=meta["latitude"],
        lon=meta["longitude"],
    )

    current_transits = transit_result["current_transits"]

    # ── 5. Señal tendencia macro (planetas lentos) ────────────────────────────
    signal_trend = derive_signal(current_transits, current_sky, house_map)

    # ── 6. Señal corto plazo (planetas rápidos) ───────────────────────────────
    fast_aspects = compute_current_fast_aspects(current_sky, natal["planets"])
    signal_short_term = derive_signal(fast_aspects, current_sky, house_map)

    # ── 7. Señales mensuales con consensus ────────────────────────────────────
    monthly_signals = []
    for month_data in transit_result["timeline"]:
        month_transits = month_data.get("transits_active", []) if isinstance(month_data, dict) else month_data.transits_active
        month_key   = month_data["month"] if isinstance(month_data, dict) else month_data.month
        theme       = month_data.get("dominant_theme", "") if isinstance(month_data, dict) else month_data.dominant_theme
        month_sig   = derive_signal(month_transits, None, house_map)
        monthly_signals.append({
            "month":         month_key,
            "direction":     month_sig["direction"],
            "confidence":    month_sig["confidence"],
            "net_score":     month_sig["net_score"],
            "consensus":     month_sig["consensus"],
            "dominant_theme": theme,
        })

    # ── 8. Fase lunar ─────────────────────────────────────────────────────────
    lunar = _compute_lunar_info(current_sky)

    return {
        "market_key":        market_key,
        "market_name":       meta["name"],
        "ticker":            meta["ticker"],
        "asset_class":       meta["asset_class"],
        "inception_chart":   inception_chart,
        "current_sky":       current_sky,
        "current_transits":  current_transits,
        "signal":            signal_trend,   # compat: signal = trend
        "signal_trend":      signal_trend,
        "signal_short_term": signal_short_term,
        "monthly_signals":   monthly_signals,
        "timeline":          transit_result["timeline"],
        "exact_aspects_calendar": transit_result.get("exact_aspects_calendar", []),
        "lunar":             lunar,
    }
