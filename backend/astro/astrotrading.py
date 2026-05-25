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

from datetime import datetime

from .market_charts import MARKET_CHARTS
from .chart import calculate_natal_chart
from .transits import calculate_transit_timeline
from .mundane import _compute_current_sky

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
}

_DIRECTION_THRESHOLD = 1.0  # net_score > +1.0 → LONG, < -1.0 → SHORT
_CONFIDENCE_SCALE    = 6.0  # net_score de ±6 → confianza 1.0


def derive_signal(transits: list[dict], current_sky: list[dict] | None = None) -> dict:
    """
    Calcula la señal LONG/SHORT/NEUTRAL a partir de una lista de TransitEvents.
    current_sky se usa solo para detectar caution_flags (Mercury Rx, etc.).
    """
    bullish_score = 0.0
    bearish_score = 0.0
    votes: list[tuple[float, str]] = []  # (|vote|, descripción legible)
    has_uranus   = False
    has_neptune  = False

    for t in transits:
        planet  = t["transit_planet"] if isinstance(t, dict) else t.transit_planet
        nature  = t["nature"]         if isinstance(t, dict) else t.nature
        score   = t["score"]          if isinstance(t, dict) else t.score
        aspect  = t["aspect_name"]    if isinstance(t, dict) else t.aspect_name
        natal_p = t["natal_planet"]   if isinstance(t, dict) else t.natal_planet

        if planet == "Urano":
            has_uranus = True
        if planet == "Neptuno":
            has_neptune = True

        bias = _DIRECTIONAL_BIAS.get((planet, nature), 0.0)
        vote = bias * (score / 10.0)

        if vote > 0:
            bullish_score += vote
        elif vote < 0:
            bearish_score += vote

        direction_tag = "alcista" if vote > 0 else "bajista" if vote < 0 else "neutro"
        votes.append((abs(vote), f"{planet} {aspect} {natal_p} ({direction_tag}, score {score:.1f})"))

    net_score = bullish_score + bearish_score

    # ── Volatilidad ───────────────────────────────────────────────────────────
    volatility = "alta" if has_uranus else ("media" if abs(net_score) > 1.5 else "baja")

    # ── Caution flags ─────────────────────────────────────────────────────────
    caution_flags: list[str] = []
    if current_sky:
        for p in current_sky:
            name = p["name"] if isinstance(p, dict) else p.name
            retro = p["retrograde"] if isinstance(p, dict) else p.retrograde
            if name == "Mercurio" and retro:
                caution_flags.append("☿ Mercurio retrógrado")
    if has_neptune:
        caution_flags.append("♆ Neptuno activo — niebla/especulación")
    if has_uranus:
        caution_flags.append("♅ Urano activo — alta volatilidad e imprevistos")

    # ── Confianza ─────────────────────────────────────────────────────────────
    raw_confidence = min(1.0, abs(net_score) / _CONFIDENCE_SCALE)
    caution_factor = 0.85 ** len(caution_flags)
    confidence = round(raw_confidence * caution_factor, 2)

    # ── Dirección ─────────────────────────────────────────────────────────────
    if net_score > _DIRECTION_THRESHOLD:
        direction = "LONG"
    elif net_score < -_DIRECTION_THRESHOLD:
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
        "volatility":    volatility,
        "rationale":     rationale,
        "caution_flags": caution_flags,
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
      4. Señal global LONG/SHORT/NEUTRAL con confianza
      5. Señales mensuales (12 meses)
      6. Timeline mensual completo

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

    # ── 5. Señal global ───────────────────────────────────────────────────────
    signal = derive_signal(current_transits, current_sky)

    # ── 6. Señales mensuales ──────────────────────────────────────────────────
    monthly_signals = []
    for month_data in transit_result["timeline"]:
        month_transits = month_data.get("transits_active", []) if isinstance(month_data, dict) else month_data.transits_active
        month_key   = month_data["month"] if isinstance(month_data, dict) else month_data.month
        theme       = month_data.get("dominant_theme", "") if isinstance(month_data, dict) else month_data.dominant_theme
        month_sig   = derive_signal(month_transits)
        monthly_signals.append({
            "month":         month_key,
            "direction":     month_sig["direction"],
            "confidence":    month_sig["confidence"],
            "net_score":     month_sig["net_score"],
            "dominant_theme": theme,
        })

    return {
        "market_key":       market_key,
        "market_name":      meta["name"],
        "ticker":           meta["ticker"],
        "asset_class":      meta["asset_class"],
        "inception_chart":  inception_chart,
        "current_sky":      current_sky,
        "current_transits": current_transits,
        "signal":           signal,
        "monthly_signals":  monthly_signals,
        "timeline":         transit_result["timeline"],
    }
