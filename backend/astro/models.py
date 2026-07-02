from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import date


# ── Input Models ──────────────────────────────────────────────────────────────

class BirthData(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM (hora local)")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timezone_offset: float = Field(..., ge=-14, le=14, description="UTC offset en horas, ej: -4 para Chile")

    @field_validator("birth_date")
    @classmethod
    def validate_birth_date(cls, v: str) -> str:
        try:
            d = date.fromisoformat(v)
            if not (1800 <= d.year <= 2200):
                raise ValueError("Año fuera del rango soportado (1800-2200)")
        except ValueError as e:
            raise ValueError(f"Fecha inválida: {e}")
        return v


class TransitRequest(BaseModel):
    natal_planets: list[dict]
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

    @model_validator(mode="after")
    def validate_date_range(self) -> "TransitRequest":
        try:
            start = date.fromisoformat(self.start_date)
            end   = date.fromisoformat(self.end_date)
        except ValueError as e:
            raise ValueError(f"Formato de fecha inválido: {e}")
        if end <= start:
            raise ValueError("end_date debe ser posterior a start_date")
        if (end - start).days > 366:
            raise ValueError("Rango máximo de tránsitos: 366 días (12 meses)")
        return self


class MundaneRequest(BaseModel):
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    natal_planets: list[dict] = []

    @model_validator(mode="after")
    def validate_date_range(self) -> "MundaneRequest":
        try:
            start = date.fromisoformat(self.start_date)
            end   = date.fromisoformat(self.end_date)
        except ValueError as e:
            raise ValueError(f"Formato de fecha inválido: {e}")
        if end <= start:
            raise ValueError("end_date debe ser posterior a start_date")
        if (end - start).days > 1100:
            raise ValueError("Rango máximo de análisis mundial: ~3 años (1100 días)")
        return self


# ── Output Models ─────────────────────────────────────────────────────────────

class PlanetPosition(BaseModel):
    name: str
    symbol: str
    longitude: float
    sign: str
    sign_symbol: str
    degree_in_sign: float
    degree_display: str
    house: int
    retrograde: bool
    speed: float


class HouseCusp(BaseModel):
    number: int
    cusp_longitude: float
    sign: str
    degree_display: str


class AnglePoint(BaseModel):
    longitude: float
    sign: str
    degree_display: str


class Aspect(BaseModel):
    planet1: str
    planet2: str
    aspect_name: str
    aspect_symbol: str
    exact_angle: float
    actual_angle: float
    orb: float
    applying: bool
    nature: str


class ChartResponse(BaseModel):
    name: str
    birth_date: str
    birth_time: str
    latitude: float
    longitude: float
    timezone_offset: float
    planets: list[PlanetPosition]
    houses: list[HouseCusp]
    ascendant: AnglePoint
    midheaven: AnglePoint
    aspects: list[Aspect]


class TransitEvent(BaseModel):
    transit_planet: str
    transit_longitude: float
    transit_sign: str
    transit_retrograde: bool = False
    natal_planet: str
    natal_longitude: float
    aspect_name: str
    orb: float
    applying: bool
    exact_date: Optional[str] = None
    enters_orb: str
    leaves_orb: str
    nature: str
    importance: str
    score: float


class SkyPlanet(BaseModel):
    name: str
    symbol: str
    longitude: float
    sign: str
    sign_symbol: str
    degree_in_sign: float
    degree_display: str
    retrograde: bool
    speed: float


class MonthlyForecast(BaseModel):
    month: str
    transits_active: list[TransitEvent]
    intensity_score: float
    dominant_theme: str
    theme_summary: str = ""
    life_areas_affected: list[str] = []
    sky: list[SkyPlanet] = []


class ExactAspectEvent(BaseModel):
    date: str
    transit_planet: str
    aspect: str
    natal_planet: str
    interpretation_key: str


class TransitResponse(BaseModel):
    current_transits: list[TransitEvent]
    timeline: list[MonthlyForecast]
    exact_aspects_calendar: list[ExactAspectEvent]


# ── Solar Return ───────────────────────────────────────────────────────────────

class SolarReturnRequest(BaseModel):
    natal_sun_longitude: float = Field(..., ge=0, lt=360)
    year: int = Field(..., ge=1900, le=2100)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timezone_offset: float = Field(..., ge=-14, le=14)
    name: str = Field(default="", max_length=100)


# ── Mundane (astrología mundial / geopolítica) ─────────────────────────────────

class MundaneSkyBody(BaseModel):
    name: str
    symbol: str
    longitude: float
    sign: str
    sign_symbol: str
    degree_in_sign: float
    degree_display: str
    retrograde: bool
    speed: float


class MundaneAnalog(BaseModel):
    id: str
    date: str
    region: str
    tags: list[str]
    sky: list[MundaneSkyBody]
    match_type: str = "exact"  # "exact" | "phase" (misma pareja, otra fase del ciclo)
    event_aspect: Optional[str] = None  # aspecto real del evento histórico (firmas de aspecto)


class NatalImpact(BaseModel):
    config_id: str
    natal_planet: str
    body: str
    aspect: str
    orb: float
    importance: str


class MundaneConfiguration(BaseModel):
    id: str
    exact_date: str
    kind: str  # "aspect" | "ingress"
    bodies: list[str]
    aspect: Optional[str] = None
    sign: Optional[str] = None
    longitudes: dict[str, float]
    signature: dict
    sky: list[MundaneSkyBody]
    analogs: list[MundaneAnalog] = []
    themes: list[str] = []  # temas agregados de los análogos de ESTA configuración


class CyclicIndexPoint(BaseModel):
    month: str   # "YYYY-MM"
    value: float  # suma de separaciones angulares (0-180°) de los 10 pares lentos


class MundaneResponse(BaseModel):
    start_date: str
    end_date: str
    configurations: list[MundaneConfiguration]
    probable_themes: list[str]
    natal_impacts: list[NatalImpact] = []
    cyclic_index: list[CyclicIndexPoint] = []
