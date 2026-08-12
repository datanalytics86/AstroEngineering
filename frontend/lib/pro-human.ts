/**
 * Capa humana del Pro — misma voz que Tier -1.
 * Cero planetas / signos / casas / orbes en el texto que ve el usuario.
 */

import type {
  Aspect,
  ChartResponse,
  HumanProSummary,
  IntensityPoint,
  IntensityReading,
  PlanetPosition,
  Tier1Reading,
} from "./types";
import { findJargon, voiceOf, zoneOf } from "./tier-minus1";

type Lang = "es" | "en";

const ROLE: Record<string, { es: string; en: string }> = {
  Sol: { es: "tu identidad", en: "your identity" },
  Luna: { es: "tu mundo emocional", en: "your emotional world" },
  Mercurio: { es: "tu forma de pensar y hablar", en: "how you think and speak" },
  Venus: { es: "tu forma de amar y valorar", en: "how you love and value" },
  Marte: { es: "tu forma de actuar", en: "how you act" },
  Júpiter: { es: "tu forma de crecer", en: "how you grow" },
  Saturno: { es: "tu forma de construir", en: "how you build" },
  Urano: { es: "tu necesidad de libertad", en: "your need for freedom" },
  Neptuno: { es: "tu vida imaginativa", en: "your imaginative life" },
  Plutón: { es: "tu capacidad de transformarte", en: "your capacity to transform" },
  "Nodo Norte": { es: "tu próximo capítulo", en: "your next chapter" },
  Quirón: { es: "tu herida que enseña", en: "the wound that teaches you" },
};

const ASPECT_GLUE: Record<string, { es: string; en: string }> = {
  Conjunción: {
    es: "van juntas y se intensifican: es una de tus firmas más claras",
    en: "travel together and intensify: this is one of your clearest signatures",
  },
  Oposición: {
    es: "se miran de frente: el crecimiento está en el equilibrio, no en elegir un solo lado",
    en: "face each other: growth is in the balance, not in picking only one side",
  },
  Cuadratura: {
    es: "se rozan y piden práctica — la fricción no es un fallo, es el aula",
    en: "rub and ask for practice — the friction is not a flaw, it is the classroom",
  },
  Trígono: {
    es: "fluyen con naturalidad: este es un talento que ya tienes, úsalo a propósito",
    en: "flow naturally: this is a talent you already have — use it on purpose",
  },
  Sextil: {
    es: "se apoyan si das el primer paso; la oportunidad no llega sola",
    en: "support each other if you take the first step; the opening does not arrive alone",
  },
};

const ELEMENT_PULSE: Record<string, { es: string; en: string }> = {
  Fuego: { es: "el impulso y la visión", en: "drive and vision" },
  Tierra: { es: "construir y sostener", en: "building and holding" },
  Aire: { es: "las ideas y el vínculo", en: "ideas and connection" },
  Agua: { es: "sentir y cuidar", en: "feeling and care" },
};

const MODALITY_PULSE: Record<string, { es: string; en: string }> = {
  Cardinal: { es: "empezar ciclos", en: "starting cycles" },
  Fijo: { es: "profundizar lo que ya elegiste", en: "deepening what you already chose" },
  Mutable: { es: "adaptarte sin perder el hilo", en: "adapting without losing the thread" },
};

const SIGN_ELEMENT: Record<string, string> = {
  Aries: "Fuego", Leo: "Fuego", Sagitario: "Fuego",
  Tauro: "Tierra", Virgo: "Tierra", Capricornio: "Tierra",
  Géminis: "Aire", Libra: "Aire", Acuario: "Aire",
  Cáncer: "Agua", Escorpio: "Agua", Piscis: "Agua",
};

const SIGN_MODALITY: Record<string, string> = {
  Aries: "Cardinal", Cáncer: "Cardinal", Libra: "Cardinal", Capricornio: "Cardinal",
  Tauro: "Fijo", Leo: "Fijo", Escorpio: "Fijo", Acuario: "Fijo",
  Géminis: "Mutable", Virgo: "Mutable", Sagitario: "Mutable", Piscis: "Mutable",
};

function planet(planets: PlanetPosition[], name: string): PlanetPosition | undefined {
  return planets.find((p) => p.name === name);
}

function roleOf(name: string, lang: Lang): string {
  const r = ROLE[name];
  if (!r) return lang === "en" ? "a part of you" : "una parte de ti";
  return lang === "en" ? r.en : r.es;
}

function glueOf(aspect: string, lang: Lang): string {
  const g = ASPECT_GLUE[aspect];
  if (!g) {
    return lang === "en"
      ? "need to learn to live in the same room"
      : "necesitan aprender a convivir";
  }
  return lang === "en" ? g.en : g.es;
}

function warn(label: string, text: string): void {
  const hits = findJargon(text);
  if (hits.length === 0) return;
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`[pro-human] jerga en ${label}:`, hits.join(", "));
  }
}

