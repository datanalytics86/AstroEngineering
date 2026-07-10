/**
 * Corpus bilingüe (ES/EN) del calendario astrológico diario. Framing
 * analógico de "clima del día" — tono ligero, sin predicciones factuales.
 * Reutiliza retro-meanings.ts (estaciones), mundane-corpus.ts (eclipses,
 * arquetipos de disparadores Marte-lento) para no duplicar corpus existente.
 */

import { SIGN_ELEMENT, type Element } from "./zodiac-utils";
import { getRetroMeaning } from "./retro-meanings";
import { getEclipseNarrative } from "./mundane-corpus";
import type { Lang } from "./retro-meanings";
import type { CalendarEvent, EclipseType, EclipseSubtype } from "./types";

interface Bilingual {
  es: string;
  en: string;
}

// ── Luna en signo: clima emocional cotidiano del día ────────────────────────

export const LUNA_EN_SIGNO: Record<string, Bilingual> = {
  Aries: {
    es: "La Luna en Aries acelera el pulso del día: ganas de actuar ya, poca paciencia para rodeos. Buen día para iniciar, no tanto para negociar con calma.",
    en: "Moon in Aries quickens the day's pace: an urge to act now, little patience for detours. Good for starting things, less so for calm negotiation.",
  },
  Tauro: {
    es: "La Luna en Tauro pide ritmo pausado y placeres simples: comida, cuerpo, naturaleza. Un día para consolidar en vez de apurar.",
    en: "Moon in Taurus asks for a slower pace and simple pleasures: food, body, nature. A day to consolidate rather than rush.",
  },
  "Géminis": {
    es: "La Luna en Géminis dispara la curiosidad y las conversaciones cruzadas: mensajes, trámites, ideas que van y vienen. Mente ágil, foco disperso.",
    en: "Moon in Gemini sparks curiosity and crossed conversations: messages, errands, ideas coming and going. Agile mind, scattered focus.",
  },
  "Cáncer": {
    es: "La Luna en Cáncer vuelve el ánimo más sensible y hogareño: ganas de cuidar y ser cuidado, memoria emocional a flor de piel.",
    en: "Moon in Cancer makes the mood more sensitive and home-focused: a wish to care and be cared for, emotional memory close to the surface.",
  },
  Leo: {
    es: "La Luna en Leo pide brillo y reconocimiento: el ánimo se anima con lo lúdico, lo creativo, lo que se muestra. Orgullo a flor de piel.",
    en: "Moon in Leo asks for shine and recognition: mood lifts with play, creativity, self-expression. Pride runs close to the surface.",
  },
  Virgo: {
    es: "La Luna en Virgo afina el detalle: ganas de ordenar, revisar, cuidar la rutina y la salud. Día práctico, algo autocrítico.",
    en: "Moon in Virgo sharpens the details: an urge to tidy, review, tend to routine and health. Practical day, a touch self-critical.",
  },
  Libra: {
    es: "La Luna en Libra busca equilibrio y compañía: el ánimo se orienta a acuerdos, estética y vínculos. Incomodidad ante el conflicto directo.",
    en: "Moon in Libra seeks balance and company: mood turns toward agreements, aesthetics and bonds. Discomfort with direct conflict.",
  },
  Escorpio: {
    es: "La Luna en Escorpio intensifica todo: menos charla superficial, más ganas de ir al fondo de las cosas. Emociones concentradas.",
    en: "Moon in Scorpio intensifies everything: less small talk, more of a pull to get to the bottom of things. Concentrated emotions.",
  },
  Sagitario: {
    es: "La Luna en Sagitario abre el horizonte: ganas de moverse, aprender, opinar con entusiasmo. Ánimo optimista, poco detallista.",
    en: "Moon in Sagittarius opens the horizon: an urge to move, learn, speak up with enthusiasm. Optimistic mood, light on detail.",
  },
  Capricornio: {
    es: "La Luna en Capricornio pone el foco en lo serio y lo pendiente: responsabilidad, estructura, resultados tangibles. Ánimo contenido.",
    en: "Moon in Capricorn puts the focus on the serious and the unfinished: responsibility, structure, tangible results. Restrained mood.",
  },
  Acuario: {
    es: "La Luna en Acuario distancia un poco lo emocional y activa lo colectivo: ideas, grupos, ganas de romper la rutina.",
    en: "Moon in Aquarius steps back a little from the emotional and activates the collective: ideas, groups, a wish to break routine.",
  },
  Piscis: {
    es: "La Luna en Piscis difumina los bordes: intuición, sensibilidad artística, ganas de soñar despierto. Día poco apto para decisiones frías.",
    en: "Moon in Pisces blurs the edges: intuition, artistic sensitivity, a wish to daydream. Not the best day for cold decisions.",
  },
};

