/**
 * Resumen por Temas — capa freemium accesible y shareable.
 * Basado en arquetipos de natal-interpretations + chart-summary.
 * 6 temas fijos: Amor, Dinero, Trabajo, Salud, Familia, Crecimiento.
 */

import type {
  Aspect,
  ChartResponse,
  PlanetPosition,
  StrengthLevel,
  TopicId,
  TopicSummary,
} from "./types";
import {
  getPlanetInSignInterpretation,
  getPlanetInHouseInterpretation,
  getAspectInterpretation,
  getAngleMeaning,
  getHouseMeaning,
} from "./natal-interpretations";

type Lang = "es" | "en";

// ── Topic definitions ─────────────────────────────────────────────────────────

interface TopicDef {
  id: TopicId;
  titleEs: string;
  titleEn: string;
  houses: number[];
  keyPlanets: string[];
  /** Planets whose aspects also count for this topic */
  aspectPlanets: string[];
  angleHints?: ("MC" | "ASC")[];
}

const TOPICS: TopicDef[] = [
  {
    id: "amor",
    titleEs: "Amor & Relaciones",
    titleEn: "Love & Relationships",
    houses: [5, 7],
    keyPlanets: ["Venus", "Luna", "Sol"],
    // Venus + casas 5/7 + aspectos a Venus/Luna/Sol/Marte
    aspectPlanets: ["Venus", "Sol", "Luna", "Marte"],
  },
  {
    id: "dinero",
    titleEs: "Dinero & Recursos",
    titleEn: "Money & Resources",
    houses: [2, 8],
    keyPlanets: ["Júpiter", "Venus", "Saturno"],
    aspectPlanets: ["Júpiter", "Venus", "Saturno"],
  },
  {
    id: "trabajo",
    titleEs: "Trabajo & Vocación",
    titleEn: "Work & Vocation",
    houses: [10, 6],
    keyPlanets: ["Sol", "Saturno", "Marte"],
    aspectPlanets: ["Sol", "Saturno", "Marte"],
    angleHints: ["MC"],
  },
  {
    id: "salud",
    titleEs: "Salud & Energía",
    titleEn: "Health & Energy",
    houses: [6, 1],
    keyPlanets: ["Marte", "Sol", "Luna"],
    aspectPlanets: ["Marte", "Sol", "Luna"],
  },
  {
    id: "familia",
    titleEs: "Familia & Hogar",
    titleEn: "Family & Home",
    houses: [4],
    keyPlanets: ["Luna", "Saturno", "Sol"],
    aspectPlanets: ["Luna", "Saturno"],
  },
  {
    id: "crecimiento",
    titleEs: "Crecimiento Personal",
    titleEn: "Personal Growth",
    houses: [9, 12],
    keyPlanets: ["Nodo Norte", "Júpiter", "Urano", "Neptuno", "Plutón"],
    aspectPlanets: ["Nodo Norte", "Júpiter", "Urano", "Neptuno", "Plutón"],
  },
];

const HARMONIOUS = new Set(["Trígono", "Sextil", "Conjunción"]);
const TENSE = new Set(["Cuadratura", "Oposición"]);
const MAJOR = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);

/** Dominios de casa (ES/EN) — alineados con chart-summary / natal-interpretations. */
const HOUSE_DOMAIN: Record<number, { es: string; en: string }> = {
  1: { es: "identidad y presencia personal", en: "identity and personal presence" },
  2: { es: "recursos, valores y autoestima", en: "resources, values and self-worth" },
  3: { es: "comunicación y entorno cercano", en: "communication and close environment" },
  4: { es: "hogar, familia y raíces", en: "home, family and roots" },
  5: { es: "creatividad, romance y expresión", en: "creativity, romance and expression" },
  6: { es: "trabajo, salud y rutinas", en: "work, health and daily routines" },
  7: { es: "relaciones significativas y asociaciones", en: "significant relationships and partnerships" },
  8: { es: "transformación y recursos compartidos", en: "transformation and shared resources" },
  9: { es: "filosofía, viajes y educación superior", en: "philosophy, travel and higher learning" },
  10: { es: "vocación, reputación e impacto público", en: "vocation, reputation and public impact" },
  11: { es: "comunidad, ideales y visión futura", en: "community, ideals and future vision" },
  12: { es: "mundo interior, espiritualidad y lo oculto", en: "inner world, spirituality and the unseen" },
};

