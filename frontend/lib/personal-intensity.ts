/**
 * TIER1 aspects + personal intensity series (pure helpers).
 * Monthly intensity from transit timeline scores / events.
 */

import type { Aspect, IntensityPoint, TransitResponse } from "./types";

const MAJOR = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);

const MONTH_LABEL_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];
const MONTH_LABEL_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Aspectos TIER1: orbe estricto (default < 1°), solo mayores, ordenados por exactitud.
 */
export function getTier1Aspects(aspects: Aspect[], maxOrb = 1.0): Aspect[] {
  if (!aspects?.length) return [];
  return aspects
    .filter((a) => MAJOR.has(a.aspect_name) && typeof a.orb === "number" && a.orb < maxOrb)
    .sort((a, b) => a.orb - b.orb);
}

function monthKey(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

function monthLabel(year: number, monthIndex0: number, lang: "es" | "en" = "es"): string {
  const names = lang === "en" ? MONTH_LABEL_EN : MONTH_LABEL_ES;
  return `${names[monthIndex0]} ${year}`;
}

/**
 * Serie 12 meses de intensidad personal.
 * - Sin tránsitos → [] (empty state honesto)
 * - Si timeline[].intensity_score existe → usarlo (clamp 0–10)
 * - Si no → agregar scores de eventos del mes y normalizar a 0–10
 */
export function buildPersonalIntensitySeries(
  transits: TransitResponse | null,
  year: number,
  lang: "es" | "en" = "es"
): IntensityPoint[] {
  if (!transits?.timeline?.length) return [];

  const byMonth = new Map<string, { scoreSum: number; intensity?: number; eventCount: number }>();

  for (let m = 0; m < 12; m++) {
    byMonth.set(monthKey(year, m), { scoreSum: 0, eventCount: 0 });
  }

  let hasAnyData = false;

  for (const row of transits.timeline) {
    if (!row?.month || !row.month.startsWith(String(year))) continue;
    const bucket = byMonth.get(row.month);
    if (!bucket) continue;
    hasAnyData = true;

    if (typeof row.intensity_score === "number" && Number.isFinite(row.intensity_score)) {
      bucket.intensity = clamp(row.intensity_score, 0, 10);
    }

    const events = row.transits_active ?? [];
    for (const ev of events) {
      const s = typeof ev.score === "number" && Number.isFinite(ev.score) ? ev.score : 1;
      bucket.scoreSum += Math.max(0, s);
      bucket.eventCount += 1;
    }
  }

  // También incorporar current_transits si aportan fechas en el año
  if (transits.current_transits?.length) {
    for (const ev of transits.current_transits) {
      const dateStr = ev.exact_date?.slice(0, 7) || ev.enters_orb?.slice(0, 7);
      if (!dateStr || !dateStr.startsWith(String(year))) continue;
      const bucket = byMonth.get(dateStr);
      if (!bucket) continue;
      hasAnyData = true;
      const s = typeof ev.score === "number" && Number.isFinite(ev.score) ? ev.score : 1;
      bucket.scoreSum += Math.max(0, s);
      bucket.eventCount += 1;
    }
  }

  if (!hasAnyData) return [];

  // Normalizar scores agregados cuando no hay intensity_score
  const rawFromEvents: number[] = [];
  for (let m = 0; m < 12; m++) {
    const key = monthKey(year, m);
    const b = byMonth.get(key)!;
    if (b.intensity === undefined) rawFromEvents.push(b.scoreSum);
  }
  const maxRaw = Math.max(0, ...rawFromEvents, 0);

  const points: IntensityPoint[] = [];
  for (let m = 0; m < 12; m++) {
    const key = monthKey(year, m);
    const b = byMonth.get(key)!;
    let value: number;
    if (b.intensity !== undefined) {
      value = b.intensity;
    } else if (maxRaw > 0) {
      value = clamp((b.scoreSum / maxRaw) * 10, 0, 10);
    } else {
      value = 0;
    }
    // Redondeo legible sin perder escala
    value = Math.round(value * 10) / 10;
    points.push({
      month: key,
      value,
      label: monthLabel(year, m, lang),
    });
  }

  // Si toda la serie es 0 y no hubo intensity_score real, no inventar gráfico vacío de ceros
  const anyPositive = points.some((p) => p.value > 0);
  const anyTimelineScore = transits.timeline.some(
    (r) => r.month?.startsWith(String(year)) && typeof r.intensity_score === "number"
  );
  if (!anyPositive && !anyTimelineScore) return [];

  return points;
}
