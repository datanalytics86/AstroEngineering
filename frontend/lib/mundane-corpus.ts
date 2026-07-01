/**
 * Corpus interpretativo bilingüe (ES/EN) para el módulo de astrología mundial.
 *
 * IMPORTANTE — INTEGRIDAD:
 * Esto es analogía cíclica interpretativa, NO predicción factual. La atribución
 * bibliográfica (Cassanya, Barbault, Tarnas) es temática/metodológica: NO contiene
 * citas textuales ni números de página. Sigue el patrón de interpretation-engine.ts:
 * datos keyed + getters con `lang`.
 *
 * Las claves de `EVENT_NARRATIVES` coinciden con los `id` de HISTORICAL_EVENTS en
 * backend/astro/mundane.py. `getConfigNarrative` usa la firma astrológica y cae en
 * un generador compositivo cuando no hay texto curado.
 */

export type Lang = "es" | "en";

interface Bilingual {
  es: string;
  en: string;
}

interface EventEntry {
  title: Bilingual;
  description: Bilingual;
  source: Bilingual;
}

interface ConfigEntry {
  title: Bilingual;
  theme: Bilingual;
  synthesis: Bilingual;
}

// ── Etiquetas de temas (slugs → bilingüe) ──────────────────────────────────────
export const THEME_LABELS: Record<string, Bilingual> = {
  fin_de_ciclo: { es: "Fin de ciclo", en: "End of a cycle" },
  cambio_de_era: { es: "Cambio de era", en: "Change of era" },
  colapso_de_estructuras: { es: "Colapso de estructuras", en: "Collapse of structures" },
  disolucion_de_estructuras: { es: "Disolución de estructuras", en: "Dissolution of structures" },
  disolucion_de_fronteras: { es: "Disolución de fronteras", en: "Dissolution of borders" },
  fin_de_ciclo_ideologico: { es: "Fin de ciclo ideológico", en: "End of an ideological cycle" },
  utopias_colectivas: { es: "Utopías colectivas", en: "Collective utopias" },
  revolucion_ideologica: { es: "Revolución ideológica", en: "Ideological revolution" },
  reunificacion: { es: "Reunificación", en: "Reunification" },
  nacimiento_de_naciones: { es: "Nacimiento de naciones", en: "Birth of nations" },
  ideales_de_libertad: { es: "Ideales de libertad", en: "Ideals of freedom" },
  ruptura_con_el_pasado: { es: "Ruptura con el pasado", en: "Break with the past" },
  poder_colectivo: { es: "Poder colectivo", en: "Collective power" },
  conflicto_global: { es: "Conflicto global", en: "Global conflict" },
  innovacion_tecnologica: { es: "Innovación tecnológica", en: "Technological innovation" },
  ruptura_de_alianzas: { es: "Ruptura de alianzas", en: "Breaking of alliances" },
  disrupcion_irreversible: { es: "Disrupción irreversible", en: "Irreversible disruption" },
  nueva_era: { es: "Nueva era", en: "New era" },
  fractura_nacional: { es: "Fractura nacional", en: "National fracture" },
  idealismo_en_conflicto: { es: "Idealismo en conflicto", en: "Idealism in conflict" },
  redefinicion_de_identidad: { es: "Redefinición de identidad", en: "Redefinition of identity" },
  nacionalismo_emergente: { es: "Nacionalismo emergente", en: "Emerging nationalism" },
  reestructuracion_social: { es: "Reestructuración social", en: "Social restructuring" },
  nuevo_ciclo_de_20_anos: { es: "Nuevo ciclo de 20 años", en: "New 20-year cycle" },
  crisis_economica: { es: "Crisis económica", en: "Economic crisis" },
  ruptura_brusca: { es: "Ruptura brusca", en: "Abrupt rupture" },
  crisis_de_poder: { es: "Crisis de poder", en: "Crisis of power" },
  tension_extrema: { es: "Tensión extrema", en: "Extreme tension" },
  umbral_de_colapso: { es: "Umbral de colapso", en: "Threshold of collapse" },
  exceso_y_correccion: { es: "Exceso y corrección", en: "Excess and correction" },
};

export function getThemeLabel(slug: string, lang: Lang): string {
  return THEME_LABELS[slug]?.[lang] ?? slug.replace(/_/g, " ");
}

// ── Fuentes bibliográficas ─────────────────────────────────────────────────────
const SRC_CASSANYA: Bilingual = {
  es: "Tradición mundialista — V. Cassanya, «Crónica Astrológica del Siglo XX»",
  en: "Mundane tradition — V. Cassanya, \"Crónica Astrológica del Siglo XX\"",
};
const SRC_BARBAULT: Bilingual = {
  es: "Ciclos planetarios — André Barbault (índice cíclico)",
  en: "Planetary cycles — André Barbault (cyclic index)",
};
const SRC_TARNAS: Bilingual = {
  es: "Correlaciones históricas — Richard Tarnas, «Cosmos and Psyche»",
  en: "Historical correlations — Richard Tarnas, \"Cosmos and Psyche\"",
};