function houseDomain(n: number, lang: Lang): string {
  const d = HOUSE_DOMAIN[n];
  if (!d) return lang === "en" ? "life experience" : "experiencia vital";
  return lang === "en" ? d.en : d.es;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function planetByName(planets: PlanetPosition[], name: string): PlanetPosition | undefined {
  return planets.find((p) => p.name === name);
}

function planetsInHouses(planets: PlanetPosition[], houses: number[]): PlanetPosition[] {
  const set = new Set(houses);
  return planets.filter((p) => set.has(p.house));
}

function aspectsForPlanets(aspects: Aspect[], names: string[]): Aspect[] {
  const set = new Set(names);
  return aspects
    .filter(
      (a) =>
        MAJOR.has(a.aspect_name) &&
        (set.has(a.planet1) || set.has(a.planet2)) &&
        a.orb < 4
    )
    .sort((a, b) => a.orb - b.orb);
}

function scoreTopic(
  houseHits: number,
  keyPlanetHits: number,
  harmonious: number,
  tense: number,
  exactHits: number
): StrengthLevel {
  // Exact aspects amplify; tense aspects mark "desafio" when they dominate.
  const raw = houseHits * 1.2 + keyPlanetHits * 1.5 + harmonious * 1.1 + exactHits * 1.4 - tense * 0.6;
  if (tense >= 2 && tense > harmonious && raw < 5) return "desafio";
  if (raw >= 5.5 || exactHits >= 2) return "alta";
  if (raw >= 2.5) return "media";
  if (tense >= 1 && harmonious === 0) return "desafio";
  return "media";
}

function uniqueKeywords(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const k of list) {
      const key = k.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(k);
      }
    }
  }
  return out.slice(0, 6);
}

function firstSentence(text: string, max = 160): string {
  const cut = text.search(/[.!?]/);
  const sentence = cut === -1 ? text : text.slice(0, cut + 1);
  if (sentence.length <= max) return sentence;
  const space = sentence.lastIndexOf(" ", max - 1);
  return (space > 40 ? sentence.slice(0, space) : sentence.slice(0, max - 1)) + "…";
}

// ── Per-topic narrative builders ──────────────────────────────────────────────

function buildLove(
  chart: ChartResponse,
  lang: Lang,
  strength: StrengthLevel,
  topAspects: Aspect[]
): { headline: string; paragraphs: string[]; keywords: string[] } {
  const venus = planetByName(chart.planets, "Venus");
  const moon = planetByName(chart.planets, "Luna");
  const sun = planetByName(chart.planets, "Sol");
  const h7 = getHouseMeaning(7, lang);
  const h5 = getHouseMeaning(5, lang);

  const vSign = venus ? getPlanetInSignInterpretation("Venus", venus.sign, lang) : null;
  const vHouse = venus ? getPlanetInHouseInterpretation("Venus", venus.house, lang) : null;
  const moonSign = moon ? getPlanetInSignInterpretation("Luna", moon.sign, lang) : null;

  const keywords = uniqueKeywords(
    vSign?.keywords ?? [],
    h7.keywords,
    h5.keywords,
    moonSign?.keywords ?? [],
    lang === "en"
      ? ["love", "attraction", "partnership"]
      : ["amor", "atracción", "pareja"]
  );

  const headline =
    lang === "en"
      ? venus
        ? `How you love: Venus in ${venus.sign}`
        : "How you connect — your relational signature"
      : venus
        ? `Cómo amas: Venus en ${venus.sign}`
        : "Cómo te vinculas — tu firma relacional";

  const p1 =
    lang === "en"
      ? venus && vSign
        ? `In love, you seek a connection that feels ${vSign.keywords.slice(0, 2).join(" and ")}. ` +
          `With Venus in ${venus.sign} (House ${venus.house}), attraction is ${vSign.keyphrase.toLowerCase()}. ` +
          firstSentence(vHouse?.principal ?? h7.principal)
        : firstSentence(h7.principal)
      : venus && vSign
        ? `En el amor buscas una conexión que se sienta ${vSign.keywords.slice(0, 2).join(" y ")}. ` +
          `Con Venus en ${venus.sign} (Casa ${venus.house}), la atracción es ${vSign.keyphrase.toLowerCase()}. ` +
          firstSentence(vHouse?.principal ?? h7.principal)
        : firstSentence(h7.principal);

  const p2 =
    lang === "en"
      ? moon
        ? `Emotionally, your Moon in ${moon.sign} needs safety through ${moonSign?.keywords[0] ?? "intimacy"}. ` +
          `House 5 (romance & joy) and House 7 (committed bonds) are the stages where this plays out: ` +
          `${h5.keywords.slice(0, 2).join(" and ")} meet ${h7.keywords.slice(0, 2).join(" and ")}.`
        : firstSentence(h5.principal)
      : moon
        ? `Emocionalmente, tu Luna en ${moon.sign} necesita seguridad a través de ${moonSign?.keywords[0] ?? "la intimidad"}. ` +
          `La Casa 5 (romance y alegría) y la Casa 7 (vínculos comprometidos) son el escenario: ` +
          `${h5.keywords.slice(0, 2).join(" y ")} se encuentran con ${h7.keywords.slice(0, 2).join(" y ")}.`
        : firstSentence(h5.principal);

  let p3: string;
  if (topAspects[0]) {
    const a = topAspects[0];
    const interp = getAspectInterpretation(a.planet1, a.aspect_name, a.planet2, a.orb, lang);
    p3 =
      lang === "en"
        ? `A key signature: ${a.planet1} ${a.aspect_name} ${a.planet2} (orb ${a.orb.toFixed(1)}°). ` +
          firstSentence(interp.principal) +
          (strength === "desafio"
            ? " Work the tension with honesty rather than avoiding it — that is where intimacy deepens."
            : " Lean into this chemistry; it is one of your natural relational gifts.")
        : `Una firma clave: ${a.planet1} ${a.aspect_name} ${a.planet2} (orbe ${a.orb.toFixed(1)}°). ` +
          firstSentence(interp.principal) +
          (strength === "desafio"
            ? " Trabaja la tensión con honestidad en lugar de evitarla: ahí se profundiza la intimidad."
            : " Apóyate en esta química; es uno de tus dones relacionales naturales.");
  } else if (sun) {
    p3 =
      lang === "en"
        ? `Your Sun in ${sun.sign} colors what you need to feel seen in partnership. ` +
          `Share your light without dimming your partner's — mutual recognition is your love language.`
        : `Tu Sol en ${sun.sign} colorea lo que necesitas para sentirte visto/a en pareja. ` +
          `Comparte tu luz sin apagar la del otro: el reconocimiento mutuo es tu lenguaje de amor.`;
  } else {
    p3 =
      lang === "en"
        ? "Healthy bonds grow when you name what you need early and often."
        : "Los vínculos sanos crecen cuando nombras lo que necesitas a tiempo.";
  }

  const p4 =
    lang === "en"
      ? strength === "alta"
        ? "This area is loud in your chart: relationships are a primary classroom. Choose partners who celebrate your style, not just tolerate it."
        : strength === "desafio"
          ? "Love may ask more practice than talent here — every honest conversation compounds into trust."
          : "Keep affection practical: small consistent gestures beat grand sparse ones for your chart."
      : strength === "alta"
        ? "Esta área habla alto en tu carta: las relaciones son un aula principal. Elige personas que celebren tu estilo, no solo lo toleren."
        : strength === "desafio"
          ? "El amor aquí pide más práctica que talento: cada conversación honesta suma confianza."
          : "Mantén el afecto práctico: gestos pequeños y constantes superan a los grandes y escasos en tu carta.";

  return {
    headline,
    paragraphs: [p1, p2, p3, p4].filter(Boolean),
    keywords,
  };
}

