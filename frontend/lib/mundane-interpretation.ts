/**
 * Generador de "lectura" narrativa para una configuración mundial.
 *
 * Produce un texto fluido (varios párrafos) al estilo de una interpretación
 * mundialista: nombra los planetas, grados, signo y fecha, el eco histórico y
 * qué placements quedan activados. Bilingüe (ES/EN).
 *
 * INTEGRIDAD: clave analógica/arquetípica con recordatorio de disclaimer. NO
 * afirma hechos geopolíticos concretos como predicción factual.
 */

import type { MundaneConfiguration, MundaneAnalog, NatalImpact } from "./types";
import { SIGN_NAMES } from "./wheel-geometry";
import { getConfigNarrative, getEventNarrative, getThemeLabel, type Lang } from "./mundane-corpus";

export interface MundaneReading {
  paragraphs: string[];
  natalNote: string;
}

// Verbo/acción por aspecto (más vívido que el nombre a secas).
const ASPECT_ACTION: Record<string, { es: string; en: string }> = {
  Conjunción: { es: "se funden en conjunción", en: "fuse in conjunction" },
  Oposición: { es: "se enfrentan en oposición", en: "face off in opposition" },
  Cuadratura: { es: "chocan en cuadratura", en: "clash in a square" },
  Trígono: { es: "fluyen en trígono", en: "flow in a trine" },
  Sextil: { es: "se apoyan en sextil", en: "support each other in a sextile" },
};

const BODY_MEANING: Record<string, { es: string; en: string }> = {
  Júpiter: { es: "la expansión y las creencias", en: "expansion and belief" },
  Saturno: { es: "las estructuras y los límites", en: "structure and limits" },
  Urano: { es: "la ruptura y lo imprevisto", en: "rupture and the unforeseen" },
  Neptuno: { es: "la disolución y los ideales", en: "dissolution and ideals" },
  Plutón: { es: "el poder profundo y la transformación", en: "deep power and transformation" },
};

// Velocidad relativa: el cuerpo más lento "manda" la firma.
const SLOWNESS = ["Plutón", "Neptuno", "Urano", "Saturno", "Júpiter"];

function joinList(items: string[], lang: Lang): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  const last = clean[clean.length - 1];
  const head = clean.slice(0, -1).join(", ");
  return `${head} ${lang === "es" ? "y" : "and"} ${last}`;
}

function skyOf(config: MundaneConfiguration, body: string) {
  return config.sky.find((s) => s.name === body) ?? null;
}

/** Signos que comparten modalidad (cardinal/fija/mutable) → los tocados por aspectos duros. */
function modalitySigns(sign: string): string[] {
  const idx = SIGN_NAMES.indexOf(sign as (typeof SIGN_NAMES)[number]);
  if (idx < 0) return [sign];
  const group = idx % 3;
  return SIGN_NAMES.filter((_, i) => i % 3 === group);
}

