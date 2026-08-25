/**
 * Motor interpretativo avanzado de AstroEngine.
 * Síntesis de carta concreta: dignidad, sect, recepción, ángulos, orbe, aplicante.
 * No es horóscopo de revista. Potencial y libre albedrío.
 *
 * Fuentes: Valens, Ptolomeo, Doroteo, Lilly, Morin, Brennan, Hand, Greene, Demetra George.
 */

import type {
  AngleDeepAnalysis,
  Aspect,
  ChartResponse,
  HouseSynthesis,
  HouseTone,
  NatalInterpretation,
  PlanetPosition,
} from "./types";
import {
  degreeInSign,
  getPlanetDignity,
  longitudeToSign,
  toDMS,
  type Dignity,
} from "./zodiac-utils";

type Lang = "es" | "en";

const DOMICILE_RULER: Record<string, string> = {
  Aries: "Marte",
  Tauro: "Venus",
  Géminis: "Mercurio",
  Cáncer: "Luna",
  Leo: "Sol",
  Virgo: "Mercurio",
  Libra: "Venus",
  Escorpio: "Marte",
  Sagitario: "Júpiter",
  Capricornio: "Saturno",
  Acuario: "Saturno",
  Piscis: "Júpiter",
};

const HOUSE_NAME: Record<Lang, Record<number, string>> = {
  es: {
    1: "Casa del Ser",
    2: "Casa de Recursos",
    3: "Casa de la Mente",
    4: "Casa de Raíces",
    5: "Casa de Creación",
    6: "Casa de Servicio",
    7: "Casa del Otro",
    8: "Casa de Transformación",
    9: "Casa del Horizonte",
    10: "Casa de Vocación",
    11: "Casa de la Tribu",
    12: "Casa del Alma",
  },
  en: {
    1: "House of Self",
    2: "House of Resources",
    3: "House of the Mind",
    4: "House of Roots",
    5: "House of Creation",
    6: "House of Service",
    7: "House of the Other",
    8: "House of Transformation",
    9: "House of the Horizon",
    10: "House of Vocation",
    11: "House of the Tribe",
    12: "House of the Soul",
  },
};

const HOUSE_DOMAIN: Record<Lang, Record<number, string>> = {
  es: {
    1: "el estilo de aproximación a la vida, el cuerpo y la máscara",
    2: "recursos, valores y el sentido de bastarse a uno mismo",
    3: "la mente cotidiana, el entorno cercano y los vínculos fraternos",
    4: "las raíces, el hogar interior y la base emocional",
    5: "la creación, el juego, el romance y lo que se arriesga por gusto",
    6: "el oficio diario, el cuerpo como instrumento y el servicio",
    7: "el otro significativo, el contrato y el espejo relacional",
    8: "lo compartido, la crisis fértil y la regeneración",
    9: "el horizonte de sentido, el viaje y la enseñanza",
    10: "la vocación visible, la reputación y el pacto con el mundo",
    11: "la tribu electiva, los ideales y el futuro colectivo",
    12: "lo no dicho, el retiro fértil y el trabajo del alma",
  },
  en: {
    1: "approach to life, the body, and the persona",
    2: "resources, values, and the sense of being enough",
    3: "everyday mind, the near environment, and sibling ties",
    4: "roots, the inner home, and the emotional base",
    5: "creation, play, romance, and what is risked for joy",
    6: "daily craft, the body as instrument, and service",
    7: "the significant other, the contract, and the relational mirror",
    8: "what is shared, fertile crisis, and regeneration",
    9: "the horizon of meaning, travel, and teaching",
    10: "visible vocation, reputation, and the pact with the world",
    11: "the chosen tribe, ideals, and the collective future",
    12: "the unspoken, fertile retreat, and soul work",
  },
};

const PLANET_FN: Record<Lang, Record<string, string>> = {
  es: {
    Sol: "la voluntad consciente y el propósito vital",
    Luna: "la respuesta emocional y la necesidad de cobijo",
    Mercurio: "el pensamiento, la palabra y el intercambio",
    Venus: "el criterio de valor, el afecto y la estética",
    Marte: "el deseo, el corte y la capacidad de actuar",
    Júpiter: "la fe, la amplitud y el sentido de posibilidad",
    Saturno: "el límite, el tiempo y la maestría por esfuerzo",
    Urano: "la ruptura de molde y la libertad de ser atípico",
    Neptuno: "la disolución de bordes, la imagen y lo inefable",
    Plutón: "el poder de morir a una forma y nacer a otra",
    "Nodo Norte": "el vector evolutivo que pide práctica nueva",
    Quirón: "la herida que, nombrada, se vuelve oficio de guía",
    Ascendente: "la máscara y el estilo de entrar en la vida",
    MC: "la vocación pública y el nombre que el mundo te da",
  },
  en: {
    Sol: "conscious will and vital purpose",
    Luna: "emotional response and the need for shelter",
    Mercurio: "thought, speech, and exchange",
    Venus: "the criterion of value, affection, and aesthetics",
    Marte: "desire, the cut, and the capacity to act",
    Júpiter: "faith, breadth, and a sense of possibility",
    Saturno: "limit, time, and mastery through effort",
    Urano: "breaking the mold and the freedom to be atypical",
    Neptuno: "the dissolving of edges, image, and the ineffable",
    Plutón: "the power to die to one form and be born to another",
    "Nodo Norte": "the evolutionary vector that asks for new practice",
    Quirón: "the wound that, named, becomes a craft of guidance",
    Ascendente: "the persona and the style of entering life",
    MC: "public vocation and the name the world gives you",
  },
};

