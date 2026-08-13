/**
 * TIER 1 Pro year map — natal + solar tone + 12 months + topic climates.
 * Surface language: coaching, second person, zero jargon.
 */

import type {
  ChartResponse,
  HumanProSummary,
  IntensityPoint,
  TopicId,
  TransitEvent,
  TransitResponse,
} from "./types";
import {
  generateHumanProSummary,
  humanTransitLine,
  readIntensityYear,
} from "./pro-human";
import { findJargon, voiceOf } from "./tier-minus1";
import { groupTransitsByTopic } from "./topic-summary";
import { buildPersonalIntensitySeries } from "./personal-intensity";

type Lang = "es" | "en";

export const TOPIC_ORDER: TopicId[] = [
  "amor",
  "dinero",
  "trabajo",
  "salud",
  "familia",
  "crecimiento",
];

export const TOPIC_TITLE: Record<TopicId, { es: string; en: string }> = {
  amor: { es: "Amor", en: "Love" },
  dinero: { es: "Dinero", en: "Money" },
  trabajo: { es: "Trabajo", en: "Work" },
  salud: { es: "Salud", en: "Health" },
  familia: { es: "Familia", en: "Family" },
  crecimiento: { es: "Crecimiento", en: "Growth" },
};

const MONTH_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTH_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type YearClimate = "apretado" | "abierto" | "suave";

export interface YearTopicLine {
  id: TopicId;
  title: string;
  line: string;
  featured?: boolean;
  feel?: string;
}

export interface YearMonthBlock {
  key: string;
  monthIndex: number;
  label: string;
  shortLabel: string;
  intensity: number;
  climate: YearClimate;
  climateLabel: string;
  executive: string;
  topics: YearTopicLine[];
  featured: YearTopicLine[];
  rest: YearTopicLine[];
}

export interface SolarYearTone {
  headline: string;
  body: string;
  publicMark: string;
}

export interface YearMapZone {
  house: number;
  label: string;
  color: string;
  cuspLongitude: number;
}

export interface YearMapDot {
  role: string;
  color: string;
  longitude: number;
}

export interface YearMapWheel {
  ascLongitude: number;
  zones: YearMapZone[];
  dots: YearMapDot[];
}

export interface YearMapContent {
  lang: Lang;
  name: string;
  year: number;
  sample?: boolean;
  natal: HumanProSummary;
  solar: SolarYearTone;
  natalPoints: number[];
  solarPoints: number[];
  natalWheel: YearMapWheel;
  solarWheel: YearMapWheel;
  yearPulse: { headline: string; body: string };
  forecast: {
    headline: string;
    body: string;
    remaining: YearMonthBlock[];
    moves: string[];
  };
  howTo: string[];
  keyMonths: YearMonthBlock[];
  climateLegend: { climate: YearClimate; label: string; hint: string }[];
  months: YearMonthBlock[];
}

function warn(label: string, text: string): void {
  const hits = findJargon(text);
  if (hits.length === 0) return;
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`[year-map] jerga en ${label}:`, hits.join(", "));
  }
}

const MONTH_SHORT_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CLIMATE_LABEL: Record<YearClimate, { es: string; en: string }> = {
  apretado: { es: "Apretado", en: "Tight" },
  abierto: { es: "Abierto", en: "Open" },
  suave: { es: "Suave", en: "Soft" },
};

