export const SIGNS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
] as const;

export const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Tauro: "♉", "Géminis": "♊", "Cáncer": "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Escorpio: "♏",
  Sagitario: "♐", Capricornio: "♑", Acuario: "♒", Piscis: "♓",
};

export type Element = "fuego" | "tierra" | "aire" | "agua";

export const SIGN_ELEMENT: Record<string, Element> = {
  Aries: "fuego",    Leo: "fuego",        Sagitario: "fuego",
  Tauro: "tierra",   Virgo: "tierra",     Capricornio: "tierra",
  "Géminis": "aire", Libra: "aire",       Acuario: "aire",
  "Cáncer": "agua",  Escorpio: "agua",    Piscis: "agua",
};

// Colores ajustados para fondo claro
export const ELEMENT_COLORS: Record<Element, string> = {
  fuego: "#EF4444",
  tierra: "#10B981",
  aire:   "#D97706",   // amber-600, más visible sobre blanco
  agua:   "#3B82F6",
};

export function signColor(sign: string): string {
  const element = SIGN_ELEMENT[sign];
  return element ? ELEMENT_COLORS[element] : "#64748B";
}

/** Convierte grados decimales a formato °'\" */
export function toDMS(degrees: number): string {
  const total = Math.round(degrees * 3600);
  const d = Math.floor(total / 3600);
  const rem = total % 3600;
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  return `${d.toString().padStart(2, "0")}°${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}"`;
}

/** Longitud eclíptica (0-360) al nombre del signo */
export function longitudeToSign(lon: number): string {
  const idx = Math.floor(((lon % 360) + 360) % 360 / 30);
  return SIGNS[idx];
}

/** Grados dentro del signo a partir de longitud eclíptica */
export function degreeInSign(lon: number): number {
  return ((lon % 360) + 360) % 360 % 30;
}

/** Formatea una longitud eclíptica como "24°14'02\" Tauro" */
export function formatLongitude(lon: number): string {
  const sign = longitudeToSign(lon);
  const deg = degreeInSign(lon);
  return `${toDMS(deg)} ${sign}`;
}

export type Dignity = "domicilio" | "exaltación" | "detrimento" | "caída" | null;

// Classical dignities: domicile, exaltation, detriment, fall
const DIGNITIES: Record<string, { domicilio: string[]; exaltación: string[]; detrimento: string[]; caída: string[] }> = {
  Sol:      { domicilio: ["Leo"],          exaltación: ["Aries"],       detrimento: ["Acuario"],     caída: ["Libra"] },
  Luna:     { domicilio: ["Cáncer"],       exaltación: ["Tauro"],       detrimento: ["Capricornio"], caída: ["Escorpio"] },
  Mercurio: { domicilio: ["Géminis","Virgo"], exaltación: ["Virgo"],    detrimento: ["Sagitario","Piscis"], caída: ["Piscis"] },
  Venus:    { domicilio: ["Tauro","Libra"], exaltación: ["Piscis"],     detrimento: ["Aries","Escorpio"],   caída: ["Virgo"] },
  Marte:    { domicilio: ["Aries","Escorpio"], exaltación: ["Capricornio"], detrimento: ["Libra","Tauro"], caída: ["Cáncer"] },
  Júpiter:  { domicilio: ["Sagitario","Piscis"], exaltación: ["Cáncer"], detrimento: ["Géminis","Virgo"], caída: ["Capricornio"] },
  Saturno:  { domicilio: ["Capricornio","Acuario"], exaltación: ["Libra"], detrimento: ["Cáncer","Leo"], caída: ["Aries"] },
  Urano:    { domicilio: ["Acuario"],      exaltación: ["Escorpio"],    detrimento: ["Leo"],         caída: ["Tauro"] },
  Neptuno:  { domicilio: ["Piscis"],       exaltación: ["Cáncer"],      detrimento: ["Virgo"],       caída: ["Capricornio"] },
  Plutón:   { domicilio: ["Escorpio"],     exaltación: ["Aries"],       detrimento: ["Tauro"],       caída: ["Libra"] },
};

export const DIGNITY_SYMBOL: Record<string, string> = {
  domicilio:  "⌂",
  exaltación: "↑",
  detrimento: "⊗",
  caída:      "↓",
};

export const DIGNITY_COLOR: Record<string, string> = {
  domicilio:  "#10B981",  // emerald
  exaltación: "#3B82F6",  // blue
  detrimento: "#F97316",  // orange
  caída:      "#EF4444",  // red
};

export function getPlanetDignity(planet: string, sign: string): Dignity {
  const d = DIGNITIES[planet];
  if (!d) return null;
  if (d.domicilio.includes(sign)) return "domicilio";
  if (d.exaltación.includes(sign)) return "exaltación";
  if (d.detrimento.includes(sign)) return "detrimento";
  if (d.caída.includes(sign)) return "caída";
  return null;
}

export const ASPECT_COLORS: Record<string, string> = {
  armonioso: "#10B981",   // emerald-500
  tenso:     "#EF4444",   // red-500
  neutro:    "#6366F1",   // indigo-500
  menor:     "#A78BFA",   // violet-400
};

export const IMPORTANCE_COLORS: Record<string, string> = {
  "crítica": "#EF4444",
  alta:      "#F97316",
  media:     "#F59E0B",
  baja:      "#10B981",
};