export const BIBLIOGRAPHY: Bilingual[] = [SRC_CASSANYA, SRC_BARBAULT, SRC_TARNAS];

// ── Narrativa de eventos históricos (keyed por id de backend) ──────────────────
const EVENT_NARRATIVES: Record<string, EventEntry> = {
  constantinopla_1453: {
    title: { es: "Caída de Constantinopla", en: "Fall of Constantinople" },
    description: {
      es: "El fin del Imperio Bizantino y el cierre simbólico de la Edad Media. Un umbral entre eras bajo la contracción saturnina y la ruptura uraniana.",
      en: "The end of the Byzantine Empire and the symbolic close of the Middle Ages. A threshold between eras under Saturnine contraction and Uranian rupture.",
    },
    source: SRC_TARNAS,
  },
  revolucion_rusa_1917: {
    title: { es: "Revolución Rusa", en: "Russian Revolution" },
    description: {
      es: "El derrumbe del orden zarista y el ascenso de una utopía colectiva. La conjunción Saturno-Neptuno disuelve estructuras y funde ideología con Estado.",
      en: "The collapse of the tsarist order and the rise of a collective utopia. The Saturn-Neptune conjunction dissolves structures and fuses ideology with the State.",
    },
    source: SRC_CASSANYA,
  },
  muro_berlin_1989: {
    title: { es: "Caída del Muro de Berlín", en: "Fall of the Berlin Wall" },
    description: {
      es: "La disolución de una frontera y del bloque soviético. Saturno-Neptuno vuelve a marcar el fin de un ciclo ideológico y la reunificación.",
      en: "The dissolution of a border and of the Soviet bloc. Saturn-Neptune again marks the end of an ideological cycle and reunification.",
    },
    source: SRC_CASSANYA,
  },
  independencia_eeuu_1776: {
    title: { es: "Independencia de EE.UU.", en: "U.S. Independence" },
    description: {
      es: "El nacimiento de una nación sobre ideales de libertad. Plutón en Acuario: el poder se redistribuye hacia el pueblo y sus principios.",
      en: "The birth of a nation upon ideals of liberty. Pluto in Aquarius: power redistributes toward the people and their principles.",
    },
    source: SRC_TARNAS,
  },
  revolucion_francesa_1789: {
    title: { es: "Revolución Francesa", en: "French Revolution" },
    description: {
      es: "El fin del Antiguo Régimen y la irrupción del poder colectivo. Plutón en Acuario transforma de raíz la relación entre pueblo y autoridad.",
      en: "The end of the Ancien Régime and the eruption of collective power. Pluto in Aquarius radically transforms the relation between people and authority.",
    },
    source: SRC_TARNAS,
  },
  segunda_guerra_mundial_1942: {
    title: { es: "II Guerra Mundial", en: "World War II" },
    description: {
      es: "El conflicto global en su apogeo y una carrera tecnológica sin freno. Urano en Géminis dispara la guerra de la información, el transporte y las comunicaciones.",
      en: "Global conflict at its peak and an unchecked technological race. Uranus in Gemini ignites the war of information, transport, and communications.",
    },
    source: SRC_CASSANYA,
  },
  bomba_atomica_1945: {
    title: { es: "Era atómica", en: "Atomic age" },
    description: {
      es: "Una disrupción tecnológica irreversible que redefine el poder mundial. Urano en Géminis: el intelecto humano cruza un umbral sin retorno.",
      en: "An irreversible technological disruption that redefines world power. Uranus in Gemini: the human intellect crosses a point of no return.",
    },
    source: SRC_CASSANYA,
  },
  guerra_civil_eeuu_1861: {
    title: { es: "Guerra Civil de EE.UU.", en: "U.S. Civil War" },
    description: {
      es: "Una fractura nacional y una identidad en disputa. Neptuno en Aries enciende ideales enfrentados y una redefinición del país.",
      en: "A national fracture and an identity in dispute. Neptune in Aries ignites clashing ideals and a redefinition of the country.",
    },
    source: SRC_TARNAS,
  },
  unificacion_alemania_1871: {
    title: { es: "Unificación de Alemania", en: "Unification of Germany" },
    description: {
      es: "El nacionalismo emergente cristaliza un nuevo Estado. Neptuno en Aries funde un ideal colectivo con la voluntad de forjar una nación.",
      en: "Emerging nationalism crystallizes a new State. Neptune in Aries fuses a collective ideal with the will to forge a nation.",
    },
    source: SRC_TARNAS,
  },
  gran_conjuncion_2020: {
    title: { es: "Gran Conjunción de 2020", en: "Great Conjunction of 2020" },
    description: {
      es: "El inicio de un ciclo Júpiter-Saturno de ~20 años en signo de aire: una reestructuración social hacia lo tecnológico y lo colectivo.",
      en: "The start of a ~20-year Jupiter-Saturn cycle in an air sign: a social restructuring toward the technological and the collective.",
    },
    source: SRC_BARBAULT,
  },
  crisis_1929: {
    title: { es: "Crac de 1929", en: "Crash of 1929" },
    description: {
      es: "El colapso económico global. La cuadratura Saturno-Urano quiebra bruscamente estructuras que parecían sólidas.",
      en: "The global economic collapse. The Saturn-Uranus square abruptly breaks structures that seemed solid.",
    },
    source: SRC_CASSANYA,
  },
  crisis_misiles_cuba_1962: {
    title: { es: "Crisis de los misiles de Cuba", en: "Cuban Missile Crisis" },
    description: {
      es: "El mundo al borde del colapso. La cuadratura Saturno-Plutón lleva la tensión de poder a su umbral máximo.",
      en: "The world on the brink of collapse. The Saturn-Pluto square brings the power tension to its maximum threshold.",
    },
    source: SRC_BARBAULT,
  },
  caida_urss_1991: {
    title: { es: "Disolución de la URSS", en: "Dissolution of the USSR" },
    description: {
      es: "El fin de un ciclo ideológico y de un imperio. Urano ingresa en Capricornio y reestructura el orden geopolítico.",
      en: "The end of an ideological cycle and of an empire. Uranus enters Capricorn and restructures the geopolitical order.",
    },
    source: SRC_CASSANYA,
  },
  crisis_financiera_2008: {
    title: { es: "Crisis financiera de 2008", en: "2008 Financial Crisis" },
    description: {
      es: "El exceso encuentra su corrección. La cuadratura Júpiter-Plutón desinfla estructuras financieras sobredimensionadas.",
      en: "Excess meets its correction. The Jupiter-Pluto square deflates oversized financial structures.",
    },
    source: SRC_BARBAULT,
  },
  primavera_arabe_2011: {
    title: { es: "Primavera Árabe", en: "Arab Spring" },
    description: {
      es: "Una ola de revueltas populares. La cuadratura Urano-Plutón detona la ruptura con el pasado y el poder colectivo.",
      en: "A wave of popular uprisings. The Uranus-Pluto square detonates the break with the past and collective power.",
    },
    source: SRC_TARNAS,
  },
  pandemia_2020: {
    title: { es: "Pandemia de 2020", en: "2020 Pandemic" },
    description: {
      es: "Una crisis sistémica global. La conjunción Saturno-Plutón marca el fin de un ciclo y una reestructuración forzada.",
      en: "A systemic global crisis. The Saturn-Pluto conjunction marks the end of a cycle and a forced restructuring.",
    },
    source: SRC_BARBAULT,
  },
};

