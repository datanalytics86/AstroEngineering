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

export interface YearTopicLine {
  id: TopicId;
  title: string;
  line: string;
}

export interface YearMonthBlock {
  key: string;
  monthIndex: number;
  label: string;
  intensity: number;
  climate: "apretado" | "abierto" | "suave";
  executive: string;
  topics: YearTopicLine[];
}

export interface SolarYearTone {
  headline: string;
  body: string;
  publicMark: string;
}

export interface YearMapContent {
  lang: Lang;
  name: string;
  year: number;
  natal: HumanProSummary;
  solar: SolarYearTone;
  yearPulse: { headline: string; body: string };
  forecast: { headline: string; body: string; remaining: YearMonthBlock[] };
  months: YearMonthBlock[];
}

function warn(label: string, text: string): void {
  const hits = findJargon(text);
  if (hits.length === 0) return;
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`[year-map] jerga en ${label}:`, hits.join(", "));
  }
}

function monthName(index0: number, lang: Lang): string {
  return lang === "en" ? MONTH_EN[index0] : MONTH_ES[index0];
}

function climateOf(value: number): YearMonthBlock["climate"] {
  if (value >= 7) return "apretado";
  if (value >= 4.5) return "abierto";
  return "suave";
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
  const climate = climateOf(intensity);
  const grouped = groupTransitsByTopic(chart.planets, events, lang, (ev) =>
    humanTransitLine(ev, lang),
  );
  const byId = new Map(grouped.map((g) => [g.topicId, g.items]));
  const topics: YearTopicLine[] = TOPIC_ORDER.map((id) => {
    const extra = byId.get(id)?.[0]?.replace(/^[^:]+:\s*/, "");
    const line = extra || topicLine(id, climate, undefined, lang);
    warn(`month.${key}.${id}`, line);
    return {
      id,
      title: lang === "en" ? TOPIC_TITLE[id].en : TOPIC_TITLE[id].es,
      line,
    };
  });
  const hot = topics
    .filter((_, i) => (byId.get(TOPIC_ORDER[i])?.length ?? 0) > 0)
    .map((t) => t.title.toLowerCase());
  const executive = executiveFor(label, climate, hot, lang);
  warn(`month.${key}.exec`, executive);
  return {
    key,
    monthIndex: monthIndex0,
    label,
    intensity,
    climate,
    executive,
    topics,
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

  return {
    lang,
    name: opts.chart.name,
    year,
    natal,
    solar: solarTone(opts.solar, lang),
    yearPulse: {
      headline: pulse?.headline ?? (lang === "en" ? "Your year has a pulse" : "Tu año tiene pulso"),
      body:
        pulse?.body ??
        (lang === "en"
          ? "Calculate the year once to see which months tighten and which ones let you breathe."
          : "Calcula el año una vez para ver qué meses aprietan y cuáles te dejan respirar."),
    },
    forecast: { headline: forecastHeadline, body: forecastBody, remaining },
    months,
  };
}