const FEEL: Record<TopicId, Record<YearClimate, { es: string; en: string }>> = {
  amor: {
    apretado: { es: "verdad", en: "truth" },
    abierto: { es: "acercarse", en: "closer" },
    suave: { es: "cuidado", en: "care" },
  },
  dinero: {
    apretado: { es: "frontera", en: "border" },
    abierto: { es: "invertir", en: "invest" },
    suave: { es: "orden", en: "order" },
  },
  trabajo: {
    apretado: { es: "foco", en: "focus" },
    abierto: { es: "visibilidad", en: "visible" },
    suave: { es: "cierre", en: "close" },
  },
  salud: {
    apretado: { es: "descanso", en: "rest" },
    abierto: { es: "ritmo", en: "rhythm" },
    suave: { es: "recuperar", en: "recover" },
  },
  familia: {
    apretado: { es: "límite", en: "limit" },
    abierto: { es: "presencia", en: "presence" },
    suave: { es: "nido", en: "nest" },
  },
  crecimiento: {
    apretado: { es: "sostener", en: "hold" },
    abierto: { es: "ángulo", en: "angle" },
    suave: { es: "integrar", en: "integrate" },
  },
};

const ZONE_SHORT: Record<number, { es: string; en: string }> = {
  1: { es: "Apariencia", en: "Arrival" },
  2: { es: "Recursos", en: "Means" },
  3: { es: "Cerca", en: "Near" },
  4: { es: "Nido", en: "Nest" },
  5: { es: "Juego", en: "Play" },
  6: { es: "Oficio", en: "Craft" },
  7: { es: "Vínculos", en: "Bonds" },
  8: { es: "Íntimo", en: "Intimate" },
  9: { es: "Horizonte", en: "Horizon" },
  10: { es: "Nombre", en: "Name" },
  11: { es: "Círculos", en: "Circles" },
  12: { es: "Interior", en: "Inner" },
};

const ZONE_COLOR: Record<number, string> = {
  1: "#4F46E5",
  2: "#059669",
  3: "#0284C7",
  4: "#7C3AED",
  5: "#DB2777",
  6: "#D97706",
  7: "#BE185D",
  8: "#6D28D9",
  9: "#2563EB",
  10: "#1D4ED8",
  11: "#0F766E",
  12: "#475569",
};

const BODY_META: Record<string, { es: string; en: string; color: string }> = {
  Sol: { es: "identidad", en: "identity", color: "#D97706" },
  Luna: { es: "emoción", en: "emotion", color: "#64748B" },
  Mercurio: { es: "mente", en: "mind", color: "#CA8A04" },
  Venus: { es: "vínculo", en: "bond", color: "#DB2777" },
  Marte: { es: "acción", en: "action", color: "#DC2626" },
  Júpiter: { es: "expansión", en: "expansion", color: "#059669" },
  Saturno: { es: "estructura", en: "structure", color: "#334155" },
  Urano: { es: "libertad", en: "freedom", color: "#0891B2" },
  Neptuno: { es: "imaginación", en: "imagination", color: "#6366F1" },
  Plutón: { es: "cambio", en: "change", color: "#6B21A8" },
};

const TENSE = new Set(["Cuadratura", "Oposición"]);

function monthName(index0: number, lang: Lang): string {
  return lang === "en" ? MONTH_EN[index0] : MONTH_ES[index0];
}

function monthShort(index0: number, lang: Lang): string {
  return lang === "en" ? MONTH_SHORT_EN[index0] : MONTH_SHORT_ES[index0];
}

function climateLabelOf(climate: YearClimate, lang: Lang): string {
  return lang === "en" ? CLIMATE_LABEL[climate].en : CLIMATE_LABEL[climate].es;
}

function climateOf(value: number, tenseRatio = 0): YearClimate {
  if (value >= 6.5 || (value >= 5 && tenseRatio >= 0.55)) return "apretado";
  if (value < 4) return "suave";
  return "abierto";
}

function buildWheel(chart: ChartResponse, lang: Lang): YearMapWheel {
  const raw = (chart.houses ?? []).slice(0, 12);
  const zones = (raw.length === 12
    ? raw
    : Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        cusp_longitude: (chart.ascendant?.longitude ?? 0) + i * 30,
        sign: "",
        degree_display: "",
      }))
  ).map((h) => ({
    house: h.number,
    label:
      lang === "en"
        ? (ZONE_SHORT[h.number]?.en ?? `Z${h.number}`)
        : (ZONE_SHORT[h.number]?.es ?? `Z${h.number}`),
    color: ZONE_COLOR[h.number] ?? "#64748B",
    cuspLongitude: h.cusp_longitude,
  }));
  const dots: YearMapDot[] = [];
  for (const p of chart.planets) {
    const meta = BODY_META[p.name];
    if (!meta) continue;
    dots.push({
      role: lang === "en" ? meta.en : meta.es,
      color: meta.color,
      longitude: p.longitude,
    });
  }
  return {
    ascLongitude: chart.ascendant?.longitude ?? 0,
    zones,
    dots,
  };
}