export function generateMundaneReading(params: {
  config: MundaneConfiguration;
  analogs: MundaneAnalog[];
  natalImpacts: NatalImpact[]; // ya filtrados a esta configuración
  /** Temas globales del período — solo se usan como respaldo si la config no tiene los suyos. */
  themes?: string[];
  year: number;
  natalMode: boolean;
  dateLabel: string; // fecha ya formateada según locale
  lang: Lang;
}): MundaneReading {
  const { config, analogs, natalImpacts, natalMode, dateLabel, lang } = params;
  const themes = config.themes && config.themes.length > 0 ? config.themes : (params.themes ?? []);
  const es = lang === "es";
  const nar = getConfigNarrative(config, lang);
  const paragraphs: string[] = [];

  // ── Párrafo 1: qué ocurre ──
  if (config.kind === "aspect" && config.aspect && config.bodies.length === 2) {
    const [a, b] = config.bodies;
    const sa = skyOf(config, a);
    const sb = skyOf(config, b);
    const action = ASPECT_ACTION[config.aspect]?.[lang] ?? config.aspect.toLowerCase();
    const posA = sa ? `${Math.round(sa.degree_in_sign)}° ${sa.sign}` : a;
    const posB = sb ? `${Math.round(sb.degree_in_sign)}° ${sb.sign}` : b;
    paragraphs.push(
      es
        ? `Hacia el ${dateLabel}, ${a} (${posA}) y ${b} (${posB}) ${action} en el cielo. Es uno de los pulsos de fondo del período.`
        : `Around ${dateLabel}, ${a} (${posA}) and ${b} (${posB}) ${action} in the sky. It is one of the period's background beats.`,
    );
  } else if (config.kind === "ingress" && config.sign && config.bodies.length === 1) {
    const body = config.bodies[0];
    paragraphs.push(
      es
        ? `El ${dateLabel}, ${body} ingresa en ${config.sign} y abre un ciclo largo que no se pisaba en años.`
        : `On ${dateLabel}, ${body} enters ${config.sign}, opening a long cycle unseen for years.`,
    );
  }

  // ── Párrafo 2: significado ──
  if (config.kind === "aspect" && config.bodies.length === 2) {
    const [a, b] = config.bodies;
    const ma = BODY_MEANING[a]?.[lang] ?? a;
    const mb = BODY_MEANING[b]?.[lang] ?? b;
    paragraphs.push(
      es
        ? `Se cruzan ${ma} (${a}) con ${mb} (${b}). ${nar.synthesis}`
        : `${ma} (${a}) crosses with ${mb} (${b}). ${nar.synthesis}`,
    );
  } else {
    paragraphs.push(nar.synthesis);
  }

  // ── Párrafo 3: eco histórico ──
  if (analogs.length > 0) {
    const years = joinList(
      Array.from(new Set(analogs.map((a) => a.date.slice(0, 4)))),
      lang,
    );
    const first = analogs[0];
    const firstTitle = getEventNarrative(first.id, lang).title;
    const isPhase = first.match_type === "phase";
    const phaseNote = isPhase
      ? es
        ? ` (en otra fase del mismo ciclo: ${first.event_aspect ?? ""})`
        : ` (in another phase of the same cycle: ${first.event_aspect ?? ""})`
      : "";
    paragraphs.push(
      es
        ? `Firmas parecidas se vieron en ${years}. Entonces, «${firstTitle}»${phaseNote} marcó la época. Los mundialistas —Cassanya, Barbault, Tarnas— leen estos retornos como ecos temáticos, no como calcos de los mismos hechos.`
        : `Similar signatures appeared in ${years}. Back then, "${firstTitle}"${phaseNote} defined the era. Mundane astrologers —Cassanya, Barbault, Tarnas— read these returns as thematic echoes, not carbon copies of the same events.`,
    );
  }

  // ── Párrafo 4: temas + disclaimer ──
  const themeList = joinList(themes.slice(0, 3).map((t) => getThemeLabel(t, lang).toLowerCase()), lang);
  if (themeList) {
    paragraphs.push(
      es
        ? `En clave analógica suelen activarse temas de ${themeList}. No es un pronóstico de hechos: es el clima simbólico del período.`
        : `Analogically, themes of ${themeList} tend to activate. This is not a forecast of events: it is the period's symbolic climate.`,
    );
  }

  // ── Nota natal / hook de placements ──
  let natalNote = "";
  if (natalMode) {
    if (natalImpacts.length > 0) {
      const items = Array.from(
        new Map(
          natalImpacts
            .slice(0, 5)
            .map((im) => [
              `${im.natal_planet}-${im.aspect}-${im.body}`,
              es
                ? `tu ${im.natal_planet} (${im.aspect.toLowerCase()} de ${im.body})`
                : `your ${im.natal_planet} (${im.body} ${im.aspect.toLowerCase()})`,
            ]),
        ).values(),
      );
      natalNote = es
        ? `En tu carta, esta configuración toca ${joinList(items, lang)}. Ahí es donde el clima del período se vuelve personal.`
        : `In your chart, this configuration touches ${joinList(items, lang)}. That is where the period's climate turns personal.`;
    } else {
      natalNote = es
        ? "Esta configuración no forma aspectos estrechos con tus planetas natales: te alcanza más como parte del clima general."
        : "This configuration forms no tight aspects with your natal planets: it reaches you more as part of the general climate.";
    }
  } else {
    // Modo mundial: hook genérico por grado + signos de la misma cruz.
    const primary =
      config.bodies.slice().sort((a, b) => SLOWNESS.indexOf(a) - SLOWNESS.indexOf(b))[0];
    const sp = skyOf(config, primary);
    if (sp) {
      const d = Math.round(sp.degree_in_sign);
      const lo = Math.max(0, d - 1);
      const hi = Math.min(29, d + 1);
      const signs = joinList(modalitySigns(sp.sign), lang);
      natalNote = es
        ? `Especialmente si tienes planetas alrededor de ${lo}–${hi}° de ${signs}.`
        : `Especially if you have planets around ${lo}–${hi}° of ${signs}.`;
    }
  }

  return { paragraphs, natalNote };
}
