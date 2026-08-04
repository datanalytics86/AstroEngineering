"""
AstroEngine Pro — Backend API
FastAPI + pyswisseph
"""

import os
import time
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from astro.models import (
    BirthData, TransitRequest, ChartResponse, TransitResponse, SolarReturnRequest,
    MundaneRequest, MundaneResponse, CountryInfo, CalendarResponse,
)
from astro.chart import calculate_natal_chart, calculate_solar_return
from astro.transits import calculate_transit_timeline
from astro.mundane import build_mundane_forecast
from astro.national import NATIONAL_CHARTS, compute_national_planets
from astro.calendar import compute_daily_calendar

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

_env = os.getenv("ENV", "development")


# ── Observabilidad fail-soft (Sentry opcional) ────────────────────────────────

def _init_sentry() -> bool:
    """Inicializa Sentry si hay DSN; nunca crashea la app si falta o falla."""
    dsn = (os.getenv("SENTRY_DSN") or "").strip()
    if not dsn:
        logger.warning(
            "SENTRY_DSN no configurado; telemetría de errores desactivada (fail-soft)"
        )
        return False
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=dsn,
            environment=os.getenv("SENTRY_ENVIRONMENT", _env),
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.05")),
            send_default_pii=False,
        )
        logger.info("Sentry inicializado (environment=%s)", os.getenv("SENTRY_ENVIRONMENT", _env))
        return True
    except Exception as exc:  # noqa: BLE001 — fail-soft obligatorio
        logger.warning("Sentry init falló (fail-soft): %s", exc)
        return False


_SENTRY_ENABLED = _init_sentry()


def _track(event: str, **fields: Any) -> None:
    """Log estructurado + breadcrumb Sentry. Sin PII de cartas (sin fecha/hora/coords completas)."""
    safe_parts = " ".join(f"{k}={v}" for k, v in fields.items())
    logger.info("event=%s %s", event, safe_parts)
    if not _SENTRY_ENABLED:
        return
    try:
        import sentry_sdk

        sentry_sdk.add_breadcrumb(
            category="compute",
            message=event,
            data={k: v for k, v in fields.items()},
            level="error" if event.endswith(".error") else "info",
        )
        if event.endswith(".error"):
            sentry_sdk.capture_message(event, level="error")
    except Exception:  # noqa: BLE001
        pass


def _capture_exc(exc: BaseException) -> None:
    if not _SENTRY_ENABLED:
        return
    try:
        import sentry_sdk

        sentry_sdk.capture_exception(exc)
    except Exception:  # noqa: BLE001
        pass


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AstroEngine Pro API",
    description="API de cálculos astrológicos con Swiss Ephemeris",
    version="1.0.0",
    docs_url="/docs" if _env != "production" else None,
    redoc_url="/redoc" if _env != "production" else None,
    openapi_url="/openapi.json" if _env != "production" else None,
)

app.state.limiter = limiter
# Handler oficial de slowapi: devuelve Response (no dict) → 429 correcto.
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add slowapi middleware
app.add_middleware(SlowAPIMiddleware)

# CORS: en production solo FRONTEND_URL (+ ALLOWED_ORIGINS exactos). Sin regex abierta.


def build_cors_config(
    env: str,
    frontend_url: str = "",
    extra_origins: str = "",
) -> tuple[list[str], str | None]:
    """Construye allow_origins y allow_origin_regex según entorno.

    Production: solo orígenes exactos (FRONTEND_URL + ALLOWED_ORIGINS).
    Development: localhost + FRONTEND_URL + regex de Codespaces.
    """
    fe = (frontend_url or "").strip().rstrip("/")
    extras = [o.strip().rstrip("/") for o in (extra_origins or "").split(",") if o.strip()]

    if env == "production":
        origins: list[str] = []
        if fe:
            origins.append(fe)
        origins.extend(extras)
        return origins, None

    origins = ["http://localhost:3000", "http://localhost:3001"]
    if fe:
        origins.append(fe)
    origins.extend(extras)
    return origins, r"https://(.*\.app\.github\.dev|.*\.github\.dev)"