function fallbackWheel(points: number[], lang: Lang): YearMapWheel {
  return {
    ascLongitude: 0,
    zones: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      label: lang === "en" ? (ZONE_SHORT[i + 1]?.en ?? "") : (ZONE_SHORT[i + 1]?.es ?? ""),
      color: ZONE_COLOR[i + 1] ?? "#64748B",
      cuspLongitude: i * 30,
    })),
    dots: points.slice(0, 10).map((longitude, i) => {
      const names = Object.keys(BODY_META);
      const meta = BODY_META[names[i]] ?? { es: "pulso", en: "pulse", color: "#4F46E5" };
      return { role: lang === "en" ? meta.en : meta.es, color: meta.color, longitude };
    }),
  };
}

function howToOf(lang: Lang): string[] {
  return lang === "en"
    ? [
        "Scan the cover and the three key months. That is the year in 20 seconds.",
        "Each month: read the ask first, then the two featured areas. The rest is climate.",
        "Return at the start of the month. Do not reread the whole document every time.",
      ]
    : [
        "Mira la portada y los tres meses clave. Eso es el año en 20 segundos.",
        "Cada mes: lee primero lo que pide, luego las dos áreas destacadas. El resto es clima.",
        "Vuelve al empezar el mes. No releas el documento entero cada vez.",
      ];
}

function legendOf(lang: Lang): YearMapContent["climateLegend"] {
  return [
    {
      climate: "apretado",
      label: climateLabelOf("apretado", lang),
      hint: lang === "en" ? "Pressure. Leave margin. Sleep first." : "Presión. Deja margen. Duerme primero.",
    },
    {
      climate: "abierto",
      label: climateLabelOf("abierto", lang),
      hint: lang === "en" ? "Window. Take one visible step." : "Ventana. Da un paso visible.",
    },
    {
      climate: "suave",
      label: climateLabelOf("suave", lang),
      hint: lang === "en" ? "Integrate. Close. Recover." : "Integra. Cierra. Recupera.",
    },
  ];
}

function pickKeyMonths(months: YearMonthBlock[]): YearMonthBlock[] {
  const ranked = [...months].sort((a, b) => b.intensity - a.intensity);
  const quiet = [...months].sort((a, b) => a.intensity - b.intensity)[0];
  const picked: YearMonthBlock[] = [];
  for (const m of [ranked[0], ranked[1], quiet]) {
    if (m && !picked.some((p) => p.key === m.key)) picked.push(m);
  }
  return picked.slice(0, 3);
}

