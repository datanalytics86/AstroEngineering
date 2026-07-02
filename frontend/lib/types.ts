// ── Backend Input Types ────────────────────────────────────────────────────────

export interface BirthData {
  name: string;
  birth_date: string;       // "YYYY-MM-DD"
  birth_time: string;       // "HH:MM"
  latitude: number;
  longitude: number;
  timezone_offset: number;  // UTC offset en horas, ej: -4
}

export interface TransitRequest {
  natal_planets: PlanetPosition[];
  start_date: string;       // "YYYY-MM-DD"
  end_date: string;         // "YYYY-MM-DD"
  latitude: number;
  longitude: number;
}

export interface SolarReturnRequest {
  natal_sun_longitude: number;
  year: number;
  latitude: number;
  longitude: number;
  timezone_offset: number;
  name?: string;
}

// ── Chart Response Types ───────────────────────────────────────────────────────

export interface PlanetPosition {
  name: string;
  symbol: string;
  longitude: number;        // 0-360, eclíptica
  sign: string;
  sign_symbol: string;
  degree_in_sign: number;
  degree_display: string;   // "24°14'02\""
  house: number;            // 1-12
  retrograde: boolean;
  speed: number;
}

export interface HouseCusp {
  number: number;           // 1-12
  cusp_longitude: number;
  sign: string;
  degree_display: string;
}

export interface AnglePoint {
  longitude: number;
  sign: string;
  degree_display: string;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  aspect_name: string;
  aspect_symbol: string;
  exact_angle: number;
  actual_angle: number;
  orb: number;
  applying: boolean;
  nature: "armonioso" | "tenso" | "neutro" | "menor";
}

export interface ChartResponse {
  name: string;
  birth_date: string;
  birth_time: string;
  latitude: number;
  longitude: number;
  timezone_offset: number;
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ascendant: AnglePoint;
  midheaven: AnglePoint;
  aspects: Aspect[];
}

// ── Transit Response Types ─────────────────────────────────────────────────────

export type ImportanceLevel = "crítica" | "alta" | "media" | "baja";
export type NatureType = "armonioso" | "tenso" | "neutro" | "menor";
export type InterpNature = "constructivo" | "desafiante" | "transformador" | "expansivo";

export interface TransitEvent {
  transit_planet: string;
  transit_longitude: number;
  transit_sign: string;
  transit_retrograde?: boolean;
  natal_planet: string;
  natal_longitude: number;
  aspect_name: string;
  orb: number;
  applying: boolean;
  exact_date: string | null;  // ISO 8601
  enters_orb: string;         // "YYYY-MM-DD"
  leaves_orb: string;         // "YYYY-MM-DD"
  nature: NatureType;
  importance: ImportanceLevel;
  score: number;
}

export interface SkyPlanet {
  name: string;
  symbol: string;
  longitude: number;          // 0-360, eclíptica
  sign: string;
  sign_symbol: string;
  degree_in_sign: number;
  degree_display: string;
  retrograde: boolean;
  speed: number;              // °/día — negativo = retrógrado
}

export interface MonthlyForecast {
  month: string;              // "YYYY-MM"
  transits_active: TransitEvent[];
  intensity_score: number;    // 0-10
  dominant_theme: string;
  theme_summary: string;
  life_areas_affected: string[];
  sky?: SkyPlanet[];          // posiciones planetarias a mitad de mes (día 15)
}

export interface ChartSummary {
  headline: string;
  core_identity: string;
  emotional_nature: string;
  life_purpose: string;
  key_strengths: string[];
  key_challenges: string[];
  dominant_element: string;
  dominant_modality: string;
  house_emphasis: { house: number; domain: string; planet_count: number };
  stelliums: { sign: string; planets: string[] }[];
  notable_aspects: string[];
  advice: string;
}

export interface ExactAspectEvent {
  date: string;               // "YYYY-MM-DD"
  transit_planet: string;
  aspect: string;
  natal_planet: string;
  interpretation_key: string;
}