export function getMoonSignReading(sign: string, lang: Lang): string {
  return LUNA_EN_SIGNO[sign]?.[lang] ?? "";
}

// ── Fase lunar ───────────────────────────────────────────────────────────────

export const FASE_LUNAR: Record<string, Bilingual & { title: Bilingual }> = {
  nueva: {
    title: { es: "Luna nueva", en: "New Moon" },
    es: "Cierre de un ciclo y semilla del siguiente: buen momento simbólico para poner una intención nueva, aunque los resultados tardarán en verse.",
    en: "The close of one cycle and the seed of the next: a symbolic moment for setting a new intention, even if results take time to show.",
  },
  creciente: {
    title: { es: "Cuarto creciente", en: "First Quarter" },
    es: "Impulso y primera fricción: lo que se sembró en la Luna nueva empieza a chocar con la realidad y pide ajuste, no abandono.",
    en: "Momentum and first friction: what was planted at the New Moon starts meeting resistance, calling for adjustment rather than giving up.",
  },
  llena: {
    title: { es: "Luna llena", en: "Full Moon" },
    es: "Culminación e iluminación: lo que estaba en marcha se hace visible, con toda su claridad y su tensión emocional.",
    en: "Culmination and illumination: what was underway becomes visible, with all its clarity and its emotional charge.",
  },
  menguante: {
    title: { es: "Cuarto menguante", en: "Last Quarter" },
    es: "Cierre y liberación: buen momento simbólico para soltar lo que ya cumplió su función antes de que empiece un ciclo nuevo.",
    en: "Closure and release: a symbolic moment to let go of what has served its purpose before a new cycle begins.",
  },
};

export function getMoonPhaseReading(phase: string, lang: Lang): { title: string; text: string } {
  const entry = FASE_LUNAR[phase];
  if (!entry) return { title: phase, text: "" };
  return { title: entry.title[lang], text: entry[lang] };
}

// ── Ingreso de planeta rápido × elemento del signo de destino ───────────────