const BASELINE: Record<TopicId, Record<YearMonthBlock["climate"], { es: string; en: string }>> = {
  amor: {
    apretado: {
      es: "Cómo te acercas se pone más honesto y menos cómodo. No fuerces. Di lo que es verdad y deja aire.",
      en: "How you come close gets more honest and less comfortable. Don't force it. Say what's true and leave air.",
    },
    abierto: {
      es: "Hay ventana para elegir con quién y cómo. Una conversación clara vale más que un gesto grande.",
      en: "There is a window to choose who and how. One clear conversation beats a grand gesture.",
    },
    suave: {
      es: "Mes para cuidar el vínculo sin estrenar drama. La constancia se siente más que la intensidad.",
      en: "A month to tend the bond without inventing drama. Steadiness lands more than intensity.",
    },
  },
  dinero: {
    apretado: {
      es: "El valor se discute: qué cobras, qué dejas ir, qué no está claro. No firmes con prisa.",
      en: "Value is on the table: what you charge, what you let go, what isn't clear. Don't sign in a rush.",
    },
    abierto: {
      es: "Se abre un movimiento de recursos si nombras lo que vale tu trabajo. Pide lo concreto.",
      en: "Resources can move if you name what your work is worth. Ask for something concrete.",
    },
    suave: {
      es: "Mes de orden, no de golpe de suerte. Revisa una cuenta, un precio, un acuerdo pendiente.",
      en: "A month for order, not a lucky strike. Review one account, one price, one pending deal.",
    },
  },
  trabajo: {
    apretado: {
      es: "La vocación pide una decisión, no más esfuerzo ciego. Elige una prioridad y suelta el resto.",
      en: "Vocation asks for a decision, not more blind effort. Pick one priority and drop the rest.",
    },
    abierto: {
      es: "Hay margen para que te vean por lo que haces bien. Entrega algo visible. No esperes permiso.",
      en: "There is room to be seen for what you do well. Deliver something visible. Don't wait for permission.",
    },
    suave: {
      es: "Construye el oficio en silencio. Un hábito diario pesa más que un mes heroico.",
      en: "Build the craft quietly. One daily habit weighs more than a heroic month.",
    },
  },
  salud: {
    apretado: {
      es: "El cuerpo cobra la factura del ritmo. Baja una marcha. Duerme y come como si importara.",
      en: "The body sends the bill for your pace. Downshift. Sleep and eat as if it mattered.",
    },
    abierto: {
      es: "Hay energía para un cambio de hábito que ya sabías. Empieza pequeño y no lo conviertas en proyecto.",
      en: "There is energy for a habit change you already knew. Start small and don't turn it into a project.",
    },
    suave: {
      es: "Mes para recuperar margen. Camina, corta cafeína de más, cierra el día a una hora decente.",
      en: "A month to recover margin. Walk, cut the extra caffeine, end the day at a decent hour.",
    },
  },
  familia: {
    apretado: {
      es: "Lo de casa se vuelve ruidoso. No resuelvas la historia entera. Resuelve una conversación.",
      en: "Home gets loud. Don't solve the whole story. Solve one conversation.",
    },
    abierto: {
      es: "Se puede reordenar el vínculo con alguien de tu círculo íntimo. Ofrece presencia, no un discurso.",
      en: "A close bond can be rearranged. Offer presence, not a speech.",
    },
    suave: {
      es: "Mes de raíces: una comida, una llamada, un límite amable. Lo pequeño sostiene.",
      en: "A roots month: one meal, one call, one kind boundary. The small things hold.",
    },
  },
  crecimiento: {
    apretado: {
      es: "El tema de fondo no se deja posponer. Siéntate con lo que evitas. Ahí está el año.",
      en: "The background theme will not wait. Sit with what you avoid. The year is there.",
    },
    abierto: {
      es: "Hay apertura para un capítulo que ya venía. Da un paso que se note. No hace falta que sea grande.",
      en: "There is an opening for a chapter already underway. Take a visible step. It doesn't have to be big.",
    },
    suave: {
      es: "Integra. Escribe, camina, deja que lo aprendido se asiente antes de pedir más.",
      en: "Integrate. Write, walk, let what you learned settle before asking for more.",
    },
  },
};

function topicLine(
  id: TopicId,
  climate: YearMonthBlock["climate"],
  extra: string | undefined,
  lang: Lang,
): string {
  const base = lang === "en" ? BASELINE[id][climate].en : BASELINE[id][climate].es;
  if (!extra) return base;
  return `${base} ${extra}`;
}