function buildMoney(
  chart: ChartResponse,
  lang: Lang,
  strength: StrengthLevel,
  topAspects: Aspect[]
): { headline: string; paragraphs: string[]; keywords: string[] } {
  const jupiter = planetByName(chart.planets, "Júpiter");
  const venus = planetByName(chart.planets, "Venus");
  const h2 = getHouseMeaning(2, lang);
  const inH2 = planetsInHouses(chart.planets, [2]);

  const jSign = jupiter ? getPlanetInSignInterpretation("Júpiter", jupiter.sign, lang) : null;
  const vSign = venus ? getPlanetInSignInterpretation("Venus", venus.sign, lang) : null;

  const keywords = uniqueKeywords(
    h2.keywords,
    jSign?.keywords ?? [],
    vSign?.keywords ?? [],
    lang === "en" ? ["abundance", "value", "stability"] : ["abundancia", "valor", "estabilidad"]
  );

  const headline =
    lang === "en"
      ? jupiter
        ? `Money & worth: Jupiter in ${jupiter.sign}`
        : "How you earn, keep and value resources"
      : jupiter
        ? `Dinero y valor: Júpiter en ${jupiter.sign}`
        : "Cómo generas, cuidas y valoras lo tuyo";

  const p1 =
    lang === "en"
      ? `House 2 is your resource engine: ${houseDomain(2, lang)}. ` +
        (inH2.length
          ? `You have ${inH2.map((p) => p.name).join(", ")} activating this zone — money and self-worth are linked themes.`
          : `Even without many planets there, the ruler style of your values still sets the tone.`)
      : `La Casa 2 es tu motor de recursos: ${houseDomain(2, lang)}. ` +
        (inH2.length
          ? `Tienes ${inH2.map((p) => p.name).join(", ")} activando esta zona — dinero y autoestima van de la mano.`
          : `Aunque haya pocos planetas allí, el estilo de tus valores marca el tono.`);

  const p2 =
    lang === "en"
      ? jupiter && jSign
        ? `Jupiter (expansion) in ${jupiter.sign}, House ${jupiter.house}: ${firstSentence(jSign.principal)} ` +
          `Growth arrives when you bet on what feels meaningful, not only what feels safe.`
        : venus && vSign
          ? `Venus in ${venus.sign} shows what you are willing to invest in: ${vSign.keywords.slice(0, 2).join(" and ")}.`
          : firstSentence(h2.principal)
      : jupiter && jSign
        ? `Júpiter (expansión) en ${jupiter.sign}, Casa ${jupiter.house}: ${firstSentence(jSign.principal)} ` +
          `El crecimiento llega cuando apuestas por lo que tiene sentido, no solo por lo seguro.`
        : venus && vSign
          ? `Venus en ${venus.sign} muestra en qué estás dispuesto/a a invertir: ${vSign.keywords.slice(0, 2).join(" y ")}.`
          : firstSentence(h2.principal);

  let p3: string;
  if (topAspects[0]) {
    const a = topAspects[0];
    const interp = getAspectInterpretation(a.planet1, a.aspect_name, a.planet2, a.orb, lang);
    p3 =
      lang === "en"
        ? `Money signature: ${a.planet1} ${a.aspect_name} ${a.planet2} (${a.orb.toFixed(1)}°). ${firstSentence(interp.principal)}`
        : `Firma de abundancia: ${a.planet1} ${a.aspect_name} ${a.planet2} (${a.orb.toFixed(1)}°). ${firstSentence(interp.principal)}`;
  } else {
    p3 =
      lang === "en"
        ? "Build systems that match your temperament: irregular income suits some charts; steady ladders suit others."
        : "Construye sistemas que encajen con tu temperamento: ingresos irregulares van bien a unas cartas; escaleras estables, a otras.";
  }

  const p4 =
    lang === "en"
      ? strength === "desafio"
        ? "Treat scarcity stories as data, not destiny. Skill + boundaries usually out-earn luck alone."
        : "Your chart supports abundance when values, effort and timing align — track what actually works for you."
      : strength === "desafio"
        ? "Trata las historias de escasez como datos, no como destino. Habilidad + límites suelen rendir más que la suerte sola."
        : "Tu carta apoya la abundancia cuando valores, esfuerzo y timing se alinean — observa qué te funciona de verdad.";

  return { headline, paragraphs: [p1, p2, p3, p4], keywords };
}