export interface TransitResponse {
  current_transits: TransitEvent[];
  timeline: MonthlyForecast[];
  exact_aspects_calendar: ExactAspectEvent[];
}

// ── Interpretation Engine Types ────────────────────────────────────────────────

export interface TransitInterpretation {
  key: string;
  transit_planet: string;
  natal_planet: string;
  aspect: string;
  title: string;
  summary: string;
  detailed: string;
  life_areas: string[];
  nature: InterpNature;
  advice: string;
  duration_note: string;
}

// ── Natal Interpretation Types ─────────────────────────────────────────────────

export interface NatalInterpretation {
  title: string;
  subtitle?: string;
  principal: string;
  strengths: string[];
  challenges: string[];
  growth: string;
  keywords: string[];
  keyphrase: string;
}

// ── Transit Executive Summary Types ───────────────────────────────────────────

export interface MajorCycle {
  planet: string;
  aspect: string;
  natal_planet: string;
  enters: string;
  leaves: string;
  headline: string;
  description: string;
  life_area: string;
}

export interface QuarterNarrative {
  quarter: string;        // "Q1 2026", "Q2 2026" …
  months: string;         // "Ene–Mar 2026"
  intensity: "alta" | "media" | "baja";
  narrative: string;
  key_transit: string;
}

export interface TransitExecutiveSummary {
  headline: string;
  year_theme: string;
  year_description: string;
  major_cycles: MajorCycle[];
  quarters: QuarterNarrative[];
  opportunities: string[];
  challenges: string[];
  integrating_advice: string;
  peak_month: string;
  peak_month_label: string;
}

export type ClickTarget =
  | { type: "planet"; planet: PlanetPosition; aspects: Aspect[] }
  | { type: "aspect"; aspect: Aspect }
  | { type: "house"; house: HouseCusp }
  | { type: "angle"; name: "ASC" | "DSC" | "MC" | "IC"; longitude: number; sign: string; degree_display: string }

// ── Mundane (astrología mundial / geopolítica) ─────────────────────────────────

export interface MundaneSkyBody {
  name: string;
  symbol: string;
  longitude: number;          // 0-360, eclíptica
  sign: string;
  sign_symbol: string;
  degree_in_sign: number;
  degree_display: string;
  retrograde: boolean;
  speed: number;
}

export type MundaneMatchType = "exact" | "phase";

export interface MundaneAnalog {
  id: string;                 // enlaza con el corpus bilingüe (mundane-corpus.ts)
  date: string;               // "YYYY-MM-DD"
  region: string;
  tags: string[];
  sky: MundaneSkyBody[];
  match_type: MundaneMatchType;   // "exact" (mismo aspecto) | "phase" (misma pareja, otra fase del ciclo)
  event_aspect: string | null;    // aspecto real del evento histórico (firmas de aspecto)
}

export interface NatalImpact {
  config_id: string;
  natal_planet: string;
  body: string;
  aspect: string;
  orb: number;
  importance: ImportanceLevel;
}

export interface MundaneConfiguration {
  id: string;
  exact_date: string;         // "YYYY-MM-DD"
  kind: "aspect" | "ingress";
  bodies: string[];
  aspect: string | null;
  sign: string | null;
  longitudes: Record<string, number>;
  signature: Record<string, unknown>;
  sky: MundaneSkyBody[];
  analogs: MundaneAnalog[];
  themes: string[];           // temas agregados de LOS ANÁLOGOS de esta configuración (máx 6)
}

export interface CyclicIndexPoint {
  month: string;              // "YYYY-MM"
  value: number;               // suma de separaciones angulares (0-180°) de los 10 pares lentos
}

export interface MundaneResponse {
  start_date: string;
  end_date: string;
  configurations: MundaneConfiguration[];
  probable_themes: string[];
  natal_impacts: NatalImpact[];
  cyclic_index: CyclicIndexPoint[];
}