const MAJOR_ASPECTS = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);
const BENEFICS = new Set(["Venus", "Júpiter"]);
const MALEFICS = new Set(["Marte", "Saturno"]);
const TRANSPERSONAL = new Set(["Urano", "Neptuno", "Plutón"]);

function t<T>(lang: Lang, es: T, en: T): T {
  return lang === "en" ? en : es;
}

function normLon(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

function angDiff(a: number, b: number): number {
  const d = Math.abs(normLon(a) - normLon(b)) % 360;
  return d > 180 ? 360 - d : d;
}

function houseClass(n: number): "angular" | "succedent" | "cadent" {
  if ([1, 4, 7, 10].includes(n)) return "angular";
  if ([2, 5, 8, 11].includes(n)) return "succedent";
  return "cadent";
}

function isDayChart(chart: ChartResponse): boolean {
  const sun = chart.planets.find((p) => p.name === "Sol");
  if (!sun) return true;
  return sun.house >= 7 && sun.house <= 12;
}

function planetByName(chart: ChartResponse, name: string): PlanetPosition | undefined {
  return chart.planets.find((p) => p.name === name);
}

function dignityLabel(planet: string, sign: string, lang: Lang): string | null {
  const d: Dignity = getPlanetDignity(planet, sign);
  if (!d) return null;
  const map: Record<string, { es: string; en: string }> = {
    domicilio: { es: "en domicilio", en: "in domicile" },
    exaltación: { es: "en exaltación", en: "in exaltation" },
    detrimento: { es: "en detrimento", en: "in detriment" },
    caída: { es: "en caída", en: "in fall" },
  };
  return map[d]?.[lang] ?? d;
}

function inSect(planet: string, day: boolean): boolean | null {
  if (planet === "Sol" || planet === "Júpiter" || planet === "Saturno") return day;
  if (planet === "Luna" || planet === "Venus" || planet === "Marte") return !day;
  return null;
}

function isCombust(chart: ChartResponse, p: PlanetPosition): "cazimi" | "combust" | "beams" | null {
  if (!["Mercurio", "Venus", "Marte", "Luna"].includes(p.name)) return null;
  const sun = planetByName(chart, "Sol");
  if (!sun) return null;
  const d = angDiff(p.longitude, sun.longitude);
  if (d < 0.28) return "cazimi";
  if (d < 8.5) return "combust";
  if (d < 17) return "beams";
  return null;
}

function receives(guest: PlanetPosition, host: PlanetPosition): boolean {
  return DOMICILE_RULER[guest.sign] === host.name;
}

function receptionNote(a: PlanetPosition, b: PlanetPosition, lang: Lang): string | null {
  const ab = receives(a, b);
  const ba = receives(b, a);
  if (ab && ba) {
    return t(
      lang,
      `Hay recepción mutua por domicilio entre ${a.name} y ${b.name}: cada uno hospeda al otro y el pacto es negociable.`,
      `There is mutual reception by domicile between ${a.name} and ${b.name}: each hosts the other, so the pact is negotiable.`,
    );
  }
  if (ab) {
    return t(
      lang,
      `${a.name} está en signo de ${b.name}: pide hospitalidad a ${b.name} para actuar con más eficacia.`,
      `${a.name} occupies a sign of ${b.name}: it asks ${b.name} for hospitality in order to act more effectively.`,
    );
  }
  if (ba) {
    return t(
      lang,
      `${b.name} está en signo de ${a.name}: hay recepción de ${b.name} hacia ${a.name}.`,
      `${b.name} occupies a sign of ${a.name}: ${b.name} receives ${a.name}.`,
    );
  }
  return null;
}

function oppositePoint(lon: number): { longitude: number; sign: string; degree_display: string } {
  const longitude = normLon(lon + 180);
  return {
    longitude,
    sign: longitudeToSign(longitude),
    degree_display: toDMS(degreeInSign(longitude)),
  };
}

function planetsInHouse(chart: ChartResponse, house: number): PlanetPosition[] {
  return chart.planets.filter((p) => p.house === house);
}

function aspectsOf(chart: ChartResponse, name: string): Aspect[] {
  return chart.aspects
    .filter(
      (a) =>
        MAJOR_ASPECTS.has(a.aspect_name) &&
        (a.planet1 === name || a.planet2 === name),
    )
    .sort((a, b) => a.orb - b.orb);
}

function otherEnd(a: Aspect, name: string): string {
  return a.planet1 === name ? a.planet2 : a.planet1;
}

function cuspHits(chart: ChartResponse, cuspLon: number, orb = 8): PlanetPosition[] {
  return chart.planets
    .filter((p) => angDiff(p.longitude, cuspLon) <= orb)
    .sort((a, b) => angDiff(a.longitude, cuspLon) - angDiff(b.longitude, cuspLon));
}

function classLabel(n: number, lang: Lang): string {
  const k = houseClass(n);
  if (k === "angular") return t(lang, "angular", "angular");
  if (k === "succedent") return t(lang, "sucedente", "succedent");
  return t(lang, "cadente", "cadent");
}

function solarCondition(chart: ChartResponse, p: PlanetPosition, lang: Lang): string | null {
  const vis = isCombust(chart, p);
  if (vis === "cazimi") {
    return t(
      lang,
      `${p.name} está en cazimi (corazón del Sol): la voluntad solar lo potencia en vez de ocultarlo.`,
      `${p.name} is cazimi (in the heart of the Sun): solar will amplifies it instead of hiding it.`,
    );
  }
  if (vis === "combust") {
    return t(
      lang,
      `${p.name} está combusto: su visibilidad social se reduce y el trabajo es más interior, no inexistente.`,
      `${p.name} is combust: social visibility shrinks and the work is more interior, not absent.`,
    );
  }
  if (vis === "beams") {
    return t(
      lang,
      `${p.name} está bajo los rayos del Sol: opera con menos brillo público.`,
      `${p.name} is under the Sun's beams: it operates with less public shine.`,
    );
  }
  return null;
}

function planetConditionLine(chart: ChartResponse, p: PlanetPosition, lang: Lang): string {
  const bits: string[] = [];
  const dig = dignityLabel(p.name, p.sign, lang);
  if (dig) bits.push(dig);
  bits.push(t(lang, `en casa ${p.house} (${classLabel(p.house, lang)})`, `in house ${p.house} (${classLabel(p.house, lang)})`));
  if (p.retrograde) {
    bits.push(t(lang, "retrógrado: el vector se interioriza y revisa", "retrograde: the vector turns inward and revises"));
  }
  const sect = inSect(p.name, isDayChart(chart));
  if (sect === true) bits.push(t(lang, "a favor de la secta de la carta", "in sect with the chart"));
  if (sect === false) bits.push(t(lang, "fuera de secta", "out of sect"));
  const solar = solarCondition(chart, p, lang);
  if (solar) bits.push(solar);
  return bits.join("; ");
}

function exactness(orb: number, lang: Lang): string {
  if (orb < 1) return t(lang, "aspecto exacto (<1°)", "exact aspect (<1°)");
  if (orb <= 3) return t(lang, "orbe estrecho", "tight orb");
  return t(lang, "orbe amplio", "wide orb");
}

function applyWord(applying: boolean, lang: Lang): string {
  return applying
    ? t(lang, "aplicante (el tema aún se concentra)", "applying (the theme is still concentrating)")
    : t(lang, "separante (el tema ya se ha mostrado y pide integración)", "separating (the theme has already shown and asks for integration)");
}

function fn(name: string, lang: Lang): string {
  return PLANET_FN[lang][name] ?? name;
}

function listNames(ps: PlanetPosition[], lang: Lang): string {
  if (!ps.length) return t(lang, "ningún planeta", "no planets");
  return ps.map((p) => `${p.name} en ${p.sign}`).join(t(lang, ", ", ", "));
}

function toneFromHouse(
  house: number,
  occupants: PlanetPosition[],
  ruler: PlanetPosition | undefined,
): HouseTone {
  if (occupants.some((p) => TRANSPERSONAL.has(p.name)) || house === 8 || house === 12) {
    if (occupants.some((p) => TRANSPERSONAL.has(p.name))) return "transformative";
  }
  let score = 0;
  for (const p of occupants) {
    const d = getPlanetDignity(p.name, p.sign);
    if (BENEFICS.has(p.name)) score += d === "detrimento" || d === "caída" ? 0 : 2;
    if (MALEFICS.has(p.name)) score += d === "domicilio" || d === "exaltación" ? 0 : -2;
    if (d === "domicilio" || d === "exaltación") score += 1;
    if (d === "detrimento" || d === "caída") score -= 1;
  }
  if (ruler) {
    const d = getPlanetDignity(ruler.name, ruler.sign);
    if (d === "domicilio" || d === "exaltación") score += 2;
    if (d === "detrimento" || d === "caída") score -= 2;
    if (houseClass(ruler.house) === "angular") score += 1;
    if (houseClass(ruler.house) === "cadent") score -= 1;
    if (TRANSPERSONAL.has(ruler.name) || ruler.house === 8) return "transformative";
  }
  if (occupants.length === 0 && (!ruler || houseClass(ruler.house) === "cadent") && score <= 0) {
    return "latent";
  }
  if (score <= -2) return "challenging";
  if (score >= 2) return "constructive";
  if (occupants.some((p) => TRANSPERSONAL.has(p.name))) return "transformative";
  return score >= 0 ? "constructive" : "challenging";
}

export function generateHouseSynthesis(
  chart: ChartResponse,
  house: number,
  lang: Lang = "es",
): HouseSynthesis {
  const cusp = chart.houses.find((h) => h.number === house);
  const sign = cusp?.sign ?? "Aries";
  const occupants = planetsInHouse(chart, house);
  const rulerName = DOMICILE_RULER[sign] ?? "Mercurio";
  const ruler = planetByName(chart, rulerName);
  const hits = cusp ? cuspHits(chart, cusp.cusp_longitude, 6) : [];
  const cls = houseClass(house);
  const name = HOUSE_NAME[lang][house] ?? `Casa ${house}`;
  const domain = HOUSE_DOMAIN[lang][house] ?? "";

  const occText = occupants.length
    ? t(
        lang,
        `En el recinto operan ${listNames(occupants, lang)}. No se leen como frases sueltas: colorean el mismo territorio de ${domain}.`,
        `Operating in the enclosure: ${listNames(occupants, lang)}. They are not separate slogans: they colour the same territory of ${domain}.`,
      )
    : t(
        lang,
        `La casa está vacía de planetas: el tenor no desaparece; lo porta el regente desde donde esté.`,
        `The house is empty of planets: the tenor does not vanish; the ruler carries it from wherever it stands.`,
      );

  const rulerLine = ruler
    ? t(
        lang,
        `El regente es ${ruler.name} (${planetConditionLine(chart, ruler, lang)}). Desde la casa ${ruler.house} administra ${domain} con el estilo de ${ruler.sign}.`,
        `The ruler is ${ruler.name} (${planetConditionLine(chart, ruler, lang)}). From house ${ruler.house} it administers ${domain} in the style of ${ruler.sign}.`,
      )
    : t(lang, `Regente tradicional: ${rulerName}.`, `Traditional ruler: ${rulerName}.`);

  const hitLine = hits.length
    ? t(
        lang,
        ` Hay planetas en orbe de la cúspide (${hits.map((p) => `${p.name} a ${angDiff(p.longitude, cusp!.cusp_longitude).toFixed(1)}°`).join(", ")}): el recinto se personaliza con fuerza accidental.`,
        ` Planets sit in orb of the cusp (${hits.map((p) => `${p.name} at ${angDiff(p.longitude, cusp!.cusp_longitude).toFixed(1)}°`).join(", ")}): the enclosure is accidentally emphasised.`,
      )
    : "";

  const classLine = t(
    lang,
    ` Casa ${house} es ${cls === "angular" ? "angular: lo que ocurre aquí se hace visible y precipita acción" : cls === "succedent" ? "sucedente: el tema se consolida con tiempo" : "cadente: el tema se elabora, se piensa o se disuelve antes de cuajar"}.`,
    ` House ${house} is ${cls === "angular" ? "angular: what happens here becomes visible and precipitates action" : cls === "succedent" ? "succedent: the theme consolidates with time" : "cadent: the theme is elaborated, thought through, or dissolved before it sets"}.`,
  );

  const synthesis = `${occText} ${rulerLine}${hitLine}${classLine} ${t(
    lang,
    `Nada de esto obliga un destino: describe el clima en el que el libre albedrío trabaja ${domain}.`,
    `None of this mandates a fate: it describes the climate in which free will works ${domain}.`,
  )}`;

  const ruler_condition = ruler
    ? t(
        lang,
        `${ruler.name} rige la cúspide en ${sign}. Condición: ${planetConditionLine(chart, ruler, lang)}.`,
        `${ruler.name} rules the ${sign} cusp. Condition: ${planetConditionLine(chart, ruler, lang)}.`,
      )
    : t(lang, `Regente ${rulerName} de la cúspide en ${sign}.`, `Ruler ${rulerName} of the ${sign} cusp.`);

  let angular_connection: string;
  if (house === 1) {
    angular_connection = t(lang, "Esta casa es el ASC: máscara y estilo de entrar en la vida.", "This house is the ASC: persona and style of entering life.");
  } else if (house === 10) {
    angular_connection = t(lang, "Esta casa es el MC: vocación visible y reputación.", "This house is the MC: visible vocation and reputation.");
  } else if (house === 4) {
    angular_connection = t(lang, "Esta casa es el IC: base privada y raíces.", "This house is the IC: private base and roots.");
  } else if (house === 7) {
    angular_connection = t(lang, "Esta casa es el DSC: el otro y el contrato.", "This house is the DSC: the other and the contract.");
  } else if (ruler && houseClass(ruler.house) === "angular") {
    angular_connection = t(
      lang,
      `El regente está angular (casa ${ruler.house}): el tema de esta casa se filtra por ASC/MC/IC/DSC y se hace perceptible.`,
      `The ruler is angular (house ${ruler.house}): this house's theme filters through ASC/MC/IC/DSC and becomes perceptible.`,
    );
  } else if (occupants.some((p) => houseClass(p.house) === "angular")) {
    angular_connection = t(lang, "Hay planetas angulares en el recinto: el tema no permanece privado.", "Angular planets occupy the enclosure: the theme does not stay private.");
  } else {
    angular_connection = t(
      lang,
      `Sin planeta del recinto sobre un ángulo; el vínculo con ASC/MC es indirecto, vía el regente en casa ${ruler?.house ?? "—"}.`,
      `No planet of the enclosure sits on an angle; the link to ASC/MC is indirect, via the ruler in house ${ruler?.house ?? "—"}.`,
    );
  }

  return {
    house,
    name,
    synthesis,
    ruler_condition,
    angular_connection,
    overall_tone: toneFromHouse(house, occupants, ruler),
  };
}

export function generateAllHouseSyntheses(chart: ChartResponse, lang: Lang = "es"): HouseSynthesis[] {
  return Array.from({ length: 12 }, (_, i) => generateHouseSynthesis(chart, i + 1, lang));
}

function angleMeta(name: "ASC" | "DSC" | "MC" | "IC", lang: Lang) {
  const map = {
    ASC: {
      es: { role: "máscara y estilo de aproximación a la vida", kicker: "cómo se entra en la escena" },
      en: { role: "persona and style of approaching life", kicker: "how one enters the scene" },
    },
    DSC: {
      es: { role: "el otro, el contrato y lo que se proyecta", kicker: "el espejo relacional" },
      en: { role: "the other, the contract, and what is projected", kicker: "the relational mirror" },
    },
    MC: {
      es: { role: "vocación, reputación y el pacto con el mundo", kicker: "el nombre público" },
      en: { role: "vocation, reputation, and the pact with the world", kicker: "the public name" },
    },
    IC: {
      es: { role: "raíces, privacidad y la base emocional", kicker: "el suelo psíquico" },
      en: { role: "roots, privacy, and the emotional base", kicker: "the psychic ground" },
    },
  } as const;
  return map[name][lang];
}

export function generateAngleDeepAnalysis(
  chart: ChartResponse,
  name: "ASC" | "DSC" | "MC" | "IC",
  lang: Lang = "es",
): AngleDeepAnalysis {
  const asc = chart.ascendant;
  const mc = chart.midheaven;
  const dsc = oppositePoint(asc.longitude);
  const ic = oppositePoint(mc.longitude);
  const point = name === "ASC" ? asc : name === "MC" ? mc : name === "DSC" ? dsc : ic;
  const houseNum = name === "ASC" ? 1 : name === "IC" ? 4 : name === "DSC" ? 7 : 10;
  const meta = angleMeta(name, lang);
  const rulerName = DOMICILE_RULER[point.sign] ?? "Mercurio";
  const ruler = planetByName(chart, rulerName);
  const onAngle = cuspHits(chart, point.longitude, 5);
  const occupants = planetsInHouse(chart, houseNum);
  const sun = planetByName(chart, "Sol");
  const houseSyn = generateHouseSynthesis(chart, houseNum, lang);
  const dig = dignityLabel(rulerName, ruler?.sign ?? point.sign, lang);

  const onAngleText = onAngle.length
    ? t(
        lang,
        ` Sobre el ángulo, a menos de 5°, ${onAngle.map((p) => `${p.name} (${angDiff(p.longitude, point.longitude).toFixed(1)}°)`).join(", ")} — dignidad accidental fuerte (Lilly).`,
        ` On the angle, within 5°, ${onAngle.map((p) => `${p.name} (${angDiff(p.longitude, point.longitude).toFixed(1)}°)`).join(", ")} — strong accidental dignity (Lilly).`,
      )
    : "";

  const occText = occupants.length
    ? t(
        lang,
        ` En la casa ${houseNum} conviven ${listNames(occupants, lang)}.`,
        ` House ${houseNum} holds ${listNames(occupants, lang)}.`,
      )
    : t(lang, " La casa del ángulo no tiene planetas: habla el regente.", " The angle's house has no planets: the ruler speaks.");

  let solar_relation: string | undefined;
  if (name === "MC" && sun) {
    const sunMc = angDiff(sun.longitude, mc.longitude);
    solar_relation = t(
      lang,
      `El Sol, ${fn("Sol", lang)}, está en ${sun.sign} casa ${sun.house}. Distancia al MC: ${sunMc.toFixed(1)}°. ${sun.house === 10 ? "El propósito vital y la vocación pública coinciden en el mismo recinto." : sun.house === 4 ? "El Sol trabaja desde el IC: la vocación se alimenta de la base privada." : "La reputación (MC) y el propósito (Sol) se articulan por casas distintas: hay que traducir lo íntimo a lo visible, o viceversa."}`,
      `The Sun, ${fn("Sol", lang)}, is in ${sun.sign} house ${sun.house}. Distance to the MC: ${sunMc.toFixed(1)}°. ${sun.house === 10 ? "Vital purpose and public vocation occupy the same enclosure." : sun.house === 4 ? "The Sun works from the IC: vocation is fed by the private base." : "Reputation (MC) and purpose (Sun) articulate through different houses: the intimate must be translated into the visible, or vice versa."}`,
    );
  }
  if (name === "ASC" && sun) {
    solar_relation = t(
      lang,
      `Carta ${isDayChart(chart) ? "diurna" : "nocturna"}: el Sol en casa ${sun.house} ${isDayChart(chart) ? "está sobre el horizonte y da secta diurna (Júpiter y Saturno a favor)." : "está bajo el horizonte y da secta nocturna (Luna, Venus y Marte a favor)."}`,
      `${isDayChart(chart) ? "Diurnal" : "Nocturnal"} chart: the Sun in house ${sun.house} ${isDayChart(chart) ? "is above the horizon and sets diurnal sect (Jupiter and Saturn in sect)." : "is below the horizon and sets nocturnal sect (Moon, Venus and Mars in sect)."}`,
    );
  }

  const rulerText = ruler
    ? t(
        lang,
        `El regente del ${name} es ${ruler.name} ${dig ? `(${dig})` : ""} en ${ruler.sign}, casa ${ruler.house}: ${planetConditionLine(chart, ruler, lang)}. Ese planeta es la palanca concreta del ${meta.role}.`,
        `The ${name} ruler is ${ruler.name} ${dig ? `(${dig})` : ""} in ${ruler.sign}, house ${ruler.house}: ${planetConditionLine(chart, ruler, lang)}. That planet is the concrete lever of ${meta.role}.`,
      )
    : t(lang, `Regente ${rulerName}.`, `Ruler ${rulerName}.`);

  const principal = t(
    lang,
    `El ${name} en ${point.sign} (${point.degree_display}) nombra ${meta.role}. ${rulerText}${occText}${onAngleText} ${houseSyn.angular_connection} ${solar_relation ?? ""} El signo no «te hace» ser de un modo: ofrece un idioma. Se puede hablarlo con maestría o con caricatura; la diferencia es atención, no destino.`,
    `The ${name} in ${point.sign} (${point.degree_display}) names ${meta.role}. ${rulerText}${occText}${onAngleText} ${houseSyn.angular_connection} ${solar_relation ?? ""} The sign does not “make” a person: it offers a language. It can be spoken with mastery or as caricature; the difference is attention, not fate.`,
  );

  const strengths = [
    t(lang, `Idioma de ${point.sign} disponible para ${meta.kicker}.`, `${point.sign} language available for ${meta.kicker}.`),
    ruler
      ? t(lang, `Regente ${ruler.name} operable desde casa ${ruler.house}.`, `Ruler ${ruler.name} operable from house ${ruler.house}.`)
      : t(lang, `Regente ${rulerName} como hilo conductor.`, `Ruler ${rulerName} as conducting thread.`),
    onAngle.length
      ? t(lang, `Planetas sobre el ángulo dan visibilidad inmediata al tema.`, `Planets on the angle give the theme immediate visibility.`)
      : t(lang, `El ángulo puede trabajarse con más sutileza, sin sobreexposición.`, `The angle can be worked with more subtlety, without overexposure.`),
  ];

  const challenges = [
    t(lang, `Riesgo de identificar el yo entero con ${meta.kicker}.`, `Risk of identifying the whole self with ${meta.kicker}.`),
    ruler && (getPlanetDignity(ruler.name, ruler.sign) === "caída" || getPlanetDignity(ruler.name, ruler.sign) === "detrimento")
      ? t(lang, `El regente está debilitado por dignidad esencial: pide más oficio, no menos.`, `The ruler is weakened by essential dignity: it asks for more craft, not less.`)
      : t(lang, `Si se ignora el eje opuesto, el ${name} se vuelve unilateral.`, `If the opposite axis is ignored, the ${name} becomes one-sided.`),
    t(lang, `La proyección hacia el eje contrario (casa ${houseNum === 1 ? 7 : houseNum === 10 ? 4 : houseNum === 7 ? 1 : 10}) es la sombra habitual.`, `Projection onto the opposite axis (house ${houseNum === 1 ? 7 : houseNum === 10 ? 4 : houseNum === 7 ? 1 : 10}) is the usual shadow.`),
  ];

  const growth = t(
    lang,
    `Cultivar ${meta.role} sin colonizar los otros tres ángulos. El ASC necesita del DSC, el MC del IC. El regente ${rulerName} es la práctica cotidiana: su casa indica dónde se entrena el ángulo.`,
    `Cultivate ${meta.role} without colonising the other three angles. The ASC needs the DSC, the MC the IC. Ruler ${rulerName} is the daily practice: its house shows where the angle is trained.`,
  );

  const keyphrase = t(
    lang,
    `${name} en ${point.sign}: ${meta.kicker}, con ${rulerName} como llave.`,
    `${name} in ${point.sign}: ${meta.kicker}, with ${rulerName} as the key.`,
  );

  return {
    name,
    title: t(lang, `${name} en ${point.sign}`, `${name} in ${point.sign}`),
    subtitle: meta.role,
    principal,
    ruler_condition: houseSyn.ruler_condition,
    solar_relation,
    strengths,
    challenges,
    growth,
    keywords: [name, point.sign, rulerName, meta.kicker.split(" ")[0]].filter(Boolean),
    keyphrase,
  };
}

export function generatePlanetSynthesis(
  chart: ChartResponse,
  planet: PlanetPosition,
  lang: Lang = "es",
): NatalInterpretation {
  const day = isDayChart(chart);
  const asps = aspectsOf(chart, planet.name).slice(0, 4);
  const houseSyn = generateHouseSynthesis(chart, planet.house, lang);
  const dig = dignityLabel(planet.name, planet.sign, lang);
  const recNotes = chart.planets
    .filter((p) => p.name !== planet.name)
    .map((p) => receptionNote(planet, p, lang))
    .filter((x): x is string => Boolean(x))
    .slice(0, 1);

  const aspText = asps.length
    ? asps
        .map((a) => {
          const other = otherEnd(a, planet.name);
          return t(
            lang,
            `${a.aspect_name} a ${other} (${a.orb.toFixed(1)}°, ${exactness(a.orb, lang)}, ${applyWord(a.applying, lang)})`,
            `${a.aspect_name} to ${other} (${a.orb.toFixed(1)}°, ${exactness(a.orb, lang)}, ${applyWord(a.applying, lang)})`,
          );
        })
        .join("; ")
    : t(lang, "sin aspectos mayores estrechos en esta carta", "no tight major aspects in this chart");

  const principal = t(
    lang,
    `${planet.name} en ${planet.sign} (casa ${planet.house}) nombra ${fn(planet.name, lang)}. Condición: ${planetConditionLine(chart, planet, lang)}${dig ? "" : ""}. No «hace» un carácter: ofrece un modo de ejercer esa función en el territorio de ${HOUSE_DOMAIN[lang][planet.house]}. Aspectos que la matizan: ${aspText}. ${recNotes[0] ?? ""} Carta ${day ? "diurna" : "nocturna"}. El trabajo consciente es usar el don sin entregar el timón a la sombra.`,
    `${planet.name} in ${planet.sign} (house ${planet.house}) names ${fn(planet.name, lang)}. Condition: ${planetConditionLine(chart, planet, lang)}. It does not “make” a character: it offers a way to exercise that function in the territory of ${HOUSE_DOMAIN[lang][planet.house]}. Aspects that nuance it: ${aspText}. ${recNotes[0] ?? ""} ${day ? "Diurnal" : "Nocturnal"} chart. Conscious work is to use the gift without handing the helm to the shadow.`,
  );

  const d = getPlanetDignity(planet.name, planet.sign);
  const strengths = [
    t(lang, `Función de ${planet.name} disponible en idioma ${planet.sign}.`, `${planet.name}'s function available in ${planet.sign} language.`),
    houseClass(planet.house) === "angular"
      ? t(lang, "Posición angular: la función se hace visible y precipita hechos.", "Angular position: the function becomes visible and precipitates events.")
      : t(lang, `Opera en casa ${planet.house}: el escenario de la función está claro.`, `It operates in house ${planet.house}: the stage of the function is clear.`),
    d === "domicilio" || d === "exaltación"
      ? t(lang, "Dignidad esencial favorable: menos fricción para actuar con eficacia.", "Favourable essential dignity: less friction in acting effectively.")
      : t(lang, "Aunque la dignidad no sea máxima, el oficio se aprende: la carta no es una sentencia.", "Even without peak dignity, craft is learned: the chart is not a sentence."),
  ];

  const challenges = [
    d === "caída" || d === "detrimento"
      ? t(lang, "Dignidad esencial tensa: la función pide más conciencia para no caricaturizarse.", "Tense essential dignity: the function asks for more awareness so it does not become a caricature.")
      : t(lang, "El riesgo habitual es identificar todo el yo con esta función.", "The usual risk is identifying the whole self with this function."),
    planet.retrograde
      ? t(lang, "Retrógrado: conviene revisar antes de empujar; no es defecto, es método.", "Retrograde: review before pushing; not a defect, a method.")
      : t(lang, "Si se ignora la casa opuesta, el planeta se vuelve unilateral.", "If the opposite house is ignored, the planet becomes one-sided."),
    asps.find((a) => a.aspect_name === "Cuadratura" || a.aspect_name === "Oposición")
      ? t(lang, "Hay aspecto tenso que exige decisión, no drama.", "A hard aspect asks for decision, not drama.")
      : t(lang, "Con aspectos fluidos, el desafío es no dejar el don en potencial.", "With flowing aspects, the challenge is not to leave the gift unused."),
  ];

  const growth = t(
    lang,
    `Practicar ${fn(planet.name, lang)} en ${HOUSE_DOMAIN[lang][planet.house]} con el estilo de ${planet.sign}, usando los aspectos como diálogo interior. ${houseSyn.ruler_condition}`,
    `Practise ${fn(planet.name, lang)} in ${HOUSE_DOMAIN[lang][planet.house]} in the style of ${planet.sign}, using aspects as inner dialogue. ${houseSyn.ruler_condition}`,
  );

  return {
    title: t(lang, `${planet.name} en ${planet.sign}`, `${planet.name} in ${planet.sign}`),
    subtitle: t(lang, `Casa ${planet.house} · ${houseSyn.name}`, `House ${planet.house} · ${houseSyn.name}`),
    principal,
    strengths,
    challenges,
    growth,
    keywords: [planet.name, planet.sign, t(lang, `casa ${planet.house}`, `house ${planet.house}`), dig ?? classLabel(planet.house, lang)].filter(Boolean) as string[],
    keyphrase: t(
      lang,
      `${planet.name} en ${planet.sign}: ${fn(planet.name, lang)} se entrena en casa ${planet.house}.`,
      `${planet.name} in ${planet.sign}: ${fn(planet.name, lang)} is trained in house ${planet.house}.`,
    ),
    house_synthesis: houseSyn,
  };
}

export function generateAspectSynthesis(
  chart: ChartResponse,
  aspect: Aspect,
  lang: Lang = "es",
): NatalInterpretation {
  const a = planetByName(chart, aspect.planet1);
  const b = planetByName(chart, aspect.planet2);
  const rec = a && b ? receptionNote(a, b, lang) : null;
  const exact = exactness(aspect.orb, lang);
  const app = applyWord(aspect.applying, lang);
  const kind = aspect.aspect_name;

  const bond =
    kind === "Conjunción"
      ? t(lang, "fusión de dos funciones en un mismo acto", "fusion of two functions in one act")
      : kind === "Oposición"
        ? t(lang, "eje de polaridad que pide un tercero consciente", "polarity axis that asks for a conscious third")
        : kind === "Cuadratura"
          ? t(lang, "fricción que obliga a decidir y a construir músculo", "friction that forces decision and builds muscle")
          : kind === "Trígono"
            ? t(lang, "facilidad de circulación que hay que usar, no dormir", "ease of circulation that must be used, not slept through")
            : t(lang, "puente de oportunidad que requiere un paso voluntario", "bridge of opportunity that requires a voluntary step");

  const principal = t(
    lang,
    `${aspect.planet1} (${a ? planetConditionLine(chart, a, lang) : fn(aspect.planet1, lang)}) forma ${kind.toLowerCase()} con ${aspect.planet2} (${b ? planetConditionLine(chart, b, lang) : fn(aspect.planet2, lang)}). Orbe ${aspect.orb.toFixed(2)}° — ${exact}; ${app}. El vínculo es ${bond}. ${rec ?? "No hay recepción por domicilio entre ambos."} ${fn(aspect.planet1, lang)} y ${fn(aspect.planet2, lang)} no son enemigos ni un destino: son dos instrumentos que pueden afinarse el uno al otro. Un orbe amplio sugiere un tema de fondo; uno exacto, un sello de carácter más nítido.`,
    `${aspect.planet1} (${a ? planetConditionLine(chart, a, lang) : fn(aspect.planet1, lang)}) forms a ${kind.toLowerCase()} with ${aspect.planet2} (${b ? planetConditionLine(chart, b, lang) : fn(aspect.planet2, lang)}). Orb ${aspect.orb.toFixed(2)}° — ${exact}; ${app}. The bond is ${bond}. ${rec ?? "There is no domicile reception between them."} ${fn(aspect.planet1, lang)} and ${fn(aspect.planet2, lang)} are neither enemies nor a fate: they are two instruments that can tune each other. A wide orb suggests a background theme; an exact one, a sharper character seal.`,
  );

  const hard = kind === "Cuadratura" || kind === "Oposición";
  return {
    title: `${aspect.planet1} ${kind} ${aspect.planet2}`,
    subtitle: `${aspect.orb.toFixed(2)}° · ${aspect.applying ? t(lang, "aplicante", "applying") : t(lang, "separante", "separating")} · ${exact}`,
    principal,
    strengths: [
      t(lang, `Diálogo posible entre ${fn(aspect.planet1, lang)} y ${fn(aspect.planet2, lang)}.`, `Possible dialogue between ${fn(aspect.planet1, lang)} and ${fn(aspect.planet2, lang)}.`),
      rec
        ? t(lang, "La recepción suaviza el pacto y da palanca de negociación.", "Reception softens the pact and gives negotiating leverage.")
        : t(lang, "Aunque no haya recepción, el aspecto sigue siendo un canal de trabajo.", "Even without reception, the aspect remains a working channel."),
      aspect.orb < 1
        ? t(lang, "Exactitud: el sello es nítido y reconocible en la biografía.", "Exactness: the seal is sharp and recognisable in the biography.")
        : t(lang, "El orbe deja margen: el tema se activa por elección y por ciclos.", "The orb leaves room: the theme activates by choice and by cycles."),
    ],
    challenges: [
      hard
        ? t(lang, "La tensión no se resuelve con huida: pide un acto concreto.", "The tension is not resolved by flight: it asks for a concrete act.")
        : t(lang, "La facilidad puede adormecer: el don no usado se vuelve vanidad.", "Ease can lull: an unused gift becomes vanity."),
      t(lang, `Proyectar ${aspect.planet2} en otros para no sostener ${aspect.planet1} (o al revés).`, `Projecting ${aspect.planet2} onto others so as not to hold ${aspect.planet1} (or the reverse).`),
      t(lang, "Tratar el aspecto como sentencia en vez de como clima de trabajo.", "Treating the aspect as a sentence instead of a working climate."),
    ],
    growth: t(
      lang,
      `Usar ${kind.toLowerCase()} como práctica: cuando se active ${aspect.planet1}, preguntar qué pide ${aspect.planet2}, y al revés. ${app}.`,
      `Use the ${kind.toLowerCase()} as practice: when ${aspect.planet1} activates, ask what ${aspect.planet2} wants, and the reverse. ${app}.`,
    ),
    keywords: [aspect.planet1, aspect.planet2, kind, exact.split(" ")[0]],
    keyphrase: t(
      lang,
      `${aspect.planet1} y ${aspect.planet2} en ${kind.toLowerCase()}: ${bond}.`,
      `${aspect.planet1} and ${aspect.planet2} in ${kind.toLowerCase()}: ${bond}.`,
    ),
  };
}

export function houseSynthesisToNatal(h: HouseSynthesis, lang: Lang): NatalInterpretation {
  const toneLabel: Record<HouseTone, { es: string; en: string }> = {
    constructive: { es: "clima constructivo", en: "constructive climate" },
    challenging: { es: "clima exigente", en: "demanding climate" },
    transformative: { es: "clima transformador", en: "transformative climate" },
    latent: { es: "clima latente", en: "latent climate" },
  };
  return {
    title: t(lang, `Casa ${h.house}: ${h.name}`, `House ${h.house}: ${h.name}`),
    subtitle: toneLabel[h.overall_tone][lang],
    principal: h.synthesis,
    strengths: [h.ruler_condition, h.angular_connection],
    challenges: [
      h.overall_tone === "latent"
        ? t(lang, "El tema puede pasar desapercibido hasta que un tránsito lo despierte.", "The theme may go unnoticed until a transit wakes it.")
        : t(lang, "Identificar toda la vida con este recinto empobrece el resto de la carta.", "Identifying the whole life with this enclosure impoverishes the rest of the chart."),
      t(lang, "Leer la casa sin el regente es una media verdad.", "Reading the house without its ruler is a half-truth."),
    ],
    growth: t(
      lang,
      `Tratar la casa ${h.house} como un taller, no como un veredicto. El regente indica la práctica.`,
      `Treat house ${h.house} as a workshop, not a verdict. The ruler indicates the practice.`,
    ),
    keywords: [h.name, `C${h.house}`, h.overall_tone],
    keyphrase: t(lang, `Casa ${h.house}: ${h.name} — ${toneLabel[h.overall_tone].es}.`, `House ${h.house}: ${h.name} — ${toneLabel[h.overall_tone].en}.`),
    house_synthesis: h,
  };
}

export function angleAnalysisToNatal(a: AngleDeepAnalysis): NatalInterpretation {
  return {
    title: a.title,
    subtitle: a.subtitle,
    principal: a.principal,
    strengths: a.strengths,
    challenges: a.challenges,
    growth: a.growth,
    keywords: a.keywords,
    keyphrase: a.keyphrase,
    angle_analysis: a,
  };
}