function buildWork(
  chart: ChartResponse,
  lang: Lang,
  strength: StrengthLevel,
  topAspects: Aspect[]
): { headline: string; paragraphs: string[]; keywords: string[] } {
  const sun = planetByName(chart.planets, "Sol");
  const saturn = planetByName(chart.planets, "Saturno");
  const mc = chart.midheaven;
  const mcInterp = getAngleMeaning("MC", mc.sign, lang);
  const h10 = getHouseMeaning(10, lang);
  const sunSign = sun ? getPlanetInSignInterpretation("Sol", sun.sign, lang) : null;
  const satSign = saturn ? getPlanetInSignInterpretation("Saturno", saturn.sign, lang) : null;

  const keywords = uniqueKeywords(
    h10.keywords,
    mcInterp.keywords,
    sunSign?.keywords ?? [],
    satSign?.keywords ?? [],
    lang === "en" ? ["vocation", "impact", "mastery"] : ["vocación", "impacto", "maestría"]
  );

  const headline =
    lang === "en"
      ? `Career path: Midheaven in ${mc.sign}`
      : `Camino profesional: Medio Cielo en ${mc.sign}`;

  const p1 =
    lang === "en"
      ? `Career-wise, the world tends to recognize you through a ${mc.sign} lens. ${firstSentence(mcInterp.principal)} ` +
        `House 10 (${houseDomain(10, lang)}) is the stage for reputation and long-game ambition.`
      : `En lo profesional, el mundo tiende a reconocerte con un sello ${mc.sign}. ${firstSentence(mcInterp.principal)} ` +
        `La Casa 10 (${houseDomain(10, lang)}) es el escenario de reputación y ambición a largo plazo.`;

  const p2 =
    lang === "en"
      ? sun && sunSign
        ? `Your Sun in ${sun.sign} (House ${sun.house}) shows where purpose fuels work: ${sunSign.keywords.slice(0, 3).join(", ")}. ` +
          (saturn
            ? `Saturn in ${saturn.sign} adds the discipline layer — mastery is earned, not given.`
            : "Consistency turns talent into a track record.")
        : firstSentence(h10.principal)
      : sun && sunSign
        ? `Tu Sol en ${sun.sign} (Casa ${sun.house}) muestra dónde el propósito alimenta el trabajo: ${sunSign.keywords.slice(0, 3).join(", ")}. ` +
          (saturn
            ? `Saturno en ${saturn.sign} aporta la capa de disciplina — la maestría se gana, no se regala.`
            : "La constancia convierte el talento en trayectoria.")
        : firstSentence(h10.principal);

  let p3: string;
  if (topAspects[0]) {
    const a = topAspects[0];
    const interp = getAspectInterpretation(a.planet1, a.aspect_name, a.planet2, a.orb, lang);
    p3 =
      lang === "en"
        ? `Vocational aspect: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`
        : `Aspecto vocacional: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`;
  } else {
    p3 =
      lang === "en"
        ? "Prefer roles where your contribution is visible and measurable — your chart thrives on honest feedback loops."
        : "Prefiere roles donde tu aporte sea visible y medible — tu carta crece con bucles de feedback honestos.";
  }

  const p4 =
    lang === "en"
      ? strength === "alta"
        ? "Vocation is a high-volume theme: protect deep-work blocks and say no to prestige without purpose."
        : strength === "desafio"
          ? "Career friction is fuel. Translate pressure into craft, mentors and sustainable pace."
          : "Steady progress beats dramatic pivots: ship, review, refine."
      : strength === "alta"
        ? "La vocación es un tema de alto volumen: protege bloques de trabajo profundo y di no al prestigio sin propósito."
        : strength === "desafio"
          ? "La fricción profesional es combustible. Traduce la presión en oficio, mentores y ritmo sostenible."
          : "El progreso constante gana a los giros dramáticos: entrega, revisa, refina.";

  return { headline, paragraphs: [p1, p2, p3, p4], keywords };
}