export function generateHumanProSummary(
  chart: ChartResponse,
  lang: Lang = "es"
): HumanProSummary {
  const sun = planet(chart.planets, "Sol");
  const moon = planet(chart.planets, "Luna");
  const sunV = voiceOf(sun?.sign, lang);
  const moonV = voiceOf(moon?.sign, lang);
  const mcV = voiceOf(chart.midheaven?.sign, lang);
  const sunZone = zoneOf(sun?.house, lang);
  const moonZone = zoneOf(moon?.house ?? 4, lang);

  const headline =
    lang === "en"
      ? `A presence that is ${sunV.style}, with an inner climate that is ${moonV.style}`
      : `Una presencia ${sunV.style}, con un clima interno ${moonV.style}`;

  const identity =
    lang === "en"
      ? `You recognize yourself when you move in a way that is ${sunV.style}. That light shows most clearly in ${sunZone}. Your fuel is ${sunV.fuel}.`
      : `Te reconoces cuando te mueves de una forma ${sunV.style}. Esa luz se nota sobre todo en ${sunZone}. Tu combustible es ${sunV.fuel}.`;

  const emotion =
    lang === "en"
      ? `Inside, you need ${moonV.need}. You feel safe enough to rest when life makes room for that — especially in ${moonZone}. The shadow to watch is ${moonV.shadow}.`
      : `Por dentro necesitas ${moonV.need}. Hay calma para descansar cuando la vida deja sitio a eso — sobre todo en ${moonZone}. La sombra a vigilar es ${moonV.shadow}.`;

  const purpose =
    lang === "en"
      ? `The world tends to recognize a mark that is ${mcV.style}. Purpose holds when you give yourself to ${mcV.fuel} — and when you do not confuse worth with ${mcV.shadow}.`
      : `El mundo tiende a reconocerte por una marca ${mcV.style}. El propósito se sostiene cuando te dedicas a ${mcV.fuel} — y cuando no confundes valer con ${mcV.shadow}.`;

  const houseCount: Record<number, number> = {};
  for (const p of chart.planets) {
    houseCount[p.house] = (houseCount[p.house] ?? 0) + 1;
  }
  const topHouse = Number(
    Object.entries(houseCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10
  );
  const emphasis =
    lang === "en"
      ? `A lot of your energy gathers in ${zoneOf(topHouse, lang)}. That is not a side theme: it is a main plotline.`
      : `Mucha de tu energía se junta en ${zoneOf(topHouse, lang)}. No es un extra: es trama central.`;

  const strengths: string[] = [
    lang === "en"
      ? `A natural ease that is ${sunV.style} — people feel it even before they can name it.`
      : `Una naturalidad ${sunV.style}: se nota antes de que puedan nombrarla.`,
    lang === "en"
      ? `Emotional intelligence tuned to ${moonV.need}.`
      : `Una inteligencia emocional afinada a ${moonV.need}.`,
    lang === "en"
      ? `A public signature that is ${mcV.style}.`
      : `Una firma pública ${mcV.style}.`,
  ];

  const trine = chart.aspects.find((a) => a.aspect_name === "Trígono" && a.orb < 3);
  if (trine) {
    strengths.push(
      lang === "en"
        ? `${roleOf(trine.planet1, lang)} and ${roleOf(trine.planet2, lang)} already know how to work together. Lean on that.`
        : `${roleOf(trine.planet1, lang)} y ${roleOf(trine.planet2, lang)} ya saben trabajar juntas. Apóyate en eso.`
    );
  }

  const challenges: string[] = [];
  const hard = chart.aspects
    .filter((a) => (a.aspect_name === "Cuadratura" || a.aspect_name === "Oposición") && a.orb < 3)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 2);
  for (const h of hard) {
    challenges.push(
      lang === "en"
        ? `${roleOf(h.planet1, lang)} and ${roleOf(h.planet2, lang)} ${glueOf(h.aspect_name, lang)}.`
        : `${roleOf(h.planet1, lang)} y ${roleOf(h.planet2, lang)} ${glueOf(h.aspect_name, lang)}.`
    );
  }
  if (challenges.length === 0) {
    challenges.push(
      lang === "en"
        ? "Your map is relatively fluid. The real work is not inventing drama — it is not wasting talent through scatter."
        : "Tu mapa es relativamente fluido. El trabajo de verdad no es inventar drama: es no desperdiciar talento por dispersión."
    );
  }

  const elementCount: Record<string, number> = { Fuego: 0, Tierra: 0, Aire: 0, Agua: 0 };
  const modalityCount: Record<string, number> = { Cardinal: 0, Fijo: 0, Mutable: 0 };
  for (const p of chart.planets) {
    const el = SIGN_ELEMENT[p.sign];
    const mod = SIGN_MODALITY[p.sign];
    if (el) elementCount[el]++;
    if (mod) modalityCount[mod]++;
  }
  const dominantEl = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0][0];
  const dominantMod = Object.entries(modalityCount).sort((a, b) => b[1] - a[1])[0][0];
  const elPulse = ELEMENT_PULSE[dominantEl];
  const modPulse = MODALITY_PULSE[dominantMod];

  const advice =
    lang === "en"
      ? `Your engine is ${elPulse?.en ?? "your own pace"}, and your way of moving is ${modPulse?.en ?? "steady"}. Growth is not suppressing the tension: it is staying in the room with it long enough to use it.`
      : `Tu motor es ${elPulse?.es ?? "tu propio ritmo"}, y tu manera de moverte es ${modPulse?.es ?? "constante"}. El crecimiento no es apagar la tensión: es quedarte en la habitación con ella el tiempo suficiente para usarla.`;

  const summary: HumanProSummary = {
    headline,
    identity,
    emotion,
    purpose,
    strengths: strengths.slice(0, 4),
    challenges: challenges.slice(0, 3),
    advice,
    emphasis,
  };

  warn("headline", summary.headline);
  warn("identity", summary.identity);
  warn("emotion", summary.emotion);
  warn("purpose", summary.purpose);
  warn("advice", summary.advice);
  summary.strengths.forEach((s, i) => warn(`str${i}`, s));
  summary.challenges.forEach((s, i) => warn(`ch${i}`, s));
  return summary;
}

