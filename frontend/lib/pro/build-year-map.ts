/** YearMapContent v2 — copy anclado a eventos. Usado por el servidor y tests. */

import type { Climate } from "./climate";
import { classifyClimate } from "./climate";
import type { KeyEvent, MonthlyForecast, TopicId, TransitEvent, TransitResponse } from "@/lib/types";
import { groupTransitsByTopic } from "@/lib/topic-summary";

export type YearMapWindowKind = "rolling12" | "calendar";

export interface YearMapMonthV2 {
  key: string;
  label: string;
  climate: Climate;
  relativeIntensity: number;
  headline: string;
  action: string;
  avoid: string;
  areas: Partial<Record<TopicId, string>>;
}

export interface YearMapKeyDate {
  date: string;
  endDate?: string;
  title: string;
  areas: TopicId[];
  tone: "tenso" | "armonico" | "neutro";
  why?: string;
  technical?: { transit: string; aspect: string; natal: string };
}

export interface YearMapContentV2 {
  window: { start: string; end: string; kind: YearMapWindowKind };
  climateMode: "relative";
  months: YearMapMonthV2[];
  keyDates: YearMapKeyDate[];
  currentMonthKey: string;
}

const MONTH_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTH_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TOPIC_LIFE: Record<TopicId, { es: string; en: string }> = {
  amor: { es: "pareja y vínculos", en: "partnership" },
  dinero: { es: "dinero y recursos", en: "money" },
  trabajo: { es: "trabajo", en: "work" },
  salud: { es: "cuerpo y ritmo", en: "body and pace" },
  familia: { es: "casa y familia", en: "home" },
  crecimiento: { es: "crecimiento", en: "growth" },
};

function monthLabel(key: string, lang: "es" | "en"): string {
  const [y, m] = key.split("-").map(Number);
  const name = lang === "en" ? MONTH_EN[m - 1] : MONTH_ES[m - 1];
  return lang === "en" ? `${name.slice(0, 3)} ${y}` : `${name.slice(0, 3)} ${y}`;
}

function tenseRatioOf(month: MonthlyForecast | undefined): number {
  const ev = month?.transits_active ?? [];
  if (!ev.length) return 0;
  const tense = ev.filter((e) => e.nature === "tenso").length;
  return tense / ev.length;
}

function pickEvents(month: MonthlyForecast | undefined): TransitEvent[] {
  const ev = [...(month?.transits_active ?? [])];
  ev.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const unique: TransitEvent[] = [];
  const seen = new Set<string>();
  for (const e of ev) {
    const k = `${e.transit_planet}|${e.natal_planet}|${e.aspect_name}`;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(e);
    if (unique.length >= 3) break;
  }
  return unique;
}

function dateSpan(e: TransitEvent): { start: string; end?: string } {
  const start = (e.exact_date || e.enters_orb || "").slice(0, 10);
  const end = (e.leaves_orb || "").slice(0, 10);
  if (end && end !== start) return { start, end };
  return { start };
}

function headlineFor(
  climate: Climate,
  events: TransitEvent[],
  lang: "es" | "en",
  used: Set<string>,
): string {
  const areas = events.flatMap((e) =>
    groupTransitsByTopic([], [e], lang).map((g) => g.topicId),
  );
  const area = areas[0];
  const life = area ? TOPIC_LIFE[area][lang] : lang === "en" ? "the pace of the month" : "el ritmo del mes";
  const span = events[0] ? dateSpan(events[0]) : null;
  const when =
    span?.start && span.end
      ? lang === "en"
        ? `From ${span.start.slice(8)}–${span.end.slice(8)}`
        : `Del ${Number(span.start.slice(8))} al ${Number(span.end.slice(8))}`
      : span?.start
        ? lang === "en"
          ? `Around the ${Number(span.start.slice(8))}`
          : `Hacia el ${Number(span.start.slice(8))}`
        : "";

  const pool =
    climate === "parejo"
      ? lang === "en"
        ? [`A steady year-month. Nothing spikes; keep the same pace in ${life}.`]
        : [`Mes parejo. Nada se dispara; mantén el mismo ritmo en ${life}.`]
      : climate === "apretado"
        ? lang === "en"
          ? [
              `${when}: denser conversations in ${life}. Leave slack in the calendar.`,
              `Pressure gathers in ${life}. One hard conversation is enough.`,
            ]
          : [
              `${when}: conversaciones más serias en ${life}. Deja holgura en la agenda.`,
              `Se junta presión en ${life}. Una conversación difícil alcanza.`,
            ]
        : climate === "suave"
          ? lang === "en"
            ? [
                `${when}: more room in ${life}. Use it to recover, not to pile on.`,
                `A quieter stretch in ${life}. Do less, finish one thing.`,
              ]
            : [
                `${when}: más aire en ${life}. Úsalo para recuperar, no para llenar.`,
                `Tramo más quieto en ${life}. Haz menos, cierra una cosa.`,
              ]
          : lang === "en"
            ? [`${when}: ${life} stays in motion. Choose one thread and follow it.`]
            : [`${when}: ${life} sigue en movimiento. Elige un hilo y síguelo.`];

  for (const line of pool) {
    if (!used.has(line)) {
      used.add(line);
      return line.replace(/^: /, "").replace(/^:\s*/, "");
    }
  }
  const fallback = pool[0];
  used.add(fallback);
  return fallback;
}