function buildHealth(
  chart: ChartResponse,
  lang: Lang,
  strength: StrengthLevel,
  topAspects: Aspect[]
): { headline: string; paragraphs: string[]; keywords: string[] } {
  const mars = planetByName(chart.planets, "Marte");
  const sun = planetByName(chart.planets, "Sol");
  const moon = planetByName(chart.planets, "Luna");
  const h6 = getHouseMeaning(6, lang);
  const marsSign = mars ? getPlanetInSignInterpretation("Marte", mars.sign, lang) : null;

  const keywords = uniqueKeywords(
    h6.keywords,
    marsSign?.keywords ?? [],
    lang === "en"
      ? ["vitality", "rhythm", "recovery"]
      : ["vitalidad", "ritmo", "recuperación"]
  );

  const headline =
    lang === "en"
      ? mars
        ? `Energy & body: Mars in ${mars.sign}`
        : "The rhythm that keeps you well"
      : mars
        ? `Energía y cuerpo: Marte en ${mars.sign}`
        : "El ritmo que te mantiene bien";

  const p1 =
    lang === "en"
      ? `Health here is less about perfection and more about sustainable systems. House 6 covers ${houseDomain(6, lang)}. ` +
        (mars && marsSign
          ? `Mars in ${mars.sign} (House ${mars.house}) shows how you push — and where you risk burnout: ${marsSign.keywords.slice(0, 2).join(" & ")}.`
          : firstSentence(h6.principal))
      : `La salud aquí es menos perfección y más sistemas sostenibles. La Casa 6 cubre ${houseDomain(6, lang)}. ` +
        (mars && marsSign
          ? `Marte en ${mars.sign} (Casa ${mars.house}) muestra cómo te impulsas — y dónde arriesgas el burnout: ${marsSign.keywords.slice(0, 2).join(" y ")}.`
          : firstSentence(h6.principal));

  const p2 =
    lang === "en"
      ? sun && moon
        ? `Solar vitality (Sun in ${sun.sign}) needs emotional recovery (Moon in ${moon.sign}). ` +
          `When will and rest disagree, the body keeps score — schedule recovery like a meeting.`
        : firstSentence(h6.growth)
      : sun && moon
        ? `La vitalidad solar (Sol en ${sun.sign}) necesita recuperación emocional (Luna en ${moon.sign}). ` +
          `Cuando voluntad y descanso no se hablan, el cuerpo lleva la cuenta — agenda la recuperación como una reunión.`
        : firstSentence(h6.growth);

  let p3: string;
  if (topAspects[0]) {
    const a = topAspects[0];
    const interp = getAspectInterpretation(a.planet1, a.aspect_name, a.planet2, a.orb, lang);
    p3 =
      lang === "en"
        ? `Energy signature: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`
        : `Firma de energía: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`;
  } else {
    p3 =
      lang === "en"
        ? "Movement that matches your temperament beats trendy plans you abandon in two weeks."
        : "El movimiento que encaja con tu temperamento gana a planes de moda que abandonas en dos semanas.";
  }

  const p4 =
    lang === "en"
      ? strength === "desafio"
        ? "Your chart flags stress sensitivity: sleep, food timing and honest boundaries are non-negotiable tools."
        : "Protect routines that work. Small daily deposits compound into durable vitality."
      : strength === "desafio"
        ? "Tu carta marca sensibilidad al estrés: sueño, timing de comida y límites honestos son herramientas no negociables."
        : "Protege las rutinas que funcionan. Pequeños depósitos diarios se componen en vitalidad duradera.";

  return { headline, paragraphs: [p1, p2, p3, p4], keywords };
}

