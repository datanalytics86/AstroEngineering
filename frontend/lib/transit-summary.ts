/**
 * Generador de resumen ejecutivo de tránsitos — próximos 12 meses.
 *
 * Bibliografía:
 *   - Steven Forrest "The Changing Sky": ciclos de planetas lentos, fases aplicante/separante
 *   - Sue Tompkins "Aspects in Astrology": naturaleza de cada aspecto entre planetas
 *   - Howard Sasportas "The Gods of Change": Saturno, Urano, Neptuno, Plutón como agentes de cambio
 *   - Stephen Arroyo "Astrology, Karma & Transformation": integración de tensiones y crecimiento
 */

import type {
  TransitResponse,
  ChartResponse,
  TransitExecutiveSummary,
  MajorCycle,
  QuarterNarrative,
  MonthlyForecast,
  TransitEvent,
} from "./types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Peso de planetas transitantes (Sasportas: los lentos son los agentes de cambio real) ──
const PLANET_WEIGHT: Record<string, number> = {
  Plutón: 10, Neptuno: 9, Urano: 8, Saturno: 7, Júpiter: 5,
  Sol: 3, Marte: 2, Venus: 2, Mercurio: 1, Luna: 1,
};

// ── Arquetipo de planeta transitante (Sasportas "The Gods of Change") ──────────
const PLANET_ARCHETYPE: Record<string, string> = {
  Plutón:    "transformación profunda, poder y regeneración (Sasportas)",
  Neptuno:   "disolución, espiritualidad y creatividad expandida (Sasportas)",
  Urano:     "liberación, ruptura de patrones y renovación súbita (Sasportas)",
  Saturno:   "estructura, disciplina y consolidación por responsabilidad (Sasportas)",
  Júpiter:   "expansión, oportunidad y búsqueda de significado (Forrest)",
  Marte:     "acción, energía y voluntad enfocada (Arroyo)",
  Venus:     "relaciones, valores y placer (Tompkins)",
  Mercurio:  "comunicación, pensamiento y adaptabilidad (Forrest)",
};

// ── Naturaleza del aspecto (Tompkins "Aspects in Astrology") ────────────────
const ASPECT_NATURE: Record<string, string> = {
  Conjunción:    "fusión e intensificación — energía en su máxima expresión",
  Oposición:     "polaridad consciente — integrar lo que se proyecta hacia afuera",
  Cuadratura:    "tensión creativa — fricción que impulsa el crecimiento (Tompkins)",
  Trígono:       "fluidez y facilidad — talento que fluye sin esfuerzo",
  Sextil:        "oportunidad latente — requiere iniciativa para activarse",
  Quincuncio:    "ajuste y recalibración — temáticas que exigen revisión constante",
};

// ── Dominio de planeta natal (Tompkins: el natal muestra qué área de vida se activa) ──
const NATAL_DOMAIN: Record<string, string> = {
  Sol:          "tu identidad, propósito y vitalidad",
  Luna:         "tu mundo emocional, hogar y rutinas",
  Mercurio:     "tu mente, comunicación y aprendizaje",
  Venus:        "tus relaciones, valores y placer",
  Marte:        "tu voluntad, coraje y capacidad de acción",
  Júpiter:      "tu búsqueda de sentido, expansión y fe",
  Saturno:      "tu estructura, límites y madurez",
  Urano:        "tu necesidad de libertad e innovación",
  Neptuno:      "tu espiritualidad, intuición y creatividad",
  Plutón:       "tus transformaciones profundas y poder personal",
  "Nodo Norte": "tu dirección evolutiva y propósito kármico",
  Quirón:       "tu herida esencial y capacidad de sanación",
  ASC:          "tu identidad externa y primera impresión",
  MC:           "tu vocación, reputación y lugar en el mundo",
};