const INGRESO_RAPIDO: Record<string, Record<Element, Bilingual>> = {
  Sol: {
    fuego: {
      es: "El Sol entra en signo de fuego: la identidad se vuelve más directa, impulsiva y expresiva durante las próximas semanas.",
      en: "The Sun enters a fire sign: identity turns more direct, impulsive and expressive over the coming weeks.",
    },
    tierra: {
      es: "El Sol entra en signo de tierra: la identidad se vuelve más práctica y orientada a lo tangible durante las próximas semanas.",
      en: "The Sun enters an earth sign: identity turns more practical and results-oriented over the coming weeks.",
    },
    aire: {
      es: "El Sol entra en signo de aire: la identidad se vuelve más social e intelectual durante las próximas semanas.",
      en: "The Sun enters an air sign: identity turns more social and intellectual over the coming weeks.",
    },
    agua: {
      es: "El Sol entra en signo de agua: la identidad se vuelve más sensible y emocional durante las próximas semanas.",
      en: "The Sun enters a water sign: identity turns more sensitive and emotional over the coming weeks.",
    },
  },
  Mercurio: {
    fuego: {
      es: "Mercurio entra en signo de fuego: la mente se vuelve rápida y directa, con ganas de hablar y decidir sin muchos rodeos.",
      en: "Mercury enters a fire sign: the mind turns fast and direct, eager to speak and decide without much detour.",
    },
    tierra: {
      es: "Mercurio entra en signo de tierra: la mente se vuelve práctica y metódica, con foco en lo concreto y verificable.",
      en: "Mercury enters an earth sign: the mind turns practical and methodical, focused on the concrete and verifiable.",
    },
    aire: {
      es: "Mercurio entra en signo de aire: la mente se vuelve ágil y sociable, con ganas de conversar, conectar ideas y circular información.",
      en: "Mercury enters an air sign: the mind turns agile and sociable, eager to converse, connect ideas and circulate information.",
    },
    agua: {
      es: "Mercurio entra en signo de agua: la mente se vuelve intuitiva, la comunicación se llena de matices emocionales antes que datos fríos.",
      en: "Mercury enters a water sign: the mind turns intuitive, communication fills with emotional nuance rather than cold data.",
    },
  },
  Venus: {
    fuego: {
      es: "Venus entra en signo de fuego: el afecto se vuelve más apasionado, espontáneo y expresivo.",
      en: "Venus enters a fire sign: affection turns more passionate, spontaneous and expressive.",
    },
    tierra: {
      es: "Venus entra en signo de tierra: el afecto se vuelve más estable, sensorial y orientado a lo duradero.",
      en: "Venus enters an earth sign: affection turns more stable, sensory and oriented toward what lasts.",
    },
    aire: {
      es: "Venus entra en signo de aire: el afecto se vuelve más social y liviano, con foco en la conversación y el equilibrio.",
      en: "Venus enters an air sign: affection turns more social and light, focused on conversation and balance.",
    },
    agua: {
      es: "Venus entra en signo de agua: el afecto se vuelve más profundo y sensible, con necesidad de intimidad emocional.",
      en: "Venus enters a water sign: affection turns deeper and more sensitive, with a need for emotional intimacy.",
    },
  },
  Marte: {
    fuego: {
      es: "Marte entra en signo de fuego: el impulso de acción se vuelve directo y enérgico, con poca tolerancia a esperar.",
      en: "Mars enters a fire sign: the drive to act turns direct and energetic, with little patience for waiting.",
    },
    tierra: {
      es: "Marte entra en signo de tierra: el impulso de acción se vuelve constante y orientado a resultados concretos.",
      en: "Mars enters an earth sign: the drive to act turns steady and focused on concrete results.",
    },
    aire: {
      es: "Marte entra en signo de aire: el impulso de acción se canaliza en ideas, debate y estrategia antes que en la fuerza bruta.",
      en: "Mars enters an air sign: the drive to act channels into ideas, debate and strategy rather than brute force.",
    },
    agua: {
      es: "Marte entra en signo de agua: el impulso de acción se vuelve más indirecto y emocional, con energía que se mueve por intuición.",
      en: "Mars enters a water sign: the drive to act turns more indirect and emotional, moved by intuition.",
    },
  },
};

export function getIngressReading(body: string, sign: string, lang: Lang): string {
  const element = SIGN_ELEMENT[sign];
  if (body === "Luna") {
    return getMoonSignReading(sign, lang);
  }
  const table = INGRESO_RAPIDO[body];
  if (!table || !element) return "";
  return table[element]?.[lang] ?? "";
}

// ── Estaciones (Mercurio/Venus/Marte) ───────────────────────────────────────

const STATION_DIRECT_GENERIC: Bilingual = {
  es: "recupera su marcha directa: la energía retenida durante la retrogradación vuelve a fluir hacia afuera con más claridad.",
  en: "resumes direct motion: energy held back during the retrograde starts flowing outward again with more clarity.",
};

