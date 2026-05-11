export interface BaZiRequest {
  birth_date: string;
  birth_time: string;
  latitude: number;
  longitude: number;
  timezone_offset: number;
  gender: "male" | "female";
}

export interface StemData {
  chinese: string;
  pinyin: string;
  element: string;
  element_base: string;
  polarity: string;
  index: number;
}

export interface BranchData {
  chinese: string;
  pinyin: string;
  animal: string;
  animal_es: string;
  element_base: string;
  emoji: string;
  index: number;
}

export interface Pillar {
  stem: StemData;
  branch: BranchData;
}

export interface ElementScore {
  score: number;
  percentage: number;
  status: "absent" | "weak" | "moderate" | "balanced" | "strong" | "dominant";
}

export interface TenGodEntry {
  pillar: string;
  stem_chinese: string;
  stem_pinyin: string;
  god_key: string;
  god_cn: string;
  god_name: string;
  god_desc: string;
  weight?: number;
}

export interface LuckCycle {
  cycle_number: number;
  age_start: number;
  age_end: number;
  stem: { chinese: string; pinyin: string; element: string };
  branch: { chinese: string; pinyin: string; animal: string; animal_es: string; emoji: string };
  pillar_display: string;
}

export interface SymbolicStar {
  name: string;
  description: string;
  branch_chinese: string;
  branch_animal: string;
  present_in: string[];
}

export interface AnimalRelationship {
  type: string;
  pillars: string[];
  animals: string[];
  result_element?: string;
}

export interface BaZiResponse {
  solar_time: {
    clock_time: string;
    solar_time: string;
    total_correction_min: number;
    solar_day_shift: number;
  };
  four_pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  day_master: {
    chinese: string;
    pinyin: string;
    element: string;
    title: string;
    description: string;
    strengths: string[];
    vulnerabilities: string[];
  };
  element_balance: Record<string, ElementScore>;
  ten_gods: TenGodEntry[];
  hidden_stems: Record<string, Array<{ chinese: string; pinyin: string; element: string; weight: number }>>;
  animal_relationships: {
    combinations: AnimalRelationship[];
    clashes: AnimalRelationship[];
    punishments: AnimalRelationship[];
    harms: AnimalRelationship[];
  };
  symbolic_stars: SymbolicStar[];
  luck_cycles: LuckCycle[];
  current_year: {
    year: number;
    pillar: string;
    stem: { chinese: string; pinyin: string };
    branch: { chinese: string; pinyin: string; animal: string };
    months: Array<{ month_number: number; pillar_display: string; stem: string; branch: string; animal: string }>;
  };
  organ_health: Record<string, {
    organs: string;
    emotion: string;
    healing_sound: string;
    foods: string[];
    color: string;
    direction: string;
    season: string;
    score: number;
    percentage: number;
    status: string;
  }>;
  recommendations: {
    priority_element: string;
    strengthen_with: string[];
    healing_sound: string;
    favorable_colors: string[];
    favorable_direction: string;
    avoid_element: string;
    summary: string;
  };
}