export function describeTier1Impact(a: Aspect, lang: Lang = "es"): string {
  const text =
    lang === "en"
      ? `${roleOf(a.planet1, lang)} and ${roleOf(a.planet2, lang)} ${glueOf(a.aspect_name, lang)}.`
      : `${roleOf(a.planet1, lang)} y ${roleOf(a.planet2, lang)} ${glueOf(a.aspect_name, lang)}.`;
  warn(`tier1-${a.planet1}-${a.planet2}`, text);
  return text;
}

export function buildTier1Readings(aspects: Aspect[], lang: Lang = "es"): Tier1Reading[] {
  return aspects.map((aspect) => ({
    aspect,
    impact: describeTier1Impact(aspect, lang),
  }));
}

const MONTH_LONG_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MONTH_LONG_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLong(isoMonth: string, lang: Lang): string {
  const m = Number(isoMonth.slice(5, 7));
  if (!m || m < 1 || m > 12) return isoMonth;
  return lang === "en" ? MONTH_LONG_EN[m - 1] : MONTH_LONG_ES[m - 1];
}

export function readIntensityYear(
  points: IntensityPoint[],
  lang: Lang = "es"
): IntensityReading | null {
  if (!points.length) return null;
  const ranked = [...points].sort((a, b) => b.value - a.value);
  const peak = ranked[0];
  const second = ranked[1];
  const quiet = ranked[ranked.length - 1];
  const peakLabels = [peak, second]
    .filter((p): p is IntensityPoint => !!p && p.value >= 5)
    .map((p) => monthLong(p.month, lang));

  const hot = peak.value >= 7.5;
  const headline = hot
    ? lang === "en"
      ? `${monthLong(peak.month, lang)} is the loudest month of your year`
      : `${monthLong(peak.month, lang)} es el mes más cargado de tu año`
    : lang === "en"
      ? "Your year has a pulse — not a single explosion"
      : "Tu año tiene pulso — no una sola explosión";

  const body = hot
    ? lang === "en"
      ? `Leave margin around ${monthLong(peak.month, lang)}${second && second.value >= 6 ? ` and ${monthLong(second.month, lang)}` : ""}. That is a window of pressure and opening — do not fill the calendar to the brim. ${monthLong(quiet.month, lang)} is better for integrating.`
      : `Deja margen alrededor de ${monthLong(peak.month, lang)}${second && second.value >= 6 ? ` y ${monthLong(second.month, lang)}` : ""}. Es una ventana de presión y de apertura: no llenes el calendario hasta el borde. ${monthLong(quiet.month, lang)} sirve mejor para integrar.`
    : lang === "en"
      ? `The load is spread out. Use ${monthLong(peak.month, lang)} to push what matters, and ${monthLong(quiet.month, lang)} to recover. Consistency will beat one dramatic month.`
      : `La carga está más repartida. Usa ${monthLong(peak.month, lang)} para empujar lo que importa, y ${monthLong(quiet.month, lang)} para recuperar. La constancia gana a un mes dramático.`;

  warn("intensity", `${headline} ${body}`);
  return { headline, body, peakLabels };
}

const TENSE = new Set(["Cuadratura", "Oposición"]);

export function humanTransitLine(
  ev: {
    natal_planet: string;
    aspect_name: string;
    exact_date?: string | null;
    enters_orb?: string;
  },
  lang: Lang = "es"
): string {
  const whenIso = ev.exact_date || ev.enters_orb || "";
  const when = whenIso ? monthLong(whenIso.slice(0, 7), lang) : "";
  const climate = TENSE.has(ev.aspect_name)
    ? lang === "en"
      ? "asks for practice"
      : "pide práctica"
    : lang === "en"
      ? "opens a window"
      : "abre una ventana";
  const line = when
    ? lang === "en"
      ? `${when}: ${roleOf(ev.natal_planet, lang)} ${climate}.`
      : `${when}: ${roleOf(ev.natal_planet, lang)} ${climate}.`
    : lang === "en"
      ? `${roleOf(ev.natal_planet, lang)} ${climate}.`
      : `${roleOf(ev.natal_planet, lang)} ${climate}.`;
  warn("transit", line);
  return line;
}
