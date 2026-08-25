/**
 * Generador de resumen ejecutivo de carta natal.
 * Basado en Steven Forrest, Sue Tompkins, Howard Sasportas, Stephen Arroyo.
 */

import type { ChartResponse, ChartSummary } from "./types";
import { generateHouseSynthesis, generateAngleDeepAnalysis } from "./advanced-interpretation";
import { getPlanetDignity } from "./zodiac-utils";

// ── Arquetipos de signos ──────────────────────────────────────────────────────

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

const ELEMENT_DESC: Record<string, string> = {
  Fuego: "impulso creativo, entusiasmo y visión",
  Tierra: "pragmatismo, estabilidad y construcción material",
  Aire: "intelecto, conexión social y pensamiento",
  Agua: "profundidad emocional, intuición y sensibilidad",
};

const MODALITY_DESC: Record<string, string> = {
  Cardinal: "iniciativa y liderazgo de nuevos ciclos",
  Fijo: "perseverancia, estabilidad y profundización",
  Mutable: "adaptación, síntesis y transición",
};

// ── Arquetipos de planetas ────────────────────────────────────────────────────

const PLANET_FUNCTION: Record<string, string> = {
  Sol: "identidad y propósito vital",
  Luna: "mundo emocional y necesidades instintivas",
  Mercurio: "mente y capacidad comunicativa",
  Venus: "valores, estética y vínculos afectivos",
  Marte: "voluntad, deseo y capacidad de acción",
  Júpiter: "expansión, fe y búsqueda de sentido",
  Saturno: "estructura, disciplina y madurez",
  Urano: "libertad, originalidad e innovación",
  Neptuno: "espiritualidad, creatividad y trascendencia",
  Plutón: "transformación, poder y regeneración",
  "Nodo Norte": "dirección evolutiva",
  Quirón: "herida y sanación",
};

const PLANET_GIFT: Record<string, string> = {
  Sol: "vitalidad creadora y voluntad consciente",
  Luna: "intuición, empatía y cuidado natural",
  Mercurio: "agilidad mental y expresión clara",
  Venus: "encanto, sentido estético y armonía relacional",
  Marte: "coraje, determinación y pasión",
  Júpiter: "optimismo, generosidad y visión de largo alcance",
  Saturno: "disciplina, responsabilidad y logro duradero",
  Urano: "originalidad, visión futura y capacidad de renovación",
  Neptuno: "inspiración artística, compasión y conexión espiritual",
  Plutón: "capacidad de renacer y sanar heridas profundas",
};

const SIGN_STYLE: Record<string, string> = {
  Aries: "directa, impulsiva y pionera",
  Tauro: "paciente, sensorial y constructora",
  Géminis: "versátil, curiosa y comunicativa",
  Cáncer: "intuitiva, protectora y emocional",
  Leo: "radiante, expresiva y generosa",
  Virgo: "analítica, precisa y servicial",
  Libra: "diplomática, refinada y buscadora de equilibrio",
  Escorpio: "profunda, intensa y penetrante",
  Sagitario: "expansiva, filosófica y aventurera",
  Capricornio: "disciplinada, ambiciosa y responsable",
  Acuario: "innovadora, independiente y humanitaria",
  Piscis: "intuitiva, compasiva y mística",
};

const HOUSE_DOMAIN: Record<number, string> = {
  1: "identidad y presencia personal",
  2: "recursos, valores y autoestima",
  3: "comunicación y entorno cercano",
  4: "hogar, familia y raíces",
  5: "creatividad, romance y expresión",
  6: "trabajo, salud y rutinas",
  7: "relaciones significativas y asociaciones",
  8: "transformación, sexualidad y recursos compartidos",
  9: "filosofía, viajes y educación superior",
  10: "vocación, reputación e impacto público",
  11: "comunidad, ideales y visión futura",
  12: "mundo interior, espiritualidad y lo oculto",
};

const ASPECT_KEYWORD: Record<string, string> = {
  Conjunción: "fusión e intensificación",
  Oposición: "polaridad y complementariedad",
  Cuadratura: "tensión y crecimiento por fricción",
  Trígono: "fluidez y talento natural",
  Sextil: "oportunidades y habilidades desarrollables",
};

// ── Función principal ─────────────────────────────────────────────────────────

