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

export const ELEMENT_COLORS: Record<Element, string> = {
  fuego: "#DC2626",
  tierra: "#16A34A",
  aire: "#EAB308",
  agua: "#2563EB",
};

export function signColor(sign: string): string {
  const element = SIGN_ELEMENT[sign];
  return element ? ELEMENT_COLORS[element] : "#6B7280";
}

/** Convierte grados decimales a formato °'\" */
export function toDMS(degrees: number): string {
  const d = Math.floor(degrees);
  const mFloat = (degrees - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.floor((mFloat - m) * 60);
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
  armonioso: "#22C55E",
  tenso:     "#EF4444",
  neutro:    "#60A5FA",
  menor:     "#9CA3AF",
};

export const IMPORTANCE_COLORS: Record<string, string> = {
  "crítica": "#DC2626",
  alta:      "#F97316",
  media:     "#EAB308",
  baja:      "#22C55E",
};
