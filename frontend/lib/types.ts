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

export interface MonthlyForecast {
  month: string;              // "YYYY-MM"
  transits_active: TransitEvent[];
  intensity_score: number;    // 0-10
  dominant_theme: string;
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