function buildFamily(
  chart: ChartResponse,
  lang: Lang,
  strength: StrengthLevel,
  topAspects: Aspect[]
): { headline: string; paragraphs: string[]; keywords: string[] } {
  const moon = planetByName(chart.planets, "Luna");
  const h4 = getHouseMeaning(4, lang);
  const inH4 = planetsInHouses(chart.planets, [4]);
  const moonSign = moon ? getPlanetInSignInterpretation("Luna", moon.sign, lang) : null;
  const moonHouse = moon ? getPlanetInHouseInterpretation("Luna", moon.house, lang) : null;

  const keywords = uniqueKeywords(
    h4.keywords,
    moonSign?.keywords ?? [],
    lang === "en" ? ["roots", "belonging", "safety"] : ["raíces", "pertenencia", "seguridad"]
  );

  const headline =
    lang === "en"
      ? moon
        ? `Home & roots: Moon in ${moon.sign}`
        : "Where you feel safe enough to rest"
      : moon
        ? `Hogar y raíces: Luna en ${moon.sign}`
        : "Dónde te sientes lo bastante seguro/a para descansar";

  const p1 =
    lang === "en"
      ? moon && moonSign
        ? `Family and home themes orbit your Moon in ${moon.sign} (House ${moon.house}). ${firstSentence(moonSign.principal)} ` +
          firstSentence(moonHouse?.principal ?? h4.principal)
        : firstSentence(h4.principal)
      : moon && moonSign
        ? `Los temas de familia y hogar orbitan tu Luna en ${moon.sign} (Casa ${moon.house}). ${firstSentence(moonSign.principal)} ` +
          firstSentence(moonHouse?.principal ?? h4.principal)
        : firstSentence(h4.principal);

  const p2 =
    lang === "en"
      ? inH4.length
        ? `House 4 hosts ${inH4.map((p) => `${p.name} in ${p.sign}`).join(", ")} — private life is not a side quest; it is a core plotline.`
        : `Even with a quieter House 4, roots still matter: ancestry, housing choices and emotional safety set the stage for everything else.`
      : inH4.length
        ? `La Casa 4 aloja ${inH4.map((p) => `${p.name} en ${p.sign}`).join(", ")} — la vida privada no es un side quest; es trama central.`
        : `Aunque la Casa 4 esté más quieta, las raíces importan: linaje, vivienda y seguridad emocional montan el escenario de todo lo demás.`;

  let p3: string;
  if (topAspects[0]) {
    const a = topAspects[0];
    const interp = getAspectInterpretation(a.planet1, a.aspect_name, a.planet2, a.orb, lang);
    p3 =
      lang === "en"
        ? `Home/family aspect: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`
        : `Aspecto de hogar/familia: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`;
  } else {
    p3 =
      lang === "en"
        ? "You repair family patterns by modeling the climate you needed — not by winning old arguments."
        : "Reparas patrones familiares modelando el clima que necesitaste — no ganando viejas discusiones.";
  }

  const p4 =
    lang === "en"
      ? strength === "alta"
        ? "Private life carries high voltage in your chart. Invest in spaces and people that feel like exhale."
        : "A stable base multiplies every other area. Treat home care as strategy, not luxury."
      : strength === "alta"
        ? "La vida privada lleva alto voltaje en tu carta. Invierte en espacios y personas que se sientan como un exhale."
        : "Una base estable multiplica el resto. Trata el cuidado del hogar como estrategia, no como lujo.";

  return { headline, paragraphs: [p1, p2, p3, p4], keywords };
}