function executiveFor(
  label: string,
  climate: YearMonthBlock["climate"],
  hotTopics: string[],
  lang: Lang,
): string {
  const focus = hotTopics.slice(0, 2).join(lang === "en" ? " and " : " y ");
  if (climate === "apretado") {
    return lang === "en"
      ? `${label} tightens. Leave margin${focus ? ` in ${focus}` : ""}. Don't fill the calendar to the brim.`
      : `${label} se aprieta. Deja margen${focus ? ` en ${focus}` : ""}. No llenes el calendario hasta el borde.`;
  }
  if (climate === "abierto") {
    return lang === "en"
      ? `${label} opens a window${focus ? ` in ${focus}` : ""}. Take one visible step. Don't wait for a perfect week.`
      : `${label} abre una ventana${focus ? ` en ${focus}` : ""}. Da un paso que se note. No esperes la semana perfecta.`;
  }
  return lang === "en"
    ? `${label} is for integrating${focus ? ` — especially ${focus}` : ""}. Consistency beats a dramatic push.`
    : `${label} sirve para integrar${focus ? ` — sobre todo ${focus}` : ""}. La constancia gana a un empujón dramático.`;
}

function solarTone(sr: ChartResponse | null, lang: Lang): SolarYearTone {
  const style = voiceOf(sr?.ascendant?.sign, lang);
  const publicV = voiceOf(sr?.midheaven?.sign, lang);
  const headline =
    lang === "en"
      ? `This year wants a tone that is ${style.style}`
      : `Este año pide un tono ${style.style}`;
  const body =
    lang === "en"
      ? `The year holds when you give yourself to ${style.fuel}. What you need underneath is ${style.need}. The shadow to watch is ${style.shadow} — it will dress itself up as ambition.`
      : `El año se sostiene cuando te dedicas a ${style.fuel}. Lo que necesitas debajo es ${style.need}. La sombra a vigilar es ${style.shadow}: se disfraza de ambición.`;
  const publicMark =
    lang === "en"
      ? `The world tends to meet you this year through a mark that is ${publicV.style}. Let that be a direction, not a costume.`
      : `El mundo tiende a encontrarte este año por una marca ${publicV.style}. Que sea dirección, no disfraz.`;
  warn("solar.headline", headline);
  warn("solar.body", body);
  warn("solar.public", publicMark);
  return { headline, body, publicMark };
}

