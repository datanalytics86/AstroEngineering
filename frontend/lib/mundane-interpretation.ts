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

import type { MundaneConfiguration, MundaneAnalog, NatalImpact, NationalChartNote } from "./types";
import { SIGN_NAMES } from "./wheel-geometry";
import { getConfigNarrative, getEventNarrative, getThemeLabel, getNationalImpactReading, type Lang } from "./mundane-corpus";
import { getInterpretation, buildInterpretationKey } from "./interpretation-engine";

export interface MundaneReading {
  paragraphs: string[];
  natalNote: string;
}

// Ranking de importancia para elegir el impacto "principal" cuando hay varios.
const IMPORTANCE_RANK: Record<string, number> = { crítica: 4, alta: 3, media: 2, baja: 1 };

/**
 * Construye la clave de interpretation-engine.ts para un impacto natal
 * mundial: "{cuerpo}_{aspecto}_{planeta natal}" en minúsculas, igual que las
 * claves de tránsitos normales (ej. "saturno_trígono_luna").
 */
export function buildImpactInterpretationKey(impact: NatalImpact): string {
  return buildInterpretationKey(impact.body, impact.aspect, impact.natal_planet);
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

const ECLIPSE_TYPE_WORD: Record<string, { es: string; en: string }> = {
  solar: { es: "solar", en: "solar" },
  lunar: { es: "lunar", en: "lunar" },
};

const ECLIPSE_SUBTYPE_WORD: Record<string, { es: string; en: string }> = {
  total: { es: "total", en: "total" },
  anular: { es: "anular", en: "annular" },
  parcial: { es: "parcial", en: "partial" },
  penumbral: { es: "penumbral", en: "penumbral" },
};

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
  /** Modo "impacto por país" (carta nacional en vez de carta personal). */
  countryMode?: boolean;
  countryName?: string;
  nationalChartNote?: NationalChartNote | null;
  dateLabel: string; // fecha ya formateada según locale
  lang: Lang;
  /** Configuración lenta más cercana en el tiempo — solo se usa para disparadores (kind="trigger"). */
  nearbySlowConfig?: { kind: MundaneConfiguration["kind"]; bodies: string[] } | null;
}): MundaneReading {
  const {
    config, analogs, natalImpacts, natalMode, countryMode, countryName, nationalChartNote,
    dateLabel, lang, nearbySlowConfig,
  } = params;
  const themes = config.themes && config.themes.length > 0 ? config.themes : (params.themes ?? []);
  const es = lang === "es";
  const nar = getConfigNarrative(config, lang);
  const paragraphs: string[] = [];
  const isTrigger = config.kind === "trigger";

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
  } else if (isTrigger && config.aspect && config.bodies.length === 2) {
    const slow = config.bodies[1];
    const slowSky = skyOf(config, slow);
    const posSlow = slowSky ? `${Math.round(slowSky.degree_in_sign)}° ${slowSky.sign}` : slow;
    const aspectLower = config.aspect.toLowerCase();
    const windowNote =
      config.window_start && config.window_end
        ? es
          ? ` (ventana: ${config.window_start}–${config.window_end})`
          : ` (window: ${config.window_start}–${config.window_end})`
        : "";
    paragraphs.push(
      es
        ? `El ${dateLabel}, Marte alcanza la ${aspectLower} exacta con ${slow} a ${posSlow} — un disparador rápido del período${windowNote}.`
        : `On ${dateLabel}, Mars reaches the exact ${aspectLower} with ${slow} at ${posSlow} — a fast trigger of the period${windowNote}.`,
    );
  } else if (config.kind === "eclipse" && config.eclipse_type) {
    const sensitiveBody = config.eclipse_type === "lunar" ? "Luna" : "Sol";
    const sensSky = skyOf(config, sensitiveBody);
    const posSens = sensSky ? `${Math.round(sensSky.degree_in_sign)}° ${sensSky.sign}` : (config.sign ?? "");
    const typeWord = ECLIPSE_TYPE_WORD[config.eclipse_type]?.[lang] ?? config.eclipse_type;
    const subtypeWord = config.eclipse_subtype ? ECLIPSE_SUBTYPE_WORD[config.eclipse_subtype]?.[lang] ?? "" : "";
    paragraphs.push(
      es
        ? `El ${dateLabel}, eclipse ${typeWord}${subtypeWord ? ` ${subtypeWord}` : ""} a ${posSens}.`
        : `On ${dateLabel}, a${subtypeWord ? ` ${subtypeWord}` : ""} ${typeWord} eclipse at ${posSens}.`,
    );
  } else if (config.kind === "alignment") {
    const bodyList = joinList(config.bodies, lang);
    const windowNote =
      config.window_start && config.window_end
        ? es
          ? ` (ventana: ${config.window_start}–${config.window_end})`
          : ` (window: ${config.window_start}–${config.window_end})`
        : "";
    paragraphs.push(
      es
        ? `Hacia el ${dateLabel}, ${bodyList} quedan entrelazados en su punto de máxima compacidad conjunta${windowNote}.`
        : `Around ${dateLabel}, ${bodyList} become interlocked at their point of maximum joint compactness${windowNote}.`,
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
  } else if (isTrigger) {
    let synthesis = nar.synthesis;
    synthesis += es
      ? " En la tradición mundana, Marte actúa como un gatillo rápido que activa los ciclos lentos de fondo, sin ser él mismo un ciclo estructural."
      : " In the mundane tradition, Mars acts as a fast trigger that activates the slower background cycles, without being a structural cycle itself.";
    if (nearbySlowConfig) {
      const slowPrimary =
        nearbySlowConfig.bodies.slice().sort((a, b) => SLOWNESS.indexOf(a) - SLOWNESS.indexOf(b))[0] ??
        nearbySlowConfig.bodies[0];
      synthesis += es
        ? ` En esta época actúa sobre el terreno del ciclo de ${slowPrimary} activo en esas fechas.`
        : ` Around this time it acts on the ground of the ${slowPrimary} cycle active in that period.`;
    }
    paragraphs.push(synthesis);
    paragraphs.push(
      es
        ? "Como el resto de este módulo, es una lectura analógica y arquetípica — no una predicción de hechos concretos."
        : "Like the rest of this module, this is an analogical, archetypal reading — not a prediction of concrete events.",
    );
  } else if (config.kind === "eclipse") {
    paragraphs.push(
      es
        ? `${nar.synthesis} Este grado queda "sensibilizado" durante meses: los tránsitos posteriores que lo toquen reactivan su tema.`
        : `${nar.synthesis} This degree stays "sensitized" for months: later transits touching it reactivate its theme.`,
    );
    paragraphs.push(
      es
        ? "Como el resto de este módulo, es una lectura analógica y arquetípica — no una predicción de hechos concretos."
        : "Like the rest of this module, this is an analogical, archetypal reading — not a prediction of concrete events.",
    );
  } else if (config.kind === "alignment") {
    paragraphs.push(nar.synthesis);
    if (config.components && config.components.length > 0) {
      const compList = config.components
        .map((c) => `${c.bodies[0]}–${c.bodies[1]} (${c.aspect.toLowerCase()}, ${c.exact_date})`)
        .join(" · ");
      paragraphs.push(
        es ? `Aspectos que lo componen: ${compList}.` : `Component aspects: ${compList}.`,
      );
    }
    if (config.alignment_degree != null) {
      paragraphs.push(
        es
          ? `Los cuerpos involucrados quedan cerca de un grado sensible común: ~${config.alignment_degree.toFixed(1)}° de los signos respectivos.`
          : `The bodies involved sit close to a shared sensitive degree: ~${config.alignment_degree.toFixed(1)}° of their respective signs.`,
      );
    }
    paragraphs.push(
      es
        ? "Como el resto de este módulo, es una lectura analógica y arquetípica — no una predicción de hechos concretos."
        : "Like the rest of this module, this is an analogical, archetypal reading — not a prediction of concrete events.",
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

  // ── Nota natal / hook de placements / lectura nacional ──
  let natalNote = "";
  const isEclipse = config.kind === "eclipse";
  if (countryMode) {
    if (natalImpacts.length > 0) {
      natalNote = natalImpacts.slice(0, 4).map((im) => getNationalImpactReading(im, lang)).join(" ");
    } else {
      natalNote = es
        ? `Esta configuración no forma aspectos estrechos con la carta nacional${countryName ? ` de ${countryName}` : ""}.`
        : `This configuration forms no tight aspects with${countryName ? ` ${countryName}'s` : " this"} national chart.`;
    }
    if (nationalChartNote) {
      natalNote += ` ${nationalChartNote[lang]}`;
    }
    natalNote += es
      ? " Lectura arquetípica de astrología mundial — no una predicción de hechos concretos sobre el país."
      : " An archetypal mundane-astrology reading — not a prediction of concrete events for the country.";
  } else if (natalMode) {
    if (natalImpacts.length > 0) {
      if (isEclipse) {
        // Los eclipses sobre planetas natales son el clásico "año marcado" de
        // la tradición mundana: frase propia en vez del fraseo genérico de aspecto.
        const items = Array.from(
          new Map(
            natalImpacts
              .slice(0, 5)
              .map((im) => [
                `${im.natal_planet}-${im.aspect}`,
                es
                  ? `tu ${im.natal_planet} (${im.aspect.toLowerCase()})`
                  : `your ${im.natal_planet} (${im.aspect.toLowerCase()})`,
              ]),
          ).values(),
        );
        natalNote = es
          ? `El eclipse cae sobre ${joinList(items, lang)} — el clásico "año marcado" que señala la tradición mundana.`
          : `The eclipse falls on ${joinList(items, lang)} — the classic "marked year" that mundane tradition points to.`;
      } else {
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
      }

      // Si el impacto principal (mayor importancia) tiene interpretación en el
      // motor de tránsitos existente, añadimos una frase de su `summary` —
      // reusa las ~270 interpretaciones ya escritas en vez de duplicar texto.
      const mainImpact = [...natalImpacts].sort(
        (a, b) => (IMPORTANCE_RANK[b.importance] ?? 0) - (IMPORTANCE_RANK[a.importance] ?? 0),
      )[0];
      if (mainImpact) {
        const interp = getInterpretation(buildImpactInterpretationKey(mainImpact), lang);
        if (interp) {
          natalNote += ` ${interp.summary}`;
        }
      }
    } else {
      natalNote = es
        ? "Esta configuración no forma aspectos estrechos con tus planetas natales: te alcanza más como parte del clima general."
        : "This configuration forms no tight aspects with your natal planets: it reaches you more as part of the general climate.";
    }
  } else {
    // Modo mundial: hook genérico por grado + signos de la misma cruz.
    // En disparadores, bodies[0] es siempre "Marte": el protagonista es el lento.
    // En eclipses, el punto sensible es el Sol (solar) o la Luna (lunar).
    const primary = isTrigger
      ? config.bodies[1] ?? config.bodies[0]
      : isEclipse
        ? (config.eclipse_type === "lunar" ? "Luna" : "Sol")
        : config.bodies.slice().sort((a, b) => SLOWNESS.indexOf(a) - SLOWNESS.indexOf(b))[0];
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
