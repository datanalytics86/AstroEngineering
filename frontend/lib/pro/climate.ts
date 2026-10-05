/** Clima relativo (H-21). z-score robusto (mediana/MAD). Sin umbral 6.5. */

export type Climate = "apretado" | "abierto" | "suave" | "parejo";

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function robustZ(values: number[]): number[] {
  if (!values.length) return [];
  const med = median(values);
  const mad = median(values.map((v) => Math.abs(v - med)));
  const scale = mad < 1e-9 ? 1 : 1.4826 * mad;
  return values.map((v) => (v - med) / scale);
}

export function scaleRelative(values: number[], minOut = 2, maxOut = 9): number[] {
  if (!values.length) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (hi - lo < 1e-9) return values.map(() => (minOut + maxOut) / 2);
  return values.map((v) => minOut + ((v - lo) / (hi - lo)) * (maxOut - minOut));
}

export function isFlatSeries(values: number[]): boolean {
  if (values.length < 2) return true;
  const z = robustZ(values);
  const span = Math.max(...values) - Math.min(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const relSpan = mean === 0 ? span : span / Math.abs(mean);
  return relSpan < 0.08 && z.every((v) => Math.abs(v) < 0.35);
}

export interface ClimateResult {
  climate: Climate[];
  relative: number[];
  z: number[];
  flat: boolean;
}

/**
 * apretado = top 3, o z ≥ +1 con mayoría tensa.
 * suave = bottom 3, o z ≤ −1.
 * abierto = el resto.
 * serie plana → parejo.
 */
export function classifyClimate(raw: number[], tenseRatio: number[] = []): ClimateResult {
  const n = raw.length;
  const relative = scaleRelative(raw);
  const z = robustZ(raw);
  if (n === 0) return { climate: [], relative, z, flat: true };
  if (isFlatSeries(raw)) {
    return { climate: raw.map(() => "parejo"), relative, z, flat: true };
  }
  const order = raw.map((_, i) => i).sort((a, b) => raw[b] - raw[a]);
  const top = new Set(order.slice(0, Math.min(3, n)));
  const bottom = new Set(order.slice(-Math.min(3, n)));
  const climate: Climate[] = raw.map((_, i) => {
    const tense = (tenseRatio[i] ?? 0) >= 0.5;
    if (top.has(i) || (z[i] >= 1 && tense)) return "apretado";
    if (bottom.has(i) || z[i] <= -1) return "suave";
    return "abierto";
  });
  return { climate, relative, z, flat: false };
}

export function climateCounts(climate: Climate[]): Record<Climate, number> {
  const c: Record<Climate, number> = { apretado: 0, abierto: 0, suave: 0, parejo: 0 };
  for (const x of climate) c[x] += 1;
  return c;
}