export function getEventNarrative(id: string, lang: Lang): {
  title: string;
  description: string;
  source: string;
} {
  const e = EVENT_NARRATIVES[id];
  if (!e) {
    return { title: id.replace(/_/g, " "), description: "", source: "" };
  }
  return { title: e.title[lang], description: e.description[lang], source: e.source[lang] };
}

// ── Narrativa de configuraciones (curada + generador de respaldo) ──────────────

// Significado mundano de cada cuerpo lento (para el generador de respaldo).
const BODY_MEANING: Record<string, Bilingual> = {
  Júpiter: { es: "expansión, ideología, ley y creencias", en: "expansion, ideology, law and beliefs" },
  Saturno: { es: "estructuras, autoridad y límites", en: "structures, authority and limits" },
  Urano: { es: "ruptura, tecnología y libertad", en: "rupture, technology and freedom" },
  Neptuno: { es: "disolución, ideales y utopías", en: "dissolution, ideals and utopias" },
  Plutón: { es: "poder profundo y transformación", en: "deep power and transformation" },
};

const ASPECT_QUALITY: Record<string, Bilingual> = {
  Conjunción: { es: "fusiona", en: "fuses" },
  Oposición: { es: "confronta", en: "confronts" },
  Cuadratura: { es: "tensiona", en: "strains" },
  Trígono: { es: "armoniza", en: "harmonizes" },
  Sextil: { es: "facilita", en: "facilitates" },
};

