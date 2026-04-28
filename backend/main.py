"""
AstroEngine Pro — Backend API
FastAPI + pyswisseph
"""

import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from astro.models import BirthData, TransitRequest, ChartResponse, TransitResponse, MundaneRequest, MundaneResponse, SolarReturnRequest
from astro.chart import calculate_natal_chart, calculate_solar_return
from astro.transits import calculate_transit_timeline
from astro.mundane import calculate_mundane_response

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AstroEngine Pro API",
    description="API de cálculos astrológicos con Swiss Ephemeris",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENV") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENV") != "production" else None,
    openapi_url="/openapi.json" if os.getenv("ENV") != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda r, e: {"detail": "Demasiadas peticiones. Espera un momento."})

# Add slowapi middleware
app.add_middleware(SlowAPIMiddleware)

# CORS configuration
_env = os.getenv("ENV", "development")
_frontend_url = os.getenv("FRONTEND_URL", "")
_extra = os.environ.get("ALLOWED_ORIGINS", "")

_base_origins = ["http://localhost:3000", "http://localhost:3001"]
allow_origins = _base_origins + [_frontend_url] if _frontend_url else _base_origins
if _extra:
    allow_origins.extend([o.strip() for o in _extra.split(",") if o.strip()])

# In production, only use explicit FRONTEND_URL; in dev allow Codespaces
_allow_origin_regex = None if _env == "production" else r"https://(.*\.app\.github\.dev|.*\.github\.dev)"

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
    return {"detail": "Error interno del servidor"}


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
    try:
        result = calculate_natal_chart(body.model_dump())
        return result
    except Exception as exc:
        logger.error("Chart calculation error: %s", exc)
        raise HTTPException(status_code=500, detail="Error en cálculo de carta")


@app.post("/api/transits", response_model=TransitResponse)
@limiter.limit("5/minute")
async def get_transits(request: Request, body: TransitRequest):
    """
    Calcula tránsitos futuros de planetas lentos (Júpiter → Marte)
    contra los planetas natales provistos.
    Incluye fechas exactas de aspecto, duración en orbe, y timeline mensual.
    """
    try:
        result = calculate_transit_timeline(
            natal_planets=body.natal_planets,
            start_date_str=body.start_date,
            end_date_str=body.end_date,
            lat=body.latitude,
            lon=body.longitude,
        )
        return result
    except Exception as exc:
        logger.error("Transit calculation error: %s", exc)
        raise HTTPException(status_code=500, detail="Error en cálculo de tránsitos")


@app.post("/api/solar-return", response_model=ChartResponse)
@limiter.limit("10/minute")
async def get_solar_return(request: Request, body: SolarReturnRequest):
    """
    Calcula la carta de retorno solar para el año dado.
    Encuentra el momento exacto en que el Sol regresa a su posición natal.
    """
    try:
        result = calculate_solar_return(
            natal_sun_lon=body.natal_sun_longitude,
            year=body.year,
            lat=body.latitude,
            lon=body.longitude,
            tz_offset=body.timezone_offset,
            name=body.name,
        )
        return result
    except Exception as exc:
        logger.error("Solar return calculation error: %s", exc)
        raise HTTPException(status_code=500, detail="Error en retorno solar")


@app.post("/api/mundane", response_model=MundaneResponse)
@limiter.limit("3/minute")
async def get_mundane(request: Request, body: MundaneRequest):
    """
    Calcula tránsitos de planetas lentos sobre la carta natal de un país.

    Países disponibles: usa, chile, uk, eu, germany, france, china, russia, argentina, mexico, brazil, india, japan, spain, ukraine, israel

    Devuelve:
      - national_chart: carta natal del país (Campion canonical)
      - current_sky: posiciones actuales de todos los planetas
      - current_transits: tránsitos activos sobre la carta nacional
      - timeline: pronóstico mensual (12 meses)
      - ingresses: ingresos de signo en el período
    """
    try:
        result = calculate_mundane_response(
            country_key=body.country,
            start_date_str=body.start_date,
            end_date_str=body.end_date,
        )
        return result
    except ValueError as exc:
        logger.warning("Invalid mundane request: %s", exc)
        raise HTTPException(status_code=400, detail="Parámetros inválidos")
    except Exception as exc:
        logger.error("Mundane calculation error: %s", exc)
        raise HTTPException(status_code=500, detail="Error en cálculo mundano")