export function generateChartSummary(chart: ChartResponse): ChartSummary {
  const { planets, ascendant, midheaven, aspects } = chart;

  const sun = planets.find((p) => p.name === "Sol")!;
  const moon = planets.find((p) => p.name === "Luna")!;

  // ── Elemento y modalidad dominantes ─────────────────────────────────────────
  const elementCount: Record<string, number> = { Fuego: 0, Tierra: 0, Aire: 0, Agua: 0 };
  const modalityCount: Record<string, number> = { Cardinal: 0, Fijo: 0, Mutable: 0 };
  for (const p of planets) {
    const el = SIGN_ELEMENT[p.sign];
    const mod = SIGN_MODALITY[p.sign];
    if (el) elementCount[el]++;
    if (mod) modalityCount[mod]++;
  }
  const dominantElement = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0][0];
  const dominantModality = Object.entries(modalityCount).sort((a, b) => b[1] - a[1])[0][0];

  // ── Stelliums (3+ planetas en el mismo signo) ────────────────────────────────
  const signGroups: Record<string, string[]> = {};
  for (const p of planets) {
    if (!signGroups[p.sign]) signGroups[p.sign] = [];
    signGroups[p.sign].push(p.name);
  }
  const stelliums = Object.entries(signGroups)
    .filter(([, ps]) => ps.length >= 3)
    .map(([sign, ps]) => ({ sign, planets: ps }));

  // ── Casa con más planetas ────────────────────────────────────────────────────
  const houseCount: Record<number, number> = {};
  for (const p of planets) {
    houseCount[p.house] = (houseCount[p.house] ?? 0) + 1;
  }
  const topHouseEntry = Object.entries(houseCount).sort((a, b) => b[1] - a[1])[0];
  const topHouseNum = parseInt(topHouseEntry[0]);
  const houseEmphasis = {
    house: topHouseNum,
    domain: HOUSE_DOMAIN[topHouseNum] ?? "experiencias vitales",
    planet_count: topHouseEntry[1],
  };

  // ── Aspectos más exactos con Sol/Luna/ASC ───────────────────────────────────
  const keyAspects = aspects
    .filter((a) =>
      (a.planet1 === "Sol" || a.planet2 === "Sol" ||
       a.planet1 === "Luna" || a.planet2 === "Luna") &&
      a.orb < 2.0 &&
      ["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"].includes(a.aspect_name)
    )
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 4);

  const notableAspects = keyAspects.map((a) => {
    const keyword = ASPECT_KEYWORD[a.aspect_name] ?? a.aspect_name;
    return `${a.planet1} ${a.aspect_name} ${a.planet2} (${a.orb.toFixed(1)}°) — ${keyword}`;
  });

  // ── Identidad central ────────────────────────────────────────────────────────
  const sunStyle = SIGN_STYLE[sun.sign] ?? "única";
  const sunGift = PLANET_GIFT["Sol"] ?? "vitalidad";
  const sunDig = getPlanetDignity("Sol", sun.sign);
  const sunHouse = generateHouseSynthesis(chart, sun.house, "es");
  const coreIdentity =
    `El Sol en ${sun.sign} (casa ${sun.house}${sunDig ? `, ${sunDig}` : ""}) nombra la voluntad consciente ` +
    `en un idioma ${sunStyle}. ${sunGift} es el don; no un veredicto. ` +
    `Se entrena en ${HOUSE_DOMAIN[sun.house] ?? "la biografía concreta"} — ${sunHouse.name}.`;

  // ── Naturaleza emocional ─────────────────────────────────────────────────────
  const moonStyle = SIGN_STYLE[moon.sign] ?? "sensible";
  const moonHouse = generateHouseSynthesis(chart, moon.house, "es");
  const emotionalNature =
    `La Luna en ${moon.sign} (casa ${moon.house}) describe el clima de la respuesta emocional: ${moonStyle}. ` +
    `El cobijo se busca en ${HOUSE_DOMAIN[moon.house] ?? "lo íntimo"} (${moonHouse.name}). ` +
    `No «eres» el signo: es el idioma con el que el cuerpo pide seguridad.`;

  // ── Propósito de vida (MC + Sol + IC) ────────────────────────────────────────
  const mcDeep = generateAngleDeepAnalysis(chart, "MC", "es");
  const icDeep = generateAngleDeepAnalysis(chart, "IC", "es");
  const lifePurpose =
    `MC en ${midheaven.sign}: vocación y reputación en idioma ${SIGN_STYLE[midheaven.sign] ?? "propio"}. ` +
    `${mcDeep.ruler_condition} ` +
    `El IC en ${icDeep.title.replace("IC en ", "")} sostiene la base privada; sin ese suelo el MC se vuelve pose. ` +
    (stelliums.length > 0
      ? `La concentración en ${stelliums[0].sign} (${stelliums[0].planets.join(", ")}) da densidad a este eje.`
      : `El ${dominantElement} dominante (${ELEMENT_DESC[dominantElement]}) colorea la vocación, no la dicta.`);

  // ── Fortalezas clave ──────────────────────────────────────────────────────────
  const keyStrengths: string[] = [
    `Sol en ${sun.sign}: ${sunGift}`,
    `Ascendente en ${ascendant.sign}: presencia ${SIGN_STYLE[ascendant.sign]?.split(",")[0] ?? "auténtica"} y primera impresión clara`,
    `Luna en ${moon.sign}: ${PLANET_GIFT["Luna"] ?? "sensibilidad emocional"} en registro ${moon.sign}`,
  ];

  const trines = aspects.filter((a) => a.aspect_name === "Trígono" && a.orb < 3);
  if (trines.length > 0) {
    const t = trines[0];
    keyStrengths.push(`Trígono ${t.planet1}–${t.planet2}: talento natural para integrar ${PLANET_FUNCTION[t.planet1] ?? t.planet1} y ${PLANET_FUNCTION[t.planet2] ?? t.planet2}`);
  }

  if (stelliums.length > 0) {
    const s = stelliums[0];
    keyStrengths.push(`Énfasis en ${s.sign}: concentración de energía que genera maestría en sus temas`);
  }

  // ── Desafíos clave ────────────────────────────────────────────────────────────
  const keyChallenges: string[] = [];
  const squares = aspects.filter((a) => a.aspect_name === "Cuadratura" && a.orb < 3)
    .sort((a, b) => a.orb - b.orb);
  for (const sq of squares.slice(0, 2)) {
    keyChallenges.push(
      `Cuadratura ${sq.planet1}–${sq.planet2}: tensión entre ${PLANET_FUNCTION[sq.planet1] ?? sq.planet1} y ${PLANET_FUNCTION[sq.planet2] ?? sq.planet2} que impulsa el crecimiento`
    );
  }
  const oppositions = aspects.filter((a) => a.aspect_name === "Oposición" && a.orb < 3);
  for (const op of oppositions.slice(0, 1)) {
    keyChallenges.push(
      `Oposición ${op.planet1}–${op.planet2}: polaridad que pide integrar ambas energías conscientemente`
    );
  }
  if (keyChallenges.length === 0) {
    keyChallenges.push("Carta con aspectos fluidos: el desafío principal es no desperdiciar los talentos en dispersión");
  }

  // ── Consejo central ───────────────────────────────────────────────────────────
  const topHouseSyn = generateHouseSynthesis(chart, houseEmphasis.house, "es");
  const advice =
    `Énfasis en ${dominantElement} (${ELEMENT_DESC[dominantElement]}) y modalidad ${dominantModality} ` +
    `(${MODALITY_DESC[dominantModality]}). La casa ${topHouseSyn.house} (${topHouseSyn.name}) concentra planetas: ` +
    `${topHouseSyn.overall_tone}. ${topHouseSyn.ruler_condition} ` +
    `El crecimiento no es suprimir las tensiones de la carta, sino usarlas como oficio. ` +
    `Libre albedrío: el clima está dado; el acto, no.`;

  // ── Titular ───────────────────────────────────────────────────────────────────
  const headline =
    `${sun.sign} · ${ascendant.sign} Ascendente · Luna en ${moon.sign}`;

  return {
    headline,
    core_identity: coreIdentity,
    emotional_nature: emotionalNature,
    life_purpose: lifePurpose,
    key_strengths: keyStrengths,
    key_challenges: keyChallenges,
    dominant_element: dominantElement,
    dominant_modality: dominantModality,
    house_emphasis: houseEmphasis,
    stelliums,
    notable_aspects: notableAspects,
    advice,
  };
}
