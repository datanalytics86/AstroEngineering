/**
 * Shared geometry helpers for astrological wheel components.
 * Used by TransitZodiacWheel and MundaneWheel.
 */

export const SIGN_SYMBOLS = [
  "♈", "♉", "♊", "♋", "♌", "♍",
  "♎", "♏", "♐", "♑", "♒", "♓",
] as const;

export const SIGN_NAMES = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
] as const;

/** Element color per sign (fire/earth/air/water). */
export const SIGN_ELEMENT_COLOR: Record<string, string> = {
  Aries:       "#DC2626", Leo:       "#DC2626", Sagitario:   "#DC2626",  // fire
  Tauro:       "#16A34A", Virgo:     "#16A34A", Capricornio: "#16A34A",  // earth
  Géminis:     "#EAB308", Libra:     "#EAB308", Acuario:     "#EAB308",  // air
  Cáncer:      "#2563EB", Escorpio:  "#2563EB", Piscis:      "#2563EB",  // water
};

/** Element background fill (very light) per sign. */
export const SIGN_ELEMENT_BG: Record<string, string> = {
  Aries: "#FEF2F2", Leo: "#FEF2F2", Sagitario: "#FEF2F2",
  Tauro: "#F0FDF4", Virgo: "#F0FDF4", Capricornio: "#F0FDF4",
  Géminis: "#FEFCE8", Libra: "#FEFCE8", Acuario: "#FEFCE8",
  Cáncer: "#EFF6FF", Escorpio: "#EFF6FF", Piscis: "#EFF6FF",
};

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert ecliptic longitude to SVG screen angle (degrees),
 * placing the Ascendant at 180° (9 o'clock / left side).
 * When ascLon = 0 (Aries rising), Aries starts on the left.
 */
export function makeToAngle(ascLon: number): (lon: number) => number {
  return (lon: number) => ((lon - ascLon + 180) % 360 + 360) % 360;
}

/**
 * Compute (x, y) for a point on a circle.
 * angleDeg = 0 means "top" (north); increases clockwise.
 */
export function polarXY(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = toRad(angleDeg - 90);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Build an SVG arc path (open path, not filled).
 * startDeg and endDeg are in the polarXY convention (0 = top, CW).
 */
export function describeArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const span = ((endDeg - startDeg) % 360 + 360) % 360 || 360;
  const start = polarXY(cx, cy, r, startDeg);
  const end = polarXY(cx, cy, r, startDeg + span);
  const large = span > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

/**
 * Build a filled sector (pie slice with inner hole) SVG path.
 */
export function describeSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const span = ((endDeg - startDeg) % 360 + 360) % 360;
  const p1 = polarXY(cx, cy, innerR, startDeg);
  const p2 = polarXY(cx, cy, outerR, startDeg);
  const p3 = polarXY(cx, cy, outerR, startDeg + span);
  const p4 = polarXY(cx, cy, innerR, startDeg + span);
  const large = span > 180 ? 1 : 0;
  return (
    `M ${p1.x} ${p1.y}` +
    ` L ${p2.x} ${p2.y}` +
    ` A ${outerR} ${outerR} 0 ${large} 1 ${p3.x} ${p3.y}` +
    ` L ${p4.x} ${p4.y}` +
    ` A ${innerR} ${innerR} 0 ${large} 0 ${p1.x} ${p1.y}` +
    ` Z`
  );
}