export function getStationReading(body: string, station: "retrograde" | "direct", lang: Lang): { title: string; text: string } {
  const meaning = getRetroMeaning(body, lang);
  if (station === "retrograde") {
    return {
      title: meaning?.title ?? body,
      text: meaning?.meaning ?? "",
    };
  }
  return {
    title: lang === "es" ? `${body} directo` : `${body} direct`,
    text: `${body} ${STATION_DIRECT_GENERIC[lang]}`,
  };
}

// ── Aspectos rápido–lento / rápido–rápido: composición de arquetipos ───────

const BODY_ARCHETYPE: Record<string, Bilingual> = {
  Sol: { es: "la identidad y la vitalidad", en: "identity and vitality" },
  Mercurio: { es: "la mente y la comunicación", en: "the mind and communication" },
  Venus: { es: "el afecto y los valores", en: "affection and values" },
  Marte: { es: "el impulso de acción", en: "the drive to act" },
  "Júpiter": { es: "la expansión y la confianza", en: "expansion and confidence" },
  Saturno: { es: "la estructura y el límite", en: "structure and limit" },
  Urano: { es: "lo imprevisto y el cambio", en: "the unforeseen and change" },
  Neptuno: { es: "lo ideal y lo difuso", en: "the ideal and the diffuse" },
  "Plutón": { es: "la intensidad y la transformación", en: "intensity and transformation" },
};

const HARMONIOUS = new Set(["Trígono", "Sextil"]);
const TENSE = new Set(["Cuadratura", "Oposición"]);

export function getAspectReading(bodies: [string, string], aspect: string, lang: Lang): { title: string; text: string } {
  const [b1, b2] = bodies;
  const title = lang === "es" ? `${b1} en ${aspect.toLowerCase()} con ${b2}` : `${b1} ${aspect.toLowerCase()} ${b2}`;
  const a1 = BODY_ARCHETYPE[b1]?.[lang] ?? b1;
  const a2 = BODY_ARCHETYPE[b2]?.[lang] ?? b2;
  let bridge: string;
  if (HARMONIOUS.has(aspect)) {
    bridge = lang === "es" ? "encuentra sintonía y fluidez con" : "finds ease and flow with";
  } else if (TENSE.has(aspect)) {
    bridge = lang === "es" ? "entra en fricción productiva con" : "meets productive friction with";
  } else {
    bridge = lang === "es" ? "se funde por un momento con" : "briefly merges with";
  }
  const text = lang === "es"
    ? `Hoy ${a1} ${bridge} ${a2}. Un tono del día más que un hecho: úsalo como clima, no como pronóstico.`
    : `Today ${a1} ${bridge} ${a2}. A tone for the day rather than an event: read it as weather, not forecast.`;
  return { title, text };
}

// ── Eclipses: reusa getEclipseNarrative de mundane-corpus.ts ───────────────

export function getCalendarEclipseReading(
  eclipseType: EclipseType | null | undefined,
  eclipseSubtype: EclipseSubtype | null | undefined,
  sign: string | null | undefined,
  lang: Lang,
): { title: string; text: string } {
  const narrative = getEclipseNarrative(
    { eclipse_type: eclipseType, eclipse_subtype: eclipseSubtype, sign },
    lang,
  );
  return { title: narrative.title, text: narrative.synthesis };
}

// ── Tránsitos rápidos (posición del día, no evento puntual) ────────────────
// Composición: arquetipo del planeta × tono corto del signo de destino.
// Para la Luna se reusa LUNA_EN_SIGNO (ya curada, un texto completo por signo).

const FAST_ARCHETYPE: Record<string, Bilingual> = {
  Sol: { es: "la vitalidad y el foco", en: "vitality and focus" },
  Mercurio: { es: "la mente y la comunicación", en: "the mind and communication" },
  Venus: { es: "los vínculos y los valores", en: "bonds and values" },
  Marte: { es: "la acción y el impulso", en: "action and drive" },
};