function buildGrowth(
  chart: ChartResponse,
  lang: Lang,
  strength: StrengthLevel,
  topAspects: Aspect[]
): { headline: string; paragraphs: string[]; keywords: string[] } {
  const nn = planetByName(chart.planets, "Nodo Norte");
  const jupiter = planetByName(chart.planets, "Júpiter");
  const outer = ["Urano", "Neptuno", "Plutón"]
    .map((n) => planetByName(chart.planets, n))
    .filter((p): p is PlanetPosition => !!p);
  const h9 = getHouseMeaning(9, lang);
  const h12 = getHouseMeaning(12, lang);
  const nnSign = nn ? getPlanetInSignInterpretation("Nodo Norte", nn.sign, lang) : null;

  const keywords = uniqueKeywords(
    h9.keywords,
    h12.keywords,
    nnSign?.keywords ?? [],
    lang === "en"
      ? ["evolution", "meaning", "horizon"]
      : ["evolución", "sentido", "horizonte"]
  );

  const headline =
    lang === "en"
      ? nn
        ? `Your next chapter: North Node in ${nn.sign}`
        : "Where life keeps inviting you to grow"
      : nn
        ? `Tu próximo capítulo: Nodo Norte en ${nn.sign}`
        : "Hacia dónde la vida te invita a crecer";

  const p1 =
    lang === "en"
      ? nn && nnSign
        ? `Personal growth is not abstract here: the North Node in ${nn.sign} (House ${nn.house}) sketches the skills life keeps offering you. ` +
          firstSentence(nnSign.principal)
        : `Houses 9 and 12 (meaning & inner life) are your evolutionary corridors: ${houseDomain(9, lang)}; ${houseDomain(12, lang)}.`
      : nn && nnSign
        ? `El crecimiento personal no es abstracto: el Nodo Norte en ${nn.sign} (Casa ${nn.house}) esboza las habilidades que la vida te sigue ofreciendo. ` +
          firstSentence(nnSign.principal)
        : `Las Casas 9 y 12 (sentido y vida interior) son tus corredores evolutivos: ${houseDomain(9, lang)}; ${houseDomain(12, lang)}.`;

  const p2 =
    lang === "en"
      ? jupiter
        ? `Jupiter in ${jupiter.sign} (House ${jupiter.house}) is your expansion style — curiosity, teaching, travel or belief systems open doors when you stay honest about excess.`
        : firstSentence(h9.growth)
      : jupiter
        ? `Júpiter en ${jupiter.sign} (Casa ${jupiter.house}) es tu estilo de expansión — curiosidad, enseñanza, viaje o sistemas de creencia abren puertas si eres honesto/a con el exceso.`
        : firstSentence(h9.growth);

  const outerBits = outer
    .slice(0, 2)
    .map((p) =>
      lang === "en" ? `${p.name} in ${p.sign} (H${p.house})` : `${p.name} en ${p.sign} (C${p.house})`
    )
    .join(lang === "en" ? "; " : "; ");

  let p3: string;
  if (outerBits) {
    p3 =
      lang === "en"
        ? `Outer planets mark generational weather with a personal address: ${outerBits}. They describe long arcs of change you co-author, not overnight fixes.`
        : `Los planetas externos marcan clima generacional con dirección personal: ${outerBits}. Describen arcos largos de cambio que co-escribes, no arreglos de un día.`;
  } else if (topAspects[0]) {
    const a = topAspects[0];
    const interp = getAspectInterpretation(a.planet1, a.aspect_name, a.planet2, a.orb, lang);
    p3 =
      lang === "en"
        ? `Growth aspect: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`
        : `Aspecto de crecimiento: ${a.planet1} ${a.aspect_name} ${a.planet2}. ${firstSentence(interp.principal)}`;
  } else {
    p3 =
      lang === "en"
        ? firstSentence(h12.growth)
        : firstSentence(h12.growth);
  }

  const p4 =
    lang === "en"
      ? strength === "alta"
        ? "Your chart is hungry for meaning. Feed it with study, travel, practice or service — stagnation is the real enemy."
        : "Grow in seasons: stretch, integrate, rest. Integration is as spiritual as the peak experience."
      : strength === "alta"
        ? "Tu carta tiene hambre de sentido. Aliméntala con estudio, viaje, práctica o servicio — el estancamiento es el verdadero enemigo."
        : "Crece por temporadas: estira, integra, descansa. La integración es tan espiritual como la experiencia cumbre.";

  return { headline, paragraphs: [p1, p2, p3, p4], keywords };
}

// ── Scoring (shared with Tier -1 PDF) ─────────────────────────────────────────

export interface TopicScoreSignals {
  id: TopicId;
  strength: StrengthLevel;
  harmonious: number;
  tense: number;
  exactHits: number;
  houseHits: number;
  keyPlanetHits: number;
  topicAspects: Aspect[];
  relatedPlanets: string[];
  relatedHouses: number[];
}

/** Scoring canónico de los 6 temas. El PDF Preview reutiliza exactamente esto. */
export function scoreAllTopics(chart: ChartResponse): TopicScoreSignals[] {
  return TOPICS.map((def) => {
    const housePlanets = planetsInHouses(chart.planets, def.houses);
    const keyPresent = def.keyPlanets.filter((n) => planetByName(chart.planets, n));
    const relatedPlanets = Array.from(
      new Set([
        ...keyPresent.map((n) => n),
        ...housePlanets.map((p) => p.name),
      ])
    ).slice(0, 6);

    const relatedHouses = Array.from(
      new Set([
        ...def.houses,
        ...keyPresent
          .map((n) => planetByName(chart.planets, n)?.house)
          .filter((h): h is number => typeof h === "number"),
      ])
    ).sort((a, b) => a - b);

    const topicAspects = aspectsForPlanets(chart.aspects, def.aspectPlanets);
    const harmonious = topicAspects.filter((a) => HARMONIOUS.has(a.aspect_name)).length;
    const tense = topicAspects.filter((a) => TENSE.has(a.aspect_name)).length;
    const exactHits = topicAspects.filter((a) => a.orb < 1).length;

    // Bonus if MC is relevant and sign is emphasized
    let angleBonus = 0;
    if (def.angleHints?.includes("MC")) {
      angleBonus = 1;
    }

    const strength = scoreTopic(
      housePlanets.length + angleBonus,
      keyPresent.length,
      harmonious,
      tense,
      exactHits
    );

    return {
      id: def.id,
      strength,
      harmonious,
      tense,
      exactHits,
      houseHits: housePlanets.length,
      keyPlanetHits: keyPresent.length,
      topicAspects,
      relatedPlanets,
      relatedHouses,
    };
  });
}