function eventsForMonth(transits: TransitResponse | null, key: string): TransitEvent[] {
  if (!transits) return [];
  const row = transits.timeline.find((m) => m.month === key);
  const fromTimeline = row?.transits_active ?? [];
  const fromCurrent = (transits.current_transits ?? []).filter((e) => {
    const d = e.exact_date || e.enters_orb || "";
    return d.startsWith(key);
  });
  const seen = new Set<string>();
  const all = [...fromTimeline, ...fromCurrent];
  return all.filter((e) => {
    const id = `${e.transit_planet}|${e.aspect_name}|${e.natal_planet}|${e.exact_date}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function buildMonth(
  year: number,
  monthIndex0: number,
  intensity: number,
  chart: ChartResponse,
  events: TransitEvent[],
  lang: Lang,
): YearMonthBlock {
  const key = `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
  const label = monthName(monthIndex0, lang);
  const tense = events.filter((e) => TENSE.has(e.aspect_name)).length;
  const tenseRatio = events.length ? tense / events.length : 0;
  const climate = climateOf(intensity, tenseRatio);
  const grouped = groupTransitsByTopic(chart.planets, events, lang, (ev) =>
    humanTransitLine(ev, lang),
  );
  const byId = new Map(grouped.map((g) => [g.topicId, g.items]));
  const topics: YearTopicLine[] = TOPIC_ORDER.map((id) => {
    const extra = byId.get(id)?.[0]?.replace(/^[^:]+:\s*/, "");
    const line = extra || topicLine(id, climate, undefined, lang);
    const feel = lang === "en" ? FEEL[id][climate].en : FEEL[id][climate].es;
    warn(`month.${key}.${id}`, line);
    return {
      id,
      title: lang === "en" ? TOPIC_TITLE[id].en : TOPIC_TITLE[id].es,
      line,
      featured: false,
      feel,
    };
  });
  const ranked = [...topics].sort((a, b) => {
    const sa = byId.get(a.id)?.length ?? 0;
    const sb = byId.get(b.id)?.length ?? 0;
    return sb - sa;
  });
  const featured = ranked.slice(0, 2).map((t) => ({ ...t, featured: true }));
  const rest = ranked.slice(2).map((t) => ({ ...t, featured: false }));
  const hot = featured.map((t) => t.title.toLowerCase());
  const executive = executiveFor(label, climate, hot, lang);
  warn(`month.${key}.exec`, executive);
  return {
    key,
    monthIndex: monthIndex0,
    label,
    shortLabel: monthShort(monthIndex0, lang),
    intensity,
    climate,
    climateLabel: climateLabelOf(climate, lang),
    executive,
    topics,
    featured,
    rest,
  };
}

export function buildYearMap(opts: {
  chart: ChartResponse;
  transits: TransitResponse | null;
  solar: ChartResponse | null;
  year?: number;
  lang?: Lang;
}): YearMapContent {
  const lang = opts.lang === "en" ? "en" : "es";
  const year = opts.year ?? new Date().getFullYear();
  const natal = generateHumanProSummary(opts.chart, lang);
  const series = buildPersonalIntensitySeries(opts.transits, year, lang);
  const byKey = new Map(series.map((p) => [p.month, p.value]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    const value = byKey.get(key) ?? 3.5;
    return buildMonth(
      year,
      i,
      value,
      opts.chart,
      eventsForMonth(opts.transits, key),
      lang,
    );
  });

  const pulse = readIntensityYear(
    months.map((m) => ({
      month: m.key,
      value: m.intensity,
      label: m.label,
    })) as IntensityPoint[],
    lang,
  );

  const now = new Date();
  const startIdx =
    now.getFullYear() === year ? Math.max(0, now.getMonth()) : 0;
  const remaining = months.slice(startIdx);
  const remainingHot = remaining.filter((m) => m.climate === "apretado").map((m) => m.label);
  const remainingSoft = remaining.filter((m) => m.climate === "suave").map((m) => m.label);
  const forecastHeadline =
    lang === "en"
      ? `From here to the end of ${year}`
      : `De aquí a fin de ${year}`;
  const forecastBody =
    remainingHot.length > 0
      ? lang === "en"
        ? `The months that ask for margin are ${remainingHot.join(", ")}. Use ${remainingSoft.slice(0, 2).join(" and ") || "the quieter weeks"} to integrate, not to disappear.`
        : `Los meses que piden margen son ${remainingHot.join(", ")}. Usa ${remainingSoft.slice(0, 2).join(" y ") || "las semanas más quietas"} para integrar, no para desaparecer.`
      : lang === "en"
        ? `The rest of the year is more even. Consistency will beat one dramatic month. Keep the six areas in view and don't abandon the one that feels quiet.`
        : `El resto del año es más parejo. La constancia gana a un mes dramático. Mantén las seis áreas a la vista y no abandones la que se siente quieta.`;

  warn("forecast", `${forecastHeadline} ${forecastBody}`);

  const keyMonths = pickKeyMonths(months);
  const peak = keyMonths[0];
  const moves = [
    lang === "en"
      ? `Protect sleep around ${peak?.label ?? months[0].label}.`
      : `Protege el sueño alrededor de ${peak?.label ?? months[0].label}.`,
    remaining.find((m) => m.climate === "abierto")
      ? lang === "en"
        ? `Use ${remaining.find((m) => m.climate === "abierto")!.label} to take one visible step.`
        : `Usa ${remaining.find((m) => m.climate === "abierto")!.label} para dar un paso visible.`
      : lang === "en"
        ? "Use a quiet month to close, not to start."
        : "Usa un mes suave para cerrar, no para empezar.",
    lang === "en"
      ? "Return to this map on the first of each month. Read only that card."
      : "Vuelve a este mapa el día uno de cada mes. Lee solo esa ficha.",
  ];

  const natalWheel = buildWheel(opts.chart, lang);
  const solarWheel = opts.solar ? buildWheel(opts.solar, lang) : natalWheel;

  return {
    lang,
    name: opts.chart.name,
    year,
    natal,
    solar: solarTone(opts.solar, lang),
    natalPoints: opts.chart.planets.map((p) => p.longitude),
    solarPoints: (opts.solar?.planets ?? opts.chart.planets).map((p) => p.longitude),
    natalWheel,
    solarWheel,
    yearPulse: {
      headline: pulse?.headline ?? (lang === "en" ? "Your year has a pulse" : "Tu año tiene pulso"),
      body:
        pulse?.body ??
        (lang === "en"
          ? "Calculate the year once to see which months tighten and which ones let you breathe."
          : "Calcula el año una vez para ver qué meses aprietan y cuáles te dejan respirar."),
    },
    forecast: { headline: forecastHeadline, body: forecastBody, remaining, moves },
    howTo: howToOf(lang),
    keyMonths,
    climateLegend: legendOf(lang),
    months,
  };
}

/** Full Pro year-map sample (Alex Rivera) — same document as a paid map. */
export function getSampleYearMap(lang: Lang = "es"): YearMapContent {
  const year = new Date().getFullYear();
  const intensities = [3.2, 4.1, 8.6, 5.4, 4.0, 3.6, 2.8, 4.7, 5.9, 7.4, 4.5, 3.1];
  const months: YearMonthBlock[] = intensities.map((value, i) => {
    const climate = climateOf(value);
    const label = monthName(i, lang);
    const topics: YearTopicLine[] = TOPIC_ORDER.map((id) => ({
      id,
      title: lang === "en" ? TOPIC_TITLE[id].en : TOPIC_TITLE[id].es,
      line: topicLine(id, climate, undefined, lang),
      featured: false,
      feel: lang === "en" ? FEEL[id][climate].en : FEEL[id][climate].es,
    }));
    const hotIds: TopicId[] =
      climate === "apretado"
        ? ["amor", "trabajo"]
        : climate === "abierto"
          ? ["dinero", "crecimiento"]
          : ["familia", "salud"];
    const featured = topics.filter((t) => hotIds.includes(t.id)).map((t) => ({ ...t, featured: true }));
    const rest = topics.filter((t) => !hotIds.includes(t.id));
    const hot = featured.map((t) => t.title.toLowerCase());
    return {
      key: `${year}-${String(i + 1).padStart(2, "0")}`,
      monthIndex: i,
      label,
      shortLabel: monthShort(i, lang),
      intensity: value,
      climate,
      climateLabel: climateLabelOf(climate, lang),
      executive: executiveFor(label, climate, hot, lang),
      topics,
      featured,
      rest,
    };
  });
  const remaining = months.slice(Math.max(0, new Date().getMonth()));
  const natalPoints = [24, 96, 118, 142, 168, 201, 248, 286, 312, 338, 18, 72];
  const solarPoints = [41, 88, 110, 155, 190, 214, 260, 295, 321, 350, 12, 67];
  return {
    lang,
    name: "Alex Rivera",
    year,
    sample: true,
    natal: {
      headline:
        lang === "en"
          ? "A presence that is direct and without theater, with an inner climate that is protective"
          : "Una presencia directa y sin rodeos, con un clima interno protector",
      identity:
        lang === "en"
          ? "You recognize yourself when you start before fear gets a vote. That light shows most clearly in your vocation and your name in the world."
          : "Te reconoces cuando empiezas antes de que el miedo hable. Esa luz se nota sobre todo en tu vocación y tu nombre en el mundo.",
      emotion:
        lang === "en"
          ? "Inside, you need emotional safety. There is room to rest when private life is tended — not postponed."
          : "Por dentro necesitas seguridad emocional. Hay calma para descansar cuando la vida privada se cuida — no se posterga.",
      purpose:
        lang === "en"
          ? "The world tends to recognize a mark that is serious and long-game. Purpose holds when you leave work that stands."
          : "El mundo tiende a reconocerte por una marca seria y de largo aliento. El propósito se sostiene cuando dejas una obra que se aguante.",
      strengths:
        lang === "en"
          ? [
              "A natural ease that is direct — people feel it before they can name it.",
              "Emotional intelligence tuned to safety.",
            ]
          : [
              "Una naturalidad directa: se nota antes de que puedan nombrarla.",
              "Una inteligencia emocional afinada a la seguridad.",
            ],
      challenges:
        lang === "en"
          ? ["How you love and how you build rub and ask for practice."]
          : ["Tu forma de amar y tu forma de construir se rozan y piden práctica."],
      advice:
        lang === "en"
          ? "Your engine is drive and vision. Growth is staying in the room with the tension long enough to use it."
          : "Tu motor es el impulso y la visión. El crecimiento es quedarte en la habitación con la tensión el tiempo suficiente para usarla.",
      emphasis:
        lang === "en"
          ? "A lot of your energy gathers in vocation. That is a main plotline."
          : "Mucha de tu energía se junta en la vocación. Es trama central.",
    },
    solar: {
      headline:
        lang === "en"
          ? "This year wants a tone that is serious and long-game"
          : "Este año pide un tono serio y de largo aliento",
      body:
        lang === "en"
          ? "The year holds when you give yourself to work that stands. What you need underneath is emotional safety. The shadow to watch is rushing — it will dress itself up as ambition."
          : "El año se sostiene cuando te dedicas a una obra que se aguante. Lo que necesitas debajo es seguridad emocional. La sombra a vigilar es apurar: se disfraza de ambición.",
      publicMark:
        lang === "en"
          ? "The world tends to meet you this year through a mark that is visible and steady. Let that be a direction, not a costume."
          : "El mundo tiende a encontrarte este año por una marca visible y firme. Que sea dirección, no disfraz.",
    },
    natalPoints,
    solarPoints,
    natalWheel: fallbackWheel(natalPoints, lang),
    solarWheel: fallbackWheel(solarPoints, lang),
    yearPulse: {
      headline:
        lang === "en"
          ? `${monthName(2, lang)} is the loudest month of your year`
          : `${monthName(2, lang)} es el mes más cargado de tu año`,
      body:
        lang === "en"
          ? `Leave margin around ${monthName(2, lang)} and ${monthName(9, lang)}. That is a window of pressure and opening. ${monthName(6, lang)} is better for integrating.`
          : `Deja margen alrededor de ${monthName(2, lang)} y ${monthName(9, lang)}. Es una ventana de presión y de apertura. ${monthName(6, lang)} sirve mejor para integrar.`,
    },
    forecast: {
      headline: lang === "en" ? `From here to the end of ${year}` : `De aquí a fin de ${year}`,
      body:
        lang === "en"
          ? `The months that ask for margin are ${monthName(2, lang)}, ${monthName(9, lang)}. Use ${monthName(6, lang)} to integrate, not to disappear.`
          : `Los meses que piden margen son ${monthName(2, lang)}, ${monthName(9, lang)}. Usa ${monthName(6, lang)} para integrar, no para desaparecer.`,
      remaining,
      moves:
        lang === "en"
          ? [
              `Protect sleep around ${monthName(2, lang)}.`,
              `Use ${monthName(5, lang)} to take one visible step.`,
              "Return to this map on the first of each month. Read only that card.",
            ]
          : [
              `Protege el sueño alrededor de ${monthName(2, lang)}.`,
              `Usa ${monthName(5, lang)} para dar un paso visible.`,
              "Vuelve a este mapa el día uno de cada mes. Lee solo esa ficha.",
            ],
    },
    howTo: howToOf(lang),
    keyMonths: pickKeyMonths(months),
    climateLegend: legendOf(lang),
    months,
  };
}
