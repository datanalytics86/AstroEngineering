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