// ── Ciclos planetarios mayores (Forrest: nombre el arco evolutivo) ────────────
const CYCLE_HEADLINE: Record<string, string> = {
  "Saturno_Conjunción_Saturno":   "Retorno de Saturno — umbral de madurez y responsabilidad adulta",
  "Saturno_Oposición_Saturno":    "Oposición de Saturno — revisión profunda de compromisos y estructuras",
  "Saturno_Cuadratura_Saturno":   "Cuadratura de Saturno — crisis de estructura que forja el carácter",
  "Urano_Oposición_Urano":        "Oposición de Urano (~42 años) — impulso irresistible de autenticidad y libertad",
  "Neptuno_Cuadratura_Neptuno":   "Cuadratura de Neptuno (~41 años) — disolución de ilusiones, búsqueda de trascendencia",
  "Plutón_Cuadratura_Plutón":     "Cuadratura de Plutón (~38 años) — transformación radical de poder personal",
  "Júpiter_Conjunción_Júpiter":   "Retorno de Júpiter (~12 años) — nuevo ciclo de expansión y oportunidades",
};

// ── Consejo integrador por planeta dominante (Arroyo "Astrology, Karma & Transformation") ──
const INTEGRATING_ADVICE: Record<string, string> = {
  Plutón:
    "Arroyo enseña que Plutón no destruye lo que es auténtico: solo elimina lo que ya no sirve. " +
    "El camino no es resistir, sino transformar conscientemente. Trabaja con honestidad radical sobre " +
    "los patrones de poder, control y apego que este período ilumina.",
  Neptuno:
    "Neptuno disuelve fronteras para que lo espiritual emerja. Arroyo recomienda anclar esta energía " +
    "en práctica contemplativa, arte o servicio, evitando la evasión. La confusión es señal de que " +
    "una vieja forma de identidad se está disolviendo para dar paso a algo más inclusivo.",
  Urano:
    "Urano sacude para liberar. Arroyo plantea que la clave no es controlar el cambio sino " +
    "liderar tu propia renovación antes de que las circunstancias lo fuercen. " +
    "Identifica qué estructuras ya no representan quién eres realmente y suéltalas voluntariamente.",
  Saturno:
    "Saturno recompensa el trabajo honesto y disciplinado. Arroyo enfatiza que los períodos " +
    "saturnianos exigen asumir responsabilidad plena, sin culpar ni delegar. " +
    "El fruto de este ciclo es una versión más sólida y auténtica de ti mismo.",
  Júpiter:
    "Júpiter amplifica lo que ya existe. Forrest advierte: aprovecha la expansión para construir " +
    "sobre bases reales, no para inflar el ego. Es el momento de apostar con visión de largo plazo " +
    "y de abrirte a perspectivas que antes parecían inalcanzables.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthLabel(monthStr: string): string {
  try {
    return format(new Date(`${monthStr}-01`), "MMM yyyy", { locale: es });
  } catch { return monthStr; }
}

function intensityLevel(score: number): "alta" | "media" | "baja" {
  if (score >= 8.0) return "alta";
  if (score >= 5.0) return "media";
  return "baja";
}

