from pydantic import BaseModel, Field
from typing import Optional


# ── Input Models ──────────────────────────────────────────────────────────────

class BirthData(BaseModel):
    name: str
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="YYYY-MM-DD")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM (hora local)")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timezone_offset: float = Field(..., ge=-14, le=14, description="UTC offset en horas, ej: -4 para Chile")


class TransitRequest(BaseModel):
    natal_planets: list[dict]
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    latitude: float
    longitude: float


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


class MonthlyForecast(BaseModel):
    month: str
    transits_active: list[TransitEvent]
    intensity_score: float
    dominant_theme: str
    theme_summary: str = ""
    life_areas_affected: list[str] = []


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


# ── Mundane Models ─────────────────────────────────────────────────────────────

class SolarReturnRequest(BaseModel):
    natal_sun_longitude: float
    year: int
    latitude: float
    longitude: float
    timezone_offset: float
    name: str = ""


class MundaneRequest(BaseModel):
    country: str = Field(..., description="País: usa | chile | uk | eu | germany | france | china | russia")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")


class IngressEvent(BaseModel):
    date: str
    planet: str
    sign: str
    retrograde: bool


class NationalChartData(BaseModel):
    country_key: str
    country_name: str
    founding_date: str
    founding_time: str
    location: str
    source: str
    planets: list[PlanetPosition]
    ascendant: Optional[AnglePoint] = None
    midheaven: Optional[AnglePoint] = None
    houses: Optional[list[HouseCusp]] = None
    aspects: Optional[list[Aspect]] = None


class MundaneResponse(BaseModel):
    country_key: str
    country_name: str
    national_chart: NationalChartData
    current_sky: list[PlanetPosition]
    current_transits: list[TransitEvent]
    timeline: list[MonthlyForecast]
    ingresses: list[IngressEvent]