// Claves de firma con texto curado. Formato de clave:
//   aspecto:  "A+B:Aspecto" (par ordenado alfabéticamente)
//   ingreso:  "Cuerpo>Signo"
const CONFIG_NARRATIVES: Record<string, ConfigEntry> = {
  "Neptuno+Saturno:Conjunción": {
    title: { es: "Saturno–Neptuno en conjunción", en: "Saturn–Neptune conjunction" },
    theme: { es: "Disolución de estructuras", en: "Dissolution of structures" },
    synthesis: {
      es: "La estructura (Saturno) se encuentra con la disolución (Neptuno): regímenes que se agotan, fronteras que se difuminan y utopías que ganan o pierden solidez. Históricamente coincide con fines de ciclo ideológico.",
      en: "Structure (Saturn) meets dissolution (Neptune): regimes that exhaust themselves, borders that blur, and utopias that gain or lose solidity. Historically it coincides with the end of ideological cycles.",
    },
  },
  "Neptuno>Aries": {
    title: { es: "Neptuno ingresa en Aries", en: "Neptune enters Aries" },
    theme: { es: "Nuevos ideales pioneros", en: "New pioneering ideals" },
    synthesis: {
      es: "Un ideal colectivo (Neptuno) se viste de iniciativa y nacionalismo (Aries). Épocas anteriores trajeron fracturas nacionales y la forja de nuevas naciones.",
      en: "A collective ideal (Neptune) takes on initiative and nationalism (Aries). Prior eras brought national fractures and the forging of new nations.",
    },
  },
  "Urano>Géminis": {
    title: { es: "Urano ingresa en Géminis", en: "Uranus enters Gemini" },
    theme: { es: "Revolución de la información", en: "Revolution of information" },
    synthesis: {
      es: "La ruptura tecnológica (Urano) actúa sobre la comunicación y el transporte (Géminis). El precedente de mediados del siglo XX fue la era atómica y la computación.",
      en: "Technological rupture (Uranus) acts on communication and transport (Gemini). The mid-20th-century precedent was the atomic and computing age.",
    },
  },
};

function signatureKey(config: { signature: Record<string, unknown> }): string | null {
  const sig = config.signature;
  if (Array.isArray(sig.pair) && typeof sig.aspect === "string") {
    const pair = [...(sig.pair as string[])].sort();
    return `${pair[0]}+${pair[1]}:${sig.aspect}`;
  }
  if (typeof sig.body === "string" && typeof sig.ingress === "string") {
    return `${sig.body}>${sig.ingress}`;
  }
  return null;
}

export function getConfigNarrative(
  config: {
    kind: "aspect" | "ingress";
    bodies: string[];
    aspect: string | null;
    sign: string | null;
    signature: Record<string, unknown>;
  },
  lang: Lang,
): { title: string; theme: string; synthesis: string } {
  const key = signatureKey(config);
  if (key && CONFIG_NARRATIVES[key]) {
    const c = CONFIG_NARRATIVES[key];
    return { title: c.title[lang], theme: c.theme[lang], synthesis: c.synthesis[lang] };
  }

  // ── Generador de respaldo compositivo ──
  if (config.kind === "aspect" && config.aspect && config.bodies.length === 2) {
    const [a, b] = config.bodies;
    const qual = ASPECT_QUALITY[config.aspect]?.[lang] ?? config.aspect.toLowerCase();
    const ma = BODY_MEANING[a]?.[lang] ?? a;
    const mb = BODY_MEANING[b]?.[lang] ?? b;
    const title = lang === "es"
      ? `${a}–${b} en ${config.aspect.toLowerCase()}`
      : `${a}–${b} ${config.aspect.toLowerCase()}`;
    const synthesis = lang === "es"
      ? `El ciclo ${a}–${b} ${qual} ${ma} con ${mb}. Un compás de fondo en el clima geopolítico del período.`
      : `The ${a}–${b} cycle ${qual} ${ma} with ${mb}. A background beat in the period's geopolitical climate.`;
    return {
      title,
      theme: lang === "es" ? "Ciclo planetario" : "Planetary cycle",
      synthesis,
    };
  }

  if (config.kind === "ingress" && config.sign && config.bodies.length === 1) {
    const body = config.bodies[0];
    const m = BODY_MEANING[body]?.[lang] ?? body;
    const title = lang === "es"
      ? `${body} ingresa en ${config.sign}`
      : `${body} enters ${config.sign}`;
    const synthesis = lang === "es"
      ? `${body} —${m}— estrena el terreno de ${config.sign}, tiñiendo de un nuevo color los asuntos colectivos durante años.`
      : `${body} —${m}— opens the ground of ${config.sign}, coloring collective affairs anew for years.`;
    return { title, theme: lang === "es" ? "Ingreso de signo" : "Sign ingress", synthesis };
  }

  return { title: config.bodies.join("–"), theme: "", synthesis: "" };
}
