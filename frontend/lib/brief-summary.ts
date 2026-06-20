/**
 * Generadores de resúmenes breves y deterministas para tránsitos.
 * Sin rambling — brevedad es la clave.
 */

import type { TransitResponse, MonthlyForecast, TransitEvent } from "./types";
import { getInterpretationByComponents } from "./interpretation-engine";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BriefInfluence {
  planet: string;
  aspect: string;
  natal: string;
  nature: string;
  importance: string;
  retrograde: boolean;
  text: string;
  narrative: string;
}

export interface MonthBrief {
  monthKey: string;
  monthLabel: string;
  intensity: number;
  intensityLabel: "estable" | "moderado" | "intenso";
  theme: string;
  headline: string;
  influences: BriefInfluence[];
  lifeAreas: string[];
}

export interface YearCycle {
  planet: string;
  headline: string;
  window: string;
  nature: string;
}

export interface YearBrief {
  year: number;
  theme: string;
  paragraph: string;
  peakMonthLabel: string;
  cycles: YearCycle[];
  opportunities: string[];
  challenges: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOW_PLANETS = ["Plutón", "Neptuno", "Urano", "Saturno", "Júpiter"];

const PLANET_THEME: Record<string, string> = {
  "Plutón":  "transformación profunda",
  "Neptuno": "sensibilidad e inspiración",
  "Urano":   "cambios y libertad",
  "Saturno": "estructura y madurez",
  "Júpiter": "expansión y oportunidades",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.lastIndexOf(" ", maxLen - 3);
  return (cut > maxLen / 2 ? text.slice(0, cut) : text.slice(0, maxLen - 3)) + "…";
}

function firstSentence(text: string): string {
  const dot = text.search(/[.!?]/);
  if (dot === -1) return text;
  return text.slice(0, dot + 1);
}

// ── generateMonthBrief ────────────────────────────────────────────────────────

export function generateMonthBrief(
  month: MonthlyForecast,
  exactCalendar?: { date: string; transit_planet: string; aspect: string; natal_planet: string }[]
): MonthBrief {
  const intensityLabel: MonthBrief["intensityLabel"] =
    month.intensity_score >= 6 ? "intenso" :
    month.intensity_score >= 3 ? "moderado" : "estable";

  const monthLabel = format(new Date(`${month.month}-01`), "MMMM yyyy", { locale: es });
  const monthName = format(new Date(`${month.month}-01`), "MMMM", { locale: es });

  const headline = firstSentence(month.theme_summary);

  // Select top transits: crítica/alta first, then by score, max 4
  const impOrder: Record<string, number> = { "crítica": 4, "alta": 3, "media": 2, "baja": 1 };
  const topTransits = [...month.transits_active]
    .sort((a, b) => {
      return (impOrder[b.importance] ?? 0) - (impOrder[a.importance] ?? 0) || b.score - a.score;
    })
    .slice(0, 4);

  const influences: BriefInfluence[] = topTransits.map((t) => {
    const interp = getInterpretationByComponents(t.transit_planet, t.aspect_name, t.natal_planet);

    // Find exact date from calendar or transit event
    const exactEntry = exactCalendar?.find(
      (e) =>
        e.transit_planet === t.transit_planet &&
        e.aspect === t.aspect_name &&
        e.natal_planet === t.natal_planet &&
        e.date.startsWith(month.month)
    );
    const exactDate = t.exact_date ?? exactEntry?.date ?? null;

    let exactDateStr = "";
    if (exactDate) {
      try {
        const day = new Date(exactDate).getUTCDate();
        exactDateStr = ` (exacta el ${day})`;
      } catch { /* ignore */ }
    }

    const retroNote = t.transit_retrograde ? `, en movimiento retrógrado (℞),` : "";

    let narrative: string;
    if (interp) {
      const aspectLower = t.aspect_name.toLowerCase();
      narrative = `En ${monthName}, ${t.transit_planet}${retroNote} forma una ${aspectLower} con tu ${t.natal_planet} natal${exactDateStr}: ${interp.detailed} Recomendación: ${interp.advice}`;
    } else {
      narrative = `En ${monthName}, ${t.transit_planet}${retroNote} forma una ${t.aspect_name.toLowerCase()} con tu ${t.natal_planet} natal${exactDateStr}.`;
    }

    const rawText = interp?.summary ?? `${t.transit_planet} ${t.aspect_name.toLowerCase()} ${t.natal_planet} natal`;
    return {
      planet:     t.transit_planet,
      aspect:     t.aspect_name,
      natal:      t.natal_planet,
      nature:     t.nature,
      importance: t.importance,
      retrograde: !!t.transit_retrograde,
      text:       rawText,
      narrative,
    };
  });

  const lifeAreas = month.life_areas_affected.slice(0, 4);

  return {
    monthKey:       month.month,
    monthLabel,
    intensity:      month.intensity_score,
    intensityLabel,
    theme:          month.dominant_theme,
    headline,
    influences,
    lifeAreas,
  };
}

// ── generateYearBrief ─────────────────────────────────────────────────────────

export function generateYearBrief(transits: TransitResponse, year: number): YearBrief {
  const { current_transits, timeline } = transits;

  // Dominant slow planet by summed score
  const planetScore: Record<string, number> = {};
  for (const t of current_transits) {
    if (SLOW_PLANETS.includes(t.transit_planet)) {
      planetScore[t.transit_planet] = (planetScore[t.transit_planet] ?? 0) + t.score;
    }
  }
  const dominant =
    SLOW_PLANETS.reduce<string | null>((best, p) => {
      if (best === null) return p;
      return (planetScore[p] ?? 0) > (planetScore[best] ?? 0) ? p : best;
    }, null) ?? "Saturno";

  const theme = PLANET_THEME[dominant] ?? "un año de transición";

  // High-impact count
  const highCount = current_transits.filter(
    (t) => t.importance === "crítica" || t.importance === "alta"
  ).length;

  // Peak month
  const peak = [...timeline].sort((a, b) => b.intensity_score - a.intensity_score)[0];
  const peakMonthLabel = peak
    ? format(new Date(`${peak.month}-01`), "MMMM", { locale: es })
    : "mitad de año";

  // Cycles: slow transits, dedup, top 3 by score
  const seen = new Set<string>();
  const cycles: YearCycle[] = [];
  const slowSorted = [...current_transits]
    .filter((t) => SLOW_PLANETS.includes(t.transit_planet))
    .sort((a, b) => b.score - a.score);

  for (const t of slowSorted) {
    const key = `${t.transit_planet}_${t.aspect_name}_${t.natal_planet}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let windowStr = "";
    try {
      const enter = format(new Date(t.enters_orb), "MMM", { locale: es });
      const leave = format(new Date(t.leaves_orb), "MMM", { locale: es });
      windowStr = `${enter} — ${leave}`;
    } catch {
      windowStr = `${t.enters_orb} — ${t.leaves_orb}`;
    }

    cycles.push({
      planet:   t.transit_planet,
      headline: `${t.transit_planet} ${t.aspect_name} ${t.natal_planet} natal`,
      window:   windowStr,
      nature:   t.nature,
    });

    if (cycles.length >= 3) break;
  }

  // Opportunities (armonioso, top 2)
  const opportunityTransits = [...current_transits]
    .filter((t) => t.nature === "armonioso")
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const opportunities = opportunityTransits.map((t) => {
    const interp = getInterpretationByComponents(t.transit_planet, t.aspect_name, t.natal_planet);
    const raw = interp?.summary ?? `${t.transit_planet} ${t.aspect_name} ${t.natal_planet} natal`;
    return truncate(raw, 100);
  });

  // Challenges (tenso, top 2)
  const challengeTransits = [...current_transits]
    .filter((t) => t.nature === "tenso")
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const challenges = challengeTransits.map((t) => {
    const interp = getInterpretationByComponents(t.transit_planet, t.aspect_name, t.natal_planet);
    const raw = interp?.summary ?? `${t.transit_planet} ${t.aspect_name} ${t.natal_planet} natal`;
    return truncate(raw, 100);
  });

  // Paragraph
  const paragraph =
    `${year} se perfila como un año de ${theme}. ` +
    `Con ${highCount} tránsito${highCount !== 1 ? "s" : ""} de alto impacto, el período más intenso llega alrededor de ${peakMonthLabel}.`;

  return {
    year,
    theme,
    paragraph,
    peakMonthLabel,
    cycles,
    opportunities,
    challenges,
  };
}
