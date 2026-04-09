"""
AstroEngine Pro — Backend API
FastAPI + pyswisseph
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from astro.models import BirthData, TransitRequest, ChartResponse, TransitResponse
from astro.chart import calculate_natal_chart
from astro.transits import calculate_transit_timeline

app = FastAPI(
    title="AstroEngine Pro API",
    description="API de cálculos astrológicos con Swiss Ephemeris",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "astroengine-backend"}


@app.post("/api/chart", response_model=ChartResponse)
def get_chart(body: BirthData):
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
        raise HTTPException(status_code=500, detail=f"Error en cálculo de carta: {str(exc)}")


@app.post("/api/transits", response_model=TransitResponse)
def get_transits(body: TransitRequest):
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
        raise HTTPException(status_code=500, detail=f"Error en cálculo de tránsitos: {str(exc)}")