_frontend_url = (os.getenv("FRONTEND_URL") or "").strip()
_extra = os.environ.get("ALLOWED_ORIGINS", "")
allow_origins, _allow_origin_regex = build_cors_config(_env, _frontend_url, _extra)
if _env == "production" and not allow_origins:
    logger.warning(
        "ENV=production sin FRONTEND_URL/ALLOWED_ORIGINS: CORS sin orígenes permitidos"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
@limiter.limit("10/minute")
def health(request: Request):
    return {"status": "ok", "service": "astroengine-backend"}


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    _capture_exc(exc)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


@app.post("/api/chart", response_model=ChartResponse)
@limiter.limit("20/minute")
async def get_chart(request: Request, body: BirthData):
    """
    Calcula la carta natal completa.
    - 12 planetas (Sol → Quirón)
    - 12 casas (Placidus, fallback Whole Sign para latitudes extremas)
    - Ascendente y MC
    - Todos los aspectos mayores y menores entre planetas
    """
    t0 = time.perf_counter()
    # Metadatos sin PII completa: solo año de nacimiento (no fecha/hora/coords).
    birth_year = (body.birth_date or "")[:4]
    try:
        result = calculate_natal_chart(body.model_dump())
        duration_ms = int((time.perf_counter() - t0) * 1000)
        _track("chart.compute.success", duration_ms=duration_ms, birth_year=birth_year)
        return result
    except Exception as exc:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.error("Chart calculation error: %s", exc)
        _track("chart.compute.error", duration_ms=duration_ms, birth_year=birth_year)
        _capture_exc(exc)
        raise HTTPException(status_code=500, detail="Error en cálculo de carta")


@app.post("/api/transits", response_model=TransitResponse)
@limiter.limit("5/minute")
async def get_transits(request: Request, body: TransitRequest):
    """
    Calcula tránsitos futuros de planetas lentos (Júpiter → Marte)
    contra los planetas natales provistos.
    Incluye fechas exactas de aspecto, duración en orbe, y timeline mensual.
    """
    t0 = time.perf_counter()
    try:
        result = calculate_transit_timeline(
            natal_planets=[p.model_dump() for p in body.natal_planets],
            start_date_str=body.start_date,
            end_date_str=body.end_date,
            lat=body.latitude,
            lon=body.longitude,
        )
        duration_ms = int((time.perf_counter() - t0) * 1000)
        _track(
            "transits.compute.duration_ms",
            duration_ms=duration_ms,
            planet_count=len(body.natal_planets),
        )
        return result
    except Exception as exc:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.error("Transit calculation error: %s", exc)
        _track("transits.compute.error", duration_ms=duration_ms)
        _capture_exc(exc)
        raise HTTPException(status_code=500, detail="Error en cálculo de tránsitos")


@app.post("/api/solar-return", response_model=ChartResponse)
@limiter.limit("10/minute")
async def get_solar_return(request: Request, body: SolarReturnRequest):
    """
    Calcula la carta de retorno solar para el año dado.
    Encuentra el momento exacto en que el Sol regresa a su posición natal.
    """
    t0 = time.perf_counter()
    try:
        result = calculate_solar_return(
            natal_sun_lon=body.natal_sun_longitude,
            year=body.year,
            lat=body.latitude,
            lon=body.longitude,
            tz_offset=body.timezone_offset,
            name=body.name,
        )
        duration_ms = int((time.perf_counter() - t0) * 1000)
        _track("solar_return.compute.success", duration_ms=duration_ms, year=body.year)
        return result
    except Exception as exc:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.error("Solar return calculation error: %s", exc)
        _track("solar_return.compute.error", duration_ms=duration_ms, year=body.year)
        _capture_exc(exc)
        raise HTTPException(status_code=500, detail="Error en retorno solar")


@app.get("/api/mundane/countries", response_model=list[CountryInfo])
@limiter.limit("10/minute")
def get_mundane_countries(request: Request):
    """
    Lista los países disponibles para el modo "impacto por país" (cartas
    nacionales, tradición de Campion) — fuente única de verdad para el
    frontend, que la usa para poblar los chips de selección de país.
    """
    return [
        {"id": c["id"], "name_es": c["name_es"], "name_en": c["name_en"]}
        for c in NATIONAL_CHARTS.values()
    ]


@app.post("/api/mundane", response_model=MundaneResponse)
@limiter.limit("5/minute")
async def get_mundane(request: Request, body: MundaneRequest):
    """
    Análisis de astrología mundial (geopolítica): configuraciones de cuerpos
    lentos (aspectos e ingresos de signo) en el rango dado, análogos históricos
    por firma astrológica, síntesis temática e impactos sobre una carta natal
    si se proveen natal_planets, o sobre una carta nacional si se provee
    country (mutuamente excluyentes). Interpretación analógica cíclica, no
    predicción de hechos futuros.
    """
    t0 = time.perf_counter()
    mode = "country" if body.country else ("natal" if body.natal_planets else "world")
    try:
        natal_planets = [p.model_dump() for p in body.natal_planets]
        national_planets = None
        national_chart_note = None
        if body.country:
            chart = NATIONAL_CHARTS[body.country]
            national_planets = compute_national_planets(body.country)
            national_chart_note = {"es": chart["chart_note_es"], "en": chart["chart_note_en"]}

        result = build_mundane_forecast(
            start_date_str=body.start_date,
            end_date_str=body.end_date,
            natal_planets=natal_planets or None,
            national_planets=national_planets,
        )
        if national_planets is not None:
            result["national_planets"] = national_planets
            result["national_chart_note"] = national_chart_note
        duration_ms = int((time.perf_counter() - t0) * 1000)
        _track("mundane.compute.success", duration_ms=duration_ms, mode=mode)
        return result
    except Exception as exc:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.error("Mundane calculation error: %s", exc)
        _track("mundane.compute.error", duration_ms=duration_ms, mode=mode)
        _capture_exc(exc)
        raise HTTPException(status_code=500, detail="Error en análisis mundial")


@app.get("/api/calendar", response_model=CalendarResponse)
@limiter.limit("10/minute")
def get_calendar(request: Request, year: int, month: int):
    """
    Calendario astrológico diario: mes solicitado + los 2 meses siguientes.
    Resumen día a día (Luna, Sol, eventos) con astronomía computada en vivo.
    """
    if not (2020 <= year <= 2035):
        raise HTTPException(status_code=422, detail="Año fuera del rango soportado (2020-2035)")
    if not (1 <= month <= 12):
        raise HTTPException(status_code=422, detail="Mes inválido (1-12)")
    t0 = time.perf_counter()
    try:
        months = compute_daily_calendar(year, month, months=3)
        duration_ms = int((time.perf_counter() - t0) * 1000)
        _track("calendar.compute.duration_ms", duration_ms=duration_ms, year=year, month=month)
        return {"months": months}
    except Exception as exc:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.error("Calendar calculation error: %s", exc)
        _track("calendar.compute.error", duration_ms=duration_ms, year=year, month=month)
        _capture_exc(exc)
        raise HTTPException(status_code=500, detail="Error en calendario astrológico")