const SIGN_TONE: Record<string, Bilingual> = {
  Aries: { es: "toma un tono directo e impaciente", en: "takes on a direct, impatient tone" },
  Tauro: { es: "se vuelve más pausada y sensorial", en: "turns slower and more sensory" },
  "Géminis": { es: "se dispersa en varias direcciones a la vez", en: "scatters in several directions at once" },
  "Cáncer": { es: "se vuelve más sensible y protectora", en: "turns more sensitive and protective" },
  Leo: { es: "busca brillar y ser vista", en: "seeks to shine and be seen" },
  Virgo: { es: "se afina en el detalle y lo práctico", en: "sharpens around detail and the practical" },
  Libra: { es: "busca equilibrio y acuerdo con el otro", en: "seeks balance and agreement with others" },
  Escorpio: { es: "se intensifica y va al fondo de las cosas", en: "intensifies and digs beneath the surface" },
  Sagitario: { es: "se abre al horizonte y al entusiasmo", en: "opens toward the horizon and enthusiasm" },
  Capricornio: { es: "se vuelve seria y orientada a resultados", en: "turns serious and results-oriented" },
  Acuario: { es: "se distancia un poco y mira lo colectivo", en: "steps back a little and looks to the collective" },
  Piscis: { es: "difumina bordes y se vuelve intuitiva", en: "blurs edges and turns intuitive" },
};

export function getFastTransitReading(body: string, sign: string, lang: Lang): string {
  if (body === "Luna") return getMoonSignReading(sign, lang);
  const archetype = FAST_ARCHETYPE[body]?.[lang];
  const tone = SIGN_TONE[sign]?.[lang];
  if (!archetype || !tone) return "";
  return lang === "es"
    ? `${body} en ${sign}: ${archetype} ${tone}.`
    : `${body} in ${sign}: ${archetype} ${tone}.`;
}

// ── Tránsitos lentos (telón de fondo del mes/época) ─────────────────────────
// Textos curados para los placements vigentes 2026-2027 (tono mundano-
// generacional, coherente con /geopolitica), más generador de respaldo por
// elemento del signo para cualquier otro placement.

const SLOW_CURATED: Record<string, Bilingual> = {
  "Júpiter|Cáncer": {
    es: "Júpiter en Cáncer expande lo que da cobijo: familia, raíces, memoria colectiva y pertenencia. Clima de crecimiento hacia adentro más que hacia afuera.",
    en: "Jupiter in Cancer expands what shelters us: family, roots, collective memory and belonging. A climate of growth turned inward rather than outward.",
  },
  "Júpiter|Leo": {
    es: "Júpiter en Leo expande la creatividad, el liderazgo y la necesidad de expresión personal. Clima de confianza y ganas de ocupar más espacio.",
    en: "Jupiter in Leo expands creativity, leadership and the need for personal expression. A climate of confidence and a wish to take up more room.",
  },
  "Saturno|Aries": {
    es: "Saturno en Aries pone estructura y límite a la iniciativa y la acción individual: aprender a sostener el impulso con disciplina, no solo con arranque.",
    en: "Saturn in Aries brings structure and limit to individual initiative and action: learning to sustain drive with discipline, not just a burst of will.",
  },
  "Saturno|Piscis": {
    es: "Saturno en Piscis pide estructura para lo intangible: límites concretos a lo espiritual, lo artístico y lo colectivo difuso.",
    en: "Saturn in Pisces asks for structure around the intangible: concrete limits placed on the spiritual, the artistic and the diffusely collective.",
  },
  "Urano|Tauro": {
    es: "Urano en Tauro sacude lo que parecía estable: dinero, recursos, tierra, cuerpo. Cambios imprevistos en lo que se creía permanente.",
    en: "Uranus in Taurus shakes what seemed stable: money, resources, land, the body. Unforeseen change in what was assumed permanent.",
  },
  "Urano|Géminis": {
    es: "Urano en Géminis acelera y descentraliza la información: nuevas formas de comunicar, aprender y conectar ideas, con más ruptura que continuidad.",
    en: "Uranus in Gemini speeds up and decentralizes information: new ways of communicating, learning and connecting ideas, with more rupture than continuity.",
  },
  "Neptuno|Piscis": {
    es: "Neptuno en su propio signo disuelve fronteras: imaginación, espiritualidad y confusión colectiva en su expresión más pura.",
    en: "Neptune in its own sign dissolves boundaries: imagination, spirituality and collective confusion in their purest expression.",
  },
  "Neptuno|Aries": {
    es: "Neptuno en Aries idealiza la acción y el impulso individual: causas, líderes y guerras se visten de ideal antes que de estrategia concreta.",
    en: "Neptune in Aries idealizes action and individual drive: causes, leaders and conflicts get dressed in ideals rather than concrete strategy.",
  },
  "Plutón|Acuario": {
    es: "Plutón en Acuario transforma lo colectivo: tecnología, redes, instituciones y el propio concepto de comunidad se reescriben en profundidad.",
    en: "Pluto in Aquarius transforms the collective: technology, networks, institutions and the very concept of community are being rewritten at depth.",
  },
};