function actionAvoid(climate: Climate, lang: "es" | "en"): { action: string; avoid: string } {
  if (lang === "en") {
    if (climate === "apretado") return { action: "Name one priority and protect sleep.", avoid: "Do not stack three hard talks in the same week." };
    if (climate === "suave") return { action: "Finish something small you already started.", avoid: "Do not open a new front just because it feels easy." };
    if (climate === "parejo") return { action: "Keep the routine that already works.", avoid: "Do not invent a crisis so the month feels 'important'." };
    return { action: "Move one real piece forward.", avoid: "Do not wait for a perfect week." };
  }
  if (climate === "apretado") return { action: "Nombra una prioridad y protege el sueño.", avoid: "No apiles tres conversaciones difíciles en la misma semana." };
  if (climate === "suave") return { action: "Cierra algo chico que ya empezaste.", avoid: "No abras un frente nuevo solo porque se siente fácil." };
  if (climate === "parejo") return { action: "Mantén la rutina que ya funciona.", avoid: "No inventes una crisis para que el mes 'cuente'." };
  return { action: "Mueve una pieza real.", avoid: "No esperes la semana perfecta." };
}

export function buildYearMapV2(opts: {
  transits: TransitResponse;
  months: string[];
  kind: YearMapWindowKind;
  lang: "es" | "en";
  currentMonthKey: string;
}): YearMapContentV2 {
  const byKey = new Map((opts.transits.timeline || []).map((m) => [m.month, m]));
  const raw =
    opts.transits.raw_intensity && opts.transits.raw_intensity.length === opts.months.length
      ? opts.transits.raw_intensity
      : opts.months.map((k) => byKey.get(k)?.intensity_score ?? 0);
  const tense = opts.months.map((k) => tenseRatioOf(byKey.get(k)));
  const { climate, relative, flat } = classifyClimate(raw, tense);
  const used = new Set<string>();
  const months: YearMapMonthV2[] = opts.months.map((key, i) => {
    const block = byKey.get(key);
    const events = pickEvents(block);
    const cl: Climate = flat ? "parejo" : climate[i];
    const { action, avoid } = actionAvoid(cl, opts.lang);
    const grouped = groupTransitsByTopic([], block?.transits_active ?? [], opts.lang);
    const areas: Partial<Record<TopicId, string>> = {};
    grouped.forEach((g) => {
      const life = TOPIC_LIFE[g.topicId][opts.lang];
      areas[g.topicId] =
        opts.lang === "en"
          ? `This month ${life} takes a clearer seat.`
          : `Este mes ${life} ocupa un lugar más claro.`;
    });
    return {
      key,
      label: monthLabel(key, opts.lang),
      climate: cl,
      relativeIntensity: Math.round((relative[i] ?? 5) * 10) / 10,
      headline: headlineFor(cl, events, opts.lang, used),
      action,
      avoid,
      areas,
    };
  });

  const keyDates: YearMapKeyDate[] = [];
  for (const ev of opts.transits.current_transits || []) {
    if (!ev.exact_date) continue;
    const topics = groupTransitsByTopic([], [ev], opts.lang).map((g) => g.topicId);
    keyDates.push({
      date: ev.exact_date.slice(0, 10),
      endDate: ev.leaves_orb?.slice(0, 10),
      title:
        opts.lang === "en"
          ? `${ev.transit_planet} to ${ev.natal_planet}`
          : `${ev.transit_planet} a ${ev.natal_planet}`,
      areas: topics.slice(0, 3),
      tone: ev.nature === "tenso" ? "tenso" : ev.nature === "armonioso" ? "armonico" : "neutro",
      technical: { transit: ev.transit_planet, aspect: ev.aspect_name, natal: ev.natal_planet },
    });
  }
  for (const ke of (opts.transits.key_events || []) as KeyEvent[]) {
    keyDates.push({
      date: ke.date,
      title: ke.kind.replace("_", " "),
      areas: [],
      tone: "neutro",
      technical: { transit: ke.kind, aspect: "aspect", natal: ke.natal },
    });
  }

  return {
    window: { start: opts.months[0], end: opts.months[opts.months.length - 1], kind: opts.kind },
    climateMode: "relative",
    months,
    keyDates: keyDates.slice(0, 24),
    currentMonthKey: opts.currentMonthKey,
  };
}

export function noRepeatedHeadlines(map: YearMapContentV2): boolean {
  const lines = map.months.map((m) => m.headline);
  return new Set(lines).size === lines.length;
}