// ── Main API ──────────────────────────────────────────────────────────────────

export function generateTopicSummaries(
  chart: ChartResponse,
  lang: Lang = "es"
): TopicSummary[] {
  const defById = Object.fromEntries(TOPICS.map((d) => [d.id, d])) as Record<
    TopicId,
    TopicDef
  >;

  return scoreAllTopics(chart).map((signals) => {
    const def = defById[signals.id];
    const strength = signals.strength;
    const topicAspects = signals.topicAspects;

    const title = lang === "en" ? def.titleEn : def.titleEs;
    let body: { headline: string; paragraphs: string[]; keywords: string[] };

    switch (def.id) {
      case "amor":
        body = buildLove(chart, lang, strength, topicAspects);
        break;
      case "dinero":
        body = buildMoney(chart, lang, strength, topicAspects);
        break;
      case "trabajo":
        body = buildWork(chart, lang, strength, topicAspects);
        break;
      case "salud":
        body = buildHealth(chart, lang, strength, topicAspects);
        break;
      case "familia":
        body = buildFamily(chart, lang, strength, topicAspects);
        break;
      case "crecimiento":
        body = buildGrowth(chart, lang, strength, topicAspects);
        break;
    }

    return {
      id: def.id,
      title,
      shortHeadline: body.headline,
      paragraphs: body.paragraphs.slice(0, 4),
      keywords: body.keywords,
      strengthLevel: strength,
      relatedPlanets: signals.relatedPlanets,
      relatedHouses: signals.relatedHouses,
    };
  });
}

/** Agrupa tránsitos por tema de vida (preview Pro con data real). */
export function groupTransitsByTopic(
  natalPlanets: PlanetPosition[],
  events: { transit_planet: string; natal_planet: string; aspect_name: string; orb: number; exact_date?: string | null; importance?: string }[],
  lang: Lang = "es"
): { topicId: TopicId; title: string; items: string[] }[] {
  const titles: Record<TopicId, { es: string; en: string }> = {
    amor: { es: "Amor & Relaciones", en: "Love & Relationships" },
    dinero: { es: "Dinero & Recursos", en: "Money & Resources" },
    trabajo: { es: "Trabajo & Vocación", en: "Work & Vocation" },
    salud: { es: "Salud & Energía", en: "Health & Energy" },
    familia: { es: "Familia & Hogar", en: "Family & Home" },
    crecimiento: { es: "Crecimiento Personal", en: "Personal Growth" },
  };

  const buckets: Record<TopicId, string[]> = {
    amor: [],
    dinero: [],
    trabajo: [],
    salud: [],
    familia: [],
    crecimiento: [],
  };

  for (const ev of events) {
    const natal = natalPlanets.find((p) => p.name === ev.natal_planet);
    const house = natal?.house;
    const name = ev.natal_planet;
    const line =
      lang === "en"
        ? `${ev.transit_planet} ${ev.aspect_name} natal ${ev.natal_planet}${ev.exact_date ? ` · exact ${String(ev.exact_date).slice(0, 10)}` : ""}`
        : `${ev.transit_planet} ${ev.aspect_name} ${ev.natal_planet} natal${ev.exact_date ? ` · exacto ${String(ev.exact_date).slice(0, 10)}` : ""}`;

    let assigned = false;
    for (const def of TOPICS) {
      const houseHit = house !== undefined && def.houses.includes(house);
      const planetHit = def.aspectPlanets.includes(name) || def.keyPlanets.includes(name);
      if (houseHit || planetHit) {
        if (buckets[def.id].length < 4) buckets[def.id].push(line);
        assigned = true;
        break;
      }
    }
    if (!assigned && buckets.crecimiento.length < 4) {
      buckets.crecimiento.push(line);
    }
  }

  return TOPICS.map((def) => ({
    topicId: def.id,
    title: lang === "en" ? titles[def.id].en : titles[def.id].es,
    items: buckets[def.id],
  })).filter((g) => g.items.length > 0);
}