function topTransitPlanet(timeline: MonthlyForecast[]): string {
  const scores: Record<string, number> = {};
  for (const month of timeline) {
    for (const t of month.transits_active ?? []) {
      const w = PLANET_WEIGHT[t.transit_planet] ?? 1;
      scores[t.transit_planet] = (scores[t.transit_planet] ?? 0) + w * t.score;
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Saturno";
}

// ── Extrae ciclos mayores de planetas lentos ──────────────────────────────────
function extractMajorCycles(transits: TransitEvent[]): MajorCycle[] {
  const SLOW = new Set(["Plutón", "Neptuno", "Urano", "Saturno", "Júpiter"]);
  const seen = new Set<string>();
  const cycles: MajorCycle[] = [];

  const sorted = [...transits].sort((a, b) => b.score - a.score);

  for (const t of sorted) {
    if (!SLOW.has(t.transit_planet)) continue;
    const key = `${t.transit_planet}_${t.aspect_name}_${t.natal_planet}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const cycleKey = `${t.transit_planet}_${t.aspect_name}_${t.natal_planet}`;
    const headline =
      CYCLE_HEADLINE[cycleKey] ??
      `${t.transit_planet} ${t.aspect_name} ${t.natal_planet} natal`;

    const aspectNature = ASPECT_NATURE[t.aspect_name] ?? t.aspect_name;
    const natalDomain  = NATAL_DOMAIN[t.natal_planet] ?? t.natal_planet;
    const archetype    = PLANET_ARCHETYPE[t.transit_planet] ?? t.transit_planet;

    const description =
      `${t.transit_planet} en ${t.aspect_name} con tu ${t.natal_planet} natal activa ` +
      `${natalDomain}. Naturaleza del aspecto: ${aspectNature}. ` +
      `La energía de ${t.transit_planet} opera como agente de ${archetype}.`;

    cycles.push({
      planet:      t.transit_planet,
      aspect:      t.aspect_name,
      natal_planet: t.natal_planet,
      enters:      t.enters_orb,
      leaves:      t.leaves_orb,
      headline,
      description,
      life_area:   natalDomain,
    });

    if (cycles.length >= 6) break;
  }

  return cycles;
}

// ── Narrativa trimestral ──────────────────────────────────────────────────────
function buildQuarters(timeline: MonthlyForecast[]): QuarterNarrative[] {
  const quarters: QuarterNarrative[] = [];
  const chunkSize = Math.ceil(timeline.length / 4);

  for (let q = 0; q < 4; q++) {
    const chunk = timeline.slice(q * chunkSize, (q + 1) * chunkSize);
    if (!chunk.length) continue;

    const avgIntensity = chunk.reduce((s, m) => s + m.intensity_score, 0) / chunk.length;
    const peakMonth    = chunk.reduce((a, b) => a.intensity_score > b.intensity_score ? a : b);
    const themes       = chunk.map((m) => m.dominant_theme).filter(Boolean);
    const uniqueThemes = Array.from(new Set(themes)).slice(0, 2).join(" y ");

    const topTransit = chunk
      .flatMap((m) => m.transits_active ?? [])
      .sort((a, b) => b.score - a.score)[0];

    const firstMonth = chunk[0].month;
    const lastMonth  = chunk[chunk.length - 1].month;
    const qYear = new Date(`${firstMonth}-01`).getFullYear();

    const monthsLabel =
      `${format(new Date(`${firstMonth}-01`), "MMM", { locale: es })}–` +
      `${format(new Date(`${lastMonth}-01`), "MMM yyyy", { locale: es })}`;

    const intensity = intensityLevel(avgIntensity);

    const narrative =
      `Este trimestre la intensidad es ${intensity === "alta" ? "elevada" : intensity === "media" ? "moderada" : "baja"}, ` +
      (uniqueThemes
        ? `con énfasis temático en ${uniqueThemes}. `
        : "") +
      `El mes de mayor actividad es ${monthLabel(peakMonth.month)} ` +
      `(intensidad ${peakMonth.intensity_score.toFixed(1)}/10). ` +
      (topTransit
        ? `El tránsito dominante es ${topTransit.transit_planet} ${topTransit.aspect_name} ${topTransit.natal_planet} natal — ${ASPECT_NATURE[topTransit.aspect_name] ?? ""}.`
        : "");

    quarters.push({
      quarter:   `Q${q + 1} ${qYear}`,
      months:    monthsLabel,
      intensity,
      narrative,
      key_transit: topTransit
        ? `${topTransit.transit_planet} ${topTransit.aspect_name} ${topTransit.natal_planet}`
        : "—",
    });
  }

  return quarters;
}

// ── Función principal ─────────────────────────────────────────────────────────
export function generateTransitSummary(
  transits: TransitResponse,
  chart: ChartResponse,
): TransitExecutiveSummary {
  const { timeline, current_transits } = transits;
  const name = chart.name;

  // Peak month
  const peakMonthData = [...timeline].sort((a, b) => b.intensity_score - a.intensity_score)[0];
  const peakMonthStr  = peakMonthData?.month ?? "";
  const peakLabel     = peakMonthStr ? monthLabel(peakMonthStr) : "—";

  // Top planet for the year
  const dominantPlanet = topTransitPlanet(timeline);

  // Year theme — derived from highest-weight slow planet in action
  const yearTheme =
    dominantPlanet === "Plutón"  ? "Año de transformación y regeneración profunda" :
    dominantPlanet === "Neptuno" ? "Año de apertura espiritual y disolución de límites" :
    dominantPlanet === "Urano"   ? "Año de liberación, cambios inesperados y renovación" :
    dominantPlanet === "Saturno" ? "Año de consolidación, estructura y responsabilidad" :
    dominantPlanet === "Júpiter" ? "Año de expansión, oportunidades y visión amplia" :
                                   "Año de movimiento y múltiples activaciones";

  // Year description
  const totalTransits    = current_transits.length;
  const highImportance   = current_transits.filter(
    (t) => t.importance === "crítica" || t.importance === "alta",
  ).length;
  const archetype        = PLANET_ARCHETYPE[dominantPlanet] ?? dominantPlanet;

  const yearDescription =
    `${name} atraviesa un período marcado por ${archetype}. ` +
    `Con ${totalTransits} tránsitos activos (${highImportance} de alta importancia), ` +
    `los próximos 12 meses invitan a trabajar conscientemente con los temas que ` +
    `${dominantPlanet} despierta. El pico de actividad se concentra en ${peakLabel}.`;

  // Major cycles
  const majorCycles = extractMajorCycles(current_transits);

  // Quarters
  const quarters = buildQuarters(timeline);

  // Opportunities & challenges (from life areas across months)
  const allAreas = timeline.flatMap((m) => m.life_areas_affected ?? []);
  const areaCounts: Record<string, number> = {};
  for (const a of allAreas) areaCounts[a] = (areaCounts[a] ?? 0) + 1;
  const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);

  const harmonious = current_transits
    .filter((t) => t.nature === "armonioso" && (t.importance === "crítica" || t.importance === "alta"))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const tense = current_transits
    .filter((t) => t.nature === "tenso" && (t.importance === "crítica" || t.importance === "alta"))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const opportunities = harmonious.map((t) => {
    const domain = NATAL_DOMAIN[t.natal_planet] ?? t.natal_planet;
    return `${t.transit_planet} ${t.aspect_name} ${t.natal_planet} natal — facilidad para avanzar en ${domain}`;
  });

  if (sortedAreas[0]) {
    opportunities.push(
      `Área más activa del año: "${sortedAreas[0][0]}" — presente en ${sortedAreas[0][1]} de ${timeline.length} meses`,
    );
  }

  const challenges = tense.map((t) => {
    const domain  = NATAL_DOMAIN[t.natal_planet] ?? t.natal_planet;
    const nature  = ASPECT_NATURE[t.aspect_name] ?? t.aspect_name;
    return `${t.transit_planet} ${t.aspect_name} ${t.natal_planet} natal — ${nature} en el área de ${domain}`;
  });

  if (!challenges.length) {
    challenges.push("No se detectan tránsitos tensos de alta importancia — año de relativa fluidez");
  }

  // Integrating advice
  const advice =
    INTEGRATING_ADVICE[dominantPlanet] ??
    `Este año activa múltiples capas de tu carta natal. Arroyo sugiere abrazar las tensiones ` +
    `como oportunidades de integración: cada fricción apunta a un área de crecimiento genuino.`;

  // Headline
  const headline = `${yearTheme} — ${peakLabel} como mes cumbre`;

  return {
    headline,
    year_theme:        yearTheme,
    year_description:  yearDescription,
    major_cycles:      majorCycles,
    quarters,
    opportunities,
    challenges,
    integrating_advice: advice,
    peak_month:        peakMonthStr,
    peak_month_label:  peakLabel,
  };
}