const SLOW_ARCHETYPE: Record<string, Bilingual> = {
  "Júpiter": { es: "expande y da confianza a", en: "expands and lends confidence to" },
  Saturno: { es: "estructura y pone límite a", en: "structures and sets limits on" },
  Urano: { es: "sacude e innova en", en: "shakes up and innovates within" },
  Neptuno: { es: "disuelve fronteras e idealiza", en: "dissolves boundaries and idealizes" },
  "Plutón": { es: "transforma en profundidad", en: "transforms at depth" },
};

const ELEMENT_TONE: Record<Element, Bilingual> = {
  fuego: { es: "el ámbito de la iniciativa y la acción colectiva", en: "the realm of initiative and collective action" },
  tierra: { es: "el ámbito de los recursos y las estructuras concretas", en: "the realm of resources and concrete structures" },
  aire: { es: "el ámbito de las ideas y los vínculos sociales", en: "the realm of ideas and social bonds" },
  agua: { es: "el ámbito emocional y colectivo", en: "the emotional and collective realm" },
};

export function getSlowTransitReading(body: string, sign: string, lang: Lang): string {
  const curated = SLOW_CURATED[`${body}|${sign}`];
  if (curated) return curated[lang];
  const archetype = SLOW_ARCHETYPE[body]?.[lang];
  const element = SIGN_ELEMENT[sign];
  const tone = element ? ELEMENT_TONE[element]?.[lang] : undefined;
  if (!archetype || !tone) return "";
  return lang === "es"
    ? `${body} en ${sign} ${archetype} ${tone}. Clima de fondo de la época, cambia cada varios años.`
    : `${body} in ${sign} ${archetype} ${tone}. A background climate of the era, shifting every several years.`;
}

// ── Despacho por tipo de evento ─────────────────────────────────────────────

export function getEventReading(event: CalendarEvent, lang: Lang): { title: string; text: string } {
  switch (event.type) {
    case "ingress": {
      const text = getIngressReading(event.body ?? "", event.sign ?? "", lang);
      const title = lang === "es"
        ? `${event.body} ingresa en ${event.sign}`
        : `${event.body} enters ${event.sign}`;
      return { title, text };
    }
    case "moon_phase":
      return getMoonPhaseReading(event.phase ?? "", lang);
    case "station":
      return getStationReading(event.body ?? "", event.station === "direct" ? "direct" : "retrograde", lang);
    case "aspect": {
      const bodies = (event.bodies ?? ["", ""]) as [string, string];
      return getAspectReading(bodies, event.aspect ?? "", lang);
    }
    case "eclipse":
      return getCalendarEclipseReading(event.eclipse_type, event.eclipse_subtype, event.sign, lang);
    default:
      return { title: "", text: "" };
  }
}
