import type { ChartResponse } from "./types";
import { SIGN_ELEMENT } from "./zodiac-utils";
import type { Lang } from "./i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SolarReturnSummary {
  year_theme: string;
  asc_interpretation: string;
  mc_interpretation: string;
  angular_planets: { planet: string; symbol: string; house: number; interpretation: string }[];
  stelliums: { house: number; planets: string[]; symbols: string[]; focus: string }[];
  key_aspects: { description: string; nature: "armonioso" | "tenso" | "neutro"; orb: number }[];
  dominant_element: string;
  element_counts: Record<string, number>;
  opportunities: string[];
  challenges: string[];
  advice: string;
}

// ── ASC sign interpretations ──────────────────────────────────────────────────

const ASC_THEME_ES: Record<string, string> = {
  Aries:       "Año de acción, nuevos comienzos y autonomía personal",
  Tauro:       "Año de consolidación, estabilidad material y disfrute sensorial",
  "Géminis":   "Año de comunicación, aprendizaje y versatilidad",
  "Cáncer":    "Año centrado en hogar, familia y vida emocional",
  Leo:         "Año de autoexpresión, creatividad y reconocimiento",
  Virgo:       "Año de trabajo enfocado, salud y perfeccionamiento",
  Libra:       "Año de relaciones, equilibrio y colaboración",
  Escorpio:    "Año de transformación profunda, poder e intimidad",
  Sagitario:   "Año de expansión, viajes y horizontes filosóficos",
  Capricornio: "Año de ambición, carrera y construcción a largo plazo",
  Acuario:     "Año de innovación, proyectos colectivos y libertad",
  Piscis:      "Año de espiritualidad, creatividad e intuición elevada",
};

const ASC_THEME_EN: Record<string, string> = {
  Aries:       "A year of action, new beginnings, and personal autonomy",
  Tauro:       "A year of consolidation, material stability, and sensory pleasure",
  "Géminis":   "A year of communication, learning, and versatility",
  "Cáncer":    "A year centered on home, family, and emotional life",
  Leo:         "A year of self-expression, creativity, and recognition",
  Virgo:       "A year of focused work, health, and refinement",
  Libra:       "A year of relationships, balance, and collaboration",
  Escorpio:    "A year of deep transformation, power, and intimacy",
  Sagitario:   "A year of expansion, travel, and philosophical horizons",
  Capricornio: "A year of ambition, career, and long-term building",
  Acuario:     "A year of innovation, collective projects, and freedom",
  Piscis:      "A year of spirituality, creativity, and elevated intuition",
};

const ASC_DETAIL_ES: Record<string, string> = {
  Aries:
    "El Ascendente Aries en el Retorno Solar marca un año de iniciativa y determinación. Tendrás mayor impulso para comenzar proyectos, afirmar tu voluntad y actuar con rapidez. Marte rige este período: la energía es alta pero puede ser impaciente.",
  "Géminis":
    "El Ascendente Géminis señala un año de gran actividad mental y social. Multiplicidad de proyectos, conversaciones importantes y desplazamientos frecuentes. Mercurio rige el año: la palabra y el pensamiento son tus herramientas principales.",
  "Cáncer":
    "El Ascendente Cáncer lleva la atención hacia el hogar, la familia y las raíces emocionales. La Luna rige este período: la sensibilidad está en primer plano y el bienestar personal depende de la seguridad afectiva.",
  Leo:
    "El Ascendente Leo pone el foco en la autoexpresión y el reconocimiento. El Sol rige este año solar: hay potencial para destacar, liderar y crear. La identidad personal brilla con más fuerza.",
  Virgo:
    "El Ascendente Virgo orienta el año hacia el análisis, la salud y la eficiencia. Mercurio rige este período con un tono más reflexivo: organización, método y cuidado del cuerpo serán prioritarios.",
  Libra:
    "El Ascendente Libra coloca las relaciones en el centro del año. Venus rige este período: las asociaciones —personales y profesionales— definen el tono. Buscas equilibrio y armonía en todos los planos.",
  Escorpio:
    "El Ascendente Escorpio indica un año de transformaciones profundas. Plutón y Marte rigen este período de intensidad psicológica: lo que ya no sirve se disuelve para dar paso a una versión más auténtica de ti mismo.",
  Sagitario:
    "El Ascendente Sagitario abre el año hacia la expansión y el conocimiento. Júpiter rige este período optimista: viajes, educación superior y búsqueda de sentido amplían tus horizontes.",
  Capricornio:
    "El Ascendente Capricornio orienta el año hacia metas concretas y responsabilidad. Saturno rige este período de disciplina: los logros son posibles pero exigen constancia y estructura.",
  Acuario:
    "El Ascendente Acuario marca un año de originalidad, proyectos colectivos y libertad. Urano y Saturno rigen este período: lo convencional se rompe para dar lugar a nuevas formas de vida y comunidad.",
  Piscis:
    "El Ascendente Piscis lleva el año hacia la dimensión sutil y espiritual. Neptuno rige este período de sensibilidad elevada: la intuición, la creatividad y la empatía son los recursos más valiosos.",
  Tauro:
    "El Ascendente Tauro orienta el año hacia la seguridad material y el placer. Venus rige este período de consolidación: construir sobre bases sólidas, disfrutar lo que tienes y desarrollar la paciencia son los temas dominantes.",
};

const ASC_DETAIL_EN: Record<string, string> = {
  Aries:
    "Aries Rising on the Solar Return marks a year of initiative and determination. You will have greater drive to start projects, assert your will, and act quickly. Mars rules this period — energy is high but can be impatient.",
  "Géminis":
    "Gemini Rising signals a year of intense mental and social activity. Multiple projects, important conversations, and frequent movement. Mercury rules the year — words and thought are your primary tools.",
  "Cáncer":
    "Cancer Rising draws attention to home, family, and emotional roots. The Moon rules this period — sensitivity is at the forefront and personal well-being depends on emotional security.",
  Leo:
    "Leo Rising puts the spotlight on self-expression and recognition. The Sun rules this solar year — there is potential to stand out, lead, and create. Personal identity shines with greater force.",
  Virgo:
    "Virgo Rising orients the year toward analysis, health, and efficiency. Mercury rules this period with a more reflective tone — organization, method, and care for the body will be priorities.",
  Libra:
    "Libra Rising places relationships at the center of the year. Venus rules this period — personal and professional partnerships define the tone. You seek balance and harmony on all levels.",
  Escorpio:
    "Scorpio Rising indicates a year of deep transformations. Pluto and Mars rule this period of psychological intensity — what no longer serves you dissolves to make way for a more authentic version of yourself.",
  Sagitario:
    "Sagittarius Rising opens the year toward expansion and knowledge. Jupiter rules this optimistic period — travel, higher education, and the search for meaning broaden your horizons.",
  Capricornio:
    "Capricorn Rising orients the year toward concrete goals and responsibility. Saturn rules this disciplined period — achievements are possible but demand consistency and structure.",
  Acuario:
    "Aquarius Rising marks a year of originality, collective projects, and freedom. Uranus and Saturn rule this period — the conventional breaks down to make room for new ways of living and community.",
  Piscis:
    "Pisces Rising carries the year toward the subtle and spiritual dimension. Neptune rules this period of heightened sensitivity — intuition, creativity, and empathy are the most valuable resources.",
  Tauro:
    "Taurus Rising orients the year toward material security and pleasure. Venus rules this consolidation period — building on solid foundations, enjoying what you have, and developing patience are the dominant themes.",
};

// ── MC sign interpretations ───────────────────────────────────────────────────

const MC_DETAIL_ES: Record<string, string> = {
  Aries:       "El MC en Aries empuja a tomar iniciativa en la carrera. Año de lanzar proyectos profesionales propios.",
  Tauro:       "El MC en Tauro favorece la estabilidad y el reconocimiento material en tu área profesional.",
  "Géminis":   "El MC en Géminis abre puertas a través de la comunicación, la escritura y la red de contactos.",
  "Cáncer":    "El MC en Cáncer vincula logros profesionales con el bienestar emocional y el cuidado de otros.",
  Leo:         "El MC en Leo propicia un año de visibilidad, liderazgo y reconocimiento público destacado.",
  Virgo:       "El MC en Virgo favorece el trabajo metódico, la especialización técnica y la utilidad práctica.",
  Libra:       "El MC en Libra abre camino a través de asociaciones estratégicas y habilidades diplomáticas.",
  Escorpio:    "El MC en Escorpio marca una dirección profesional de poder, investigación o transformación.",
  Sagitario:   "El MC en Sagitario orienta hacia la expansión profesional, la docencia o el trabajo internacional.",
  Capricornio: "El MC en Capricornio es uno de los más fuertes para la ambición: estructura, autoridad y metas claras.",
  Acuario:     "El MC en Acuario impulsa proyectos innovadores, tecnología o trabajo en red con grupos.",
  Piscis:      "El MC en Piscis orienta hacia vocaciones artísticas, terapéuticas o espirituales.",
};

const MC_DETAIL_EN: Record<string, string> = {
  Aries:       "MC in Aries pushes you to take initiative in your career. A year for launching your own professional projects.",
  Tauro:       "MC in Taurus favors stability and material recognition in your professional field.",
  "Géminis":   "MC in Gemini opens doors through communication, writing, and networking.",
  "Cáncer":    "MC in Cancer links professional achievements with emotional well-being and caring for others.",
  Leo:         "MC in Leo brings a year of visibility, leadership, and outstanding public recognition.",
  Virgo:       "MC in Virgo favors methodical work, technical specialization, and practical usefulness.",
  Libra:       "MC in Libra paves the way through strategic partnerships and diplomatic skills.",
  Escorpio:    "MC in Scorpio marks a professional direction of power, research, or transformation.",
  Sagitario:   "MC in Sagittarius points toward professional expansion, teaching, or international work.",
  Capricornio: "MC in Capricorn is one of the strongest for ambition: structure, authority, and clear goals.",
  Acuario:     "MC in Aquarius drives innovative projects, technology, or network-based group work.",
  Piscis:      "MC in Pisces points toward artistic, therapeutic, or spiritual vocations.",
};

// ── Angular planet interpretations ───────────────────────────────────────────

const ANGULAR_PLANET_ES: Record<string, Record<number, string>> = {
  Sol: {
    1: "El Sol en Casa 1 del RS es extraordinariamente significativo: tu identidad y vitalidad están en primer plano todo el año.",
    4: "El Sol en Casa 4 centra el año en el hogar, la familia y las raíces. Puede haber cambios de residencia o trabajo desde casa.",
    7: "El Sol en Casa 7 pone las relaciones íntimas y los socios en el centro del año.",
    10: "El Sol en Casa 10 es uno de los mejores indicadores de reconocimiento profesional y avance en la carrera.",
  },
  Luna: {
    1: "La Luna en Casa 1 hace el año muy emocional y reactivo. Alta sensibilidad ante el entorno.",
    4: "La Luna en Casa 4 profundiza la vida familiar y doméstica. El hogar como refugio emocional.",
    7: "La Luna en Casa 7 indica relaciones afectivas muy activas. Las emociones se proyectan en la pareja.",
    10: "La Luna en Casa 10 vincula la carrera con el público o el cuidado de otros. Imagen pública fluctuante.",
  },
  Saturno: {
    1: "Saturno en Casa 1 exige madurez y autodisciplina. Año de asumir responsabilidades importantes.",
    4: "Saturno en Casa 4 puede traer restricciones en el hogar o responsabilidades familiares serias.",
    7: "Saturno en Casa 7 pone a prueba las relaciones. Se consolidan o se acaban las que no tienen bases sólidas.",
    10: "Saturno en Casa 10 marca un año de trabajo duro en la carrera, con resultados tangibles a largo plazo.",
  },
  Júpiter: {
    1: "Júpiter en Casa 1 del RS es uno de los mejores augurios: expansión personal, optimismo y nuevas oportunidades.",
    4: "Júpiter en Casa 4 trae crecimiento en la vida familiar, posible mudanza a algo mejor o reunificación familiar.",
    7: "Júpiter en Casa 7 expande las relaciones de manera significativa. Muy favorable para matrimonio o sociedad.",
    10: "Júpiter en Casa 10 impulsa la carrera con oportunidades de crecimiento y reconocimiento notables.",
  },
  Marte: {
    1: "Marte en Casa 1 carga el año de energía, competitividad y potencial conflicto. Alta capacidad de acción.",
    4: "Marte en Casa 4 puede generar tensiones domésticas o mucha actividad en el hogar y familia.",
    7: "Marte en Casa 7 activa las relaciones, que pueden ser apasionadas o conflictivas según el contexto.",
    10: "Marte en Casa 10 impulsa la ambición profesional y la capacidad de luchar por tus metas.",
  },
  Venus: {
    1: "Venus en Casa 1 embellece la personalidad y el año: encanto, relaciones y disfrute están resaltados.",
    4: "Venus en Casa 4 armoniza la vida doméstica. Buen año para decorar el hogar o mejorar la convivencia.",
    7: "Venus en Casa 7 favorece el amor, el romance y las asociaciones armoniosas.",
    10: "Venus en Casa 10 facilita el éxito profesional a través del encanto y la diplomacia.",
  },
  Plutón: {
    1: "Plutón en Casa 1 indica una metamorfosis profunda en la identidad. El año puede sentirse intenso y transformador.",
    4: "Plutón en Casa 4 trae transformaciones radicales en el hogar, la familia o el inconsciente.",
    7: "Plutón en Casa 7 intensifica las relaciones al máximo: pueden ser transformadoras o muy demandantes.",
    10: "Plutón en Casa 10 marca una reorientación profunda de la carrera o del poder en el ámbito público.",
  },
  Urano: {
    1: "Urano en Casa 1 es disruptivo en lo personal: cambios bruscos en la identidad, el aspecto o el estilo de vida.",
    4: "Urano en Casa 4 puede traer cambios inesperados de residencia o tensiones familiares repentinas.",
    7: "Urano en Casa 7 sacude las relaciones: llegada o partida súbita de personas importantes.",
    10: "Urano en Casa 10 puede traer cambios inesperados en la carrera — giros radicales de dirección.",
  },
  Neptuno: {
    1: "Neptuno en Casa 1 difumina los límites del yo. Año de alta sensibilidad, espiritualidad y posible confusión.",
    4: "Neptuno en Casa 4 idealiza el hogar o disuelve sus estructuras. Cuidado con escapismo doméstico.",
    7: "Neptuno en Casa 7 romanticiza las relaciones. Riesgo de idealización; potencial de conexión profunda.",
    10: "Neptuno en Casa 10 puede traer confusión en la carrera o vocación espiritual/artística emergente.",
  },
};

const ANGULAR_PLANET_EN: Record<string, Record<number, string>> = {
  Sol: {
    1: "The Sun in House 1 of the Solar Return is extraordinarily significant: your identity and vitality are front and center throughout the year.",
    4: "The Sun in House 4 focuses the year on home, family, and roots. There may be changes of residence or working from home.",
    7: "The Sun in House 7 places intimate relationships and partners at the center of the year.",
    10: "The Sun in House 10 is one of the best indicators of professional recognition and career advancement.",
  },
  Luna: {
    1: "The Moon in House 1 makes the year highly emotional and reactive. High sensitivity to the environment.",
    4: "The Moon in House 4 deepens family and domestic life. Home as an emotional refuge.",
    7: "The Moon in House 7 indicates very active affective relationships. Emotions are projected onto the partner.",
    10: "The Moon in House 10 links career with the public or caring for others. Fluctuating public image.",
  },
  Saturno: {
    1: "Saturn in House 1 demands maturity and self-discipline. A year for taking on important responsibilities.",
    4: "Saturn in House 4 may bring restrictions at home or serious family responsibilities.",
    7: "Saturn in House 7 tests relationships. Those without solid foundations consolidate or end.",
    10: "Saturn in House 10 marks a year of hard work in the career, with tangible long-term results.",
  },
  Júpiter: {
    1: "Jupiter in House 1 of the Solar Return is one of the best omens: personal expansion, optimism, and new opportunities.",
    4: "Jupiter in House 4 brings growth in family life, a possible move to something better, or family reunion.",
    7: "Jupiter in House 7 significantly expands relationships. Very favorable for marriage or partnership.",
    10: "Jupiter in House 10 boosts the career with notable growth opportunities and recognition.",
  },
  Marte: {
    1: "Mars in House 1 charges the year with energy, competitiveness, and potential conflict. High capacity for action.",
    4: "Mars in House 4 may generate domestic tensions or intense activity at home and with family.",
    7: "Mars in House 7 activates relationships, which can be passionate or conflictual depending on the context.",
    10: "Mars in House 10 drives professional ambition and the capacity to fight for your goals.",
  },
  Venus: {
    1: "Venus in House 1 beautifies the personality and the year: charm, relationships, and enjoyment are highlighted.",
    4: "Venus in House 4 harmonizes domestic life. A good year to redecorate the home or improve cohabitation.",
    7: "Venus in House 7 favors love, romance, and harmonious partnerships.",
    10: "Venus in House 10 facilitates professional success through charm and diplomacy.",
  },
  Plutón: {
    1: "Pluto in House 1 indicates a deep metamorphosis of identity. The year may feel intense and transformative.",
    4: "Pluto in House 4 brings radical transformations in the home, family, or the unconscious.",
    7: "Pluto in House 7 intensifies relationships to the maximum: they can be transformative or highly demanding.",
    10: "Pluto in House 10 marks a deep reorientation of the career or of power in the public sphere.",
  },
  Urano: {
    1: "Uranus in House 1 is disruptive on a personal level: sudden changes in identity, appearance, or lifestyle.",
    4: "Uranus in House 4 may bring unexpected changes of residence or sudden family tensions.",
    7: "Uranus in House 7 shakes up relationships: sudden arrivals or departures of important people.",
    10: "Uranus in House 10 may bring unexpected changes in the career — radical shifts in direction.",
  },
  Neptuno: {
    1: "Neptune in House 1 blurs the boundaries of the self. A year of high sensitivity, spirituality, and possible confusion.",
    4: "Neptune in House 4 idealizes the home or dissolves its structures. Watch for domestic escapism.",
    7: "Neptune in House 7 romanticizes relationships. Risk of idealization; potential for deep connection.",
    10: "Neptune in House 10 may bring confusion in the career or an emerging spiritual/artistic vocation.",
  },
};

// ── Aspect interpretations ────────────────────────────────────────────────────

const ASPECT_NATURE: Record<string, "armonioso" | "tenso" | "neutro"> = {
  "Conjunción": "neutro",
  "Trígono":    "armonioso",
  "Sextil":     "armonioso",
  "Oposición":  "tenso",
  "Cuadratura": "tenso",
  "Quincuncio": "tenso",
};

// ── Stellium house meanings ───────────────────────────────────────────────────

const HOUSE_FOCUS_ES: Record<number, string> = {
  1:  "identidad y presencia personal",
  2:  "recursos, finanzas y valores propios",
  3:  "comunicación, aprendizaje y entorno próximo",
  4:  "hogar, familia y raíces emocionales",
  5:  "creatividad, romance y autoexpresión",
  6:  "trabajo diario, salud y rutinas",
  7:  "relaciones íntimas y asociaciones",
  8:  "transformación, recursos compartidos y profundidad",
  9:  "expansión, viajes y filosofía de vida",
  10: "carrera, vocación y reconocimiento público",
  11: "amigos, proyectos colectivos y metas futuras",
  12: "interioridad, espiritualidad y procesos ocultos",
};

const HOUSE_FOCUS_EN: Record<number, string> = {
  1:  "identity and personal presence",
  2:  "resources, finances, and personal values",
  3:  "communication, learning, and immediate environment",
  4:  "home, family, and emotional roots",
  5:  "creativity, romance, and self-expression",
  6:  "daily work, health, and routines",
  7:  "intimate relationships and partnerships",
  8:  "transformation, shared resources, and depth",
  9:  "expansion, travel, and philosophy of life",
  10: "career, vocation, and public recognition",
  11: "friends, collective projects, and future goals",
  12: "inner life, spirituality, and hidden processes",
};

// ── Main generator ────────────────────────────────────────────────────────────

export function generateSolarReturnSummary(sr: ChartResponse, lang: Lang = "es"): SolarReturnSummary {
  const ascSign = sr.ascendant.sign;
  const mcSign  = sr.midheaven.sign;

  const ASC_THEME  = lang === "en" ? ASC_THEME_EN  : ASC_THEME_ES;
  const ASC_DETAIL = lang === "en" ? ASC_DETAIL_EN : ASC_DETAIL_ES;
  const MC_DETAIL  = lang === "en" ? MC_DETAIL_EN  : MC_DETAIL_ES;
  const ANGULAR_PLANET = lang === "en" ? ANGULAR_PLANET_EN : ANGULAR_PLANET_ES;
  const HOUSE_FOCUS    = lang === "en" ? HOUSE_FOCUS_EN    : HOUSE_FOCUS_ES;

  // ── Year theme
  const year_theme = ASC_THEME[ascSign] ??
    (lang === "en"
      ? `A year with ${ascSign} on the Ascendant`
      : `Año con ${ascSign} en el Ascendente`);

  // ── ASC / MC interpretations
  const asc_interpretation = ASC_DETAIL[ascSign] ??
    (lang === "en"
      ? `${ascSign} Rising in the Solar Return defines the tone and energy of the year.`
      : `El Ascendente ${ascSign} en el Retorno Solar define el tono y la energía del año.`);

  const mc_interpretation = MC_DETAIL[mcSign] ??
    (lang === "en"
      ? `MC in ${mcSign} orients the professional and public direction of the year.`
      : `El MC en ${mcSign} orienta la dirección profesional y pública del año.`);

  // ── Angular planets (houses 1, 4, 7, 10)
  const ANGULAR = new Set([1, 4, 7, 10]);
  const angular_planets = sr.planets
    .filter((p) => ANGULAR.has(p.house))
    .slice(0, 4)
    .map((p) => ({
      planet: p.name,
      symbol: p.symbol,
      house:  p.house,
      interpretation:
        ANGULAR_PLANET[p.name]?.[p.house] ??
        (lang === "en"
          ? `${p.name} in House ${p.house} of the Solar Return activates this life axis during the year.`
          : `${p.name} en Casa ${p.house} del Retorno Solar activa este eje de vida durante el año.`),
    }));

  // ── Stelliums (3+ planets in same house)
  const houseCount: Record<number, { name: string; symbol: string }[]> = {};
  for (const p of sr.planets) {
    if (!houseCount[p.house]) houseCount[p.house] = [];
    houseCount[p.house].push({ name: p.name, symbol: p.symbol });
  }
  const stelliums = Object.entries(houseCount)
    .filter(([, ps]) => ps.length >= 3)
    .map(([h, ps]) => ({
      house:   Number(h),
      planets: ps.map((p) => p.name),
      symbols: ps.map((p) => p.symbol),
      focus:   HOUSE_FOCUS[Number(h)] ?? (lang === "en" ? `House ${h}` : `Casa ${h}`),
    }));

  // ── Key aspects (tight orbs, major only)
  const MAJOR = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);
  const key_aspects = sr.aspects
    .filter((a) => MAJOR.has(a.aspect_name) && a.orb <= 2.5)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 5)
    .map((a) => ({
      description: `${a.planet1} ${a.aspect_name} ${a.planet2}`,
      nature: ASPECT_NATURE[a.aspect_name] ?? "neutro" as "neutro",
      orb: a.orb,
    }));

  // ── Element distribution
  const element_counts: Record<string, number> = { fuego: 0, tierra: 0, aire: 0, agua: 0 };
  for (const p of sr.planets) {
    const el = SIGN_ELEMENT[p.sign];
    if (el) element_counts[el] = (element_counts[el] ?? 0) + 1;
  }
  const dominant_element = Object.entries(element_counts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "fuego";

  // ── Opportunities (harmonic aspects + angular benefics)
  const opportunities: string[] = [];
  const harmonicAspects = sr.aspects.filter(
    (a) => (a.aspect_name === "Trígono" || a.aspect_name === "Sextil") && a.orb <= 3
  );
  if (harmonicAspects.length > 3) {
    opportunities.push(
      lang === "en"
        ? `${harmonicAspects.length} active trines and sextiles — constructive energy flow`
        : `${harmonicAspects.length} trígonos y sextiles activos — flujo de energía constructiva`
    );
  }
  if (sr.planets.some((p) => p.name === "Júpiter" && ANGULAR.has(p.house))) {
    const jupHouse = sr.planets.find((p) => p.name === "Júpiter")!.house;
    opportunities.push(
      lang === "en"
        ? `Angular Jupiter — significant expansion in the area of House ${jupHouse}`
        : `Júpiter angular — expansión significativa en el área de Casa ${jupHouse}`
    );
  }
  if (sr.planets.some((p) => p.name === "Venus" && ANGULAR.has(p.house))) {
    opportunities.push(
      lang === "en"
        ? "Angular Venus — relationships and pleasure highlighted"
        : "Venus angular — relaciones y placer destacados"
    );
  }
  if (stelliums.length > 0) {
    opportunities.push(
      lang === "en"
        ? `Stellium in House ${stelliums[0].house} — concentration of energy in ${stelliums[0].focus}`
        : `Stellium en Casa ${stelliums[0].house} — concentración de energía en ${stelliums[0].focus}`
    );
  }
  if (dominant_element === "fuego") {
    opportunities.push(
      lang === "en"
        ? "Fire dominance — elevated motivation, enthusiasm, and capacity for action"
        : "Predominio de fuego — motivación, entusiasmo y capacidad de acción elevados"
    );
  } else if (dominant_element === "aire") {
    opportunities.push(
      lang === "en"
        ? "Air dominance — communication, ideas, and networking flow easily"
        : "Predominio de aire — comunicación, ideas y networking fluidos"
    );
  }

  // ── Challenges (tense aspects + difficult angular planets)
  const challenges: string[] = [];
  const tenseAspects = sr.aspects.filter(
    (a) => (a.aspect_name === "Cuadratura" || a.aspect_name === "Oposición") && a.orb <= 2
  );
  if (tenseAspects.length > 2) {
    challenges.push(
      lang === "en"
        ? `${tenseAspects.length} exact squares/oppositions — tensions that drive growth`
        : `${tenseAspects.length} cuadraturas/oposiciones exactas — tensiones que impulsan el crecimiento`
    );
  }
  if (sr.planets.some((p) => p.name === "Saturno" && ANGULAR.has(p.house))) {
    challenges.push(
      lang === "en"
        ? "Angular Saturn — a year of tests, responsibilities, and structuring"
        : "Saturno angular — año de pruebas, responsabilidades y estructuración"
    );
  }
  if (sr.planets.some((p) => p.name === "Plutón" && ANGULAR.has(p.house))) {
    challenges.push(
      lang === "en"
        ? "Angular Pluto — intense transformations that cannot be avoided"
        : "Plutón angular — transformaciones intensas que no pueden evitarse"
    );
  }
  if (sr.planets.some((p) => p.name === "Marte" && ANGULAR.has(p.house))) {
    challenges.push(
      lang === "en"
        ? "Angular Mars — elevated energy requiring conscious channeling"
        : "Marte angular — energía elevada que requiere canalización consciente"
    );
  }
  if (sr.planets.some((p) => p.retrograde && ANGULAR.has(p.house))) {
    challenges.push(
      lang === "en"
        ? "Retrograde angular planet — past themes resurface to be resolved"
        : "Planeta retrógrado angular — temas del pasado resurgen para ser resueltos"
    );
  }

  // ── Advice
  const ELEMENT_ADVICE_ES: Record<string, string> = {
    fuego:  "Canaliza la energía de fuego en proyectos concretos. El impulso está disponible — la disciplina marcará la diferencia entre entusiasmo y resultados.",
    tierra: "La energía de tierra favorece la construcción paciente. Trabaja con los recursos disponibles y prioriza la solidez sobre la velocidad.",
    aire:   "Tu mejor herramienta este año es la mente y la palabra. Conecta, aprende y comunica — las ideas que siembres ahora tienen largo alcance.",
    agua:   "La sensibilidad es tu recurso más valioso. Confía en la intuición, honra las emociones y no descuides el cuidado propio y de quienes amas.",
  };
  const ELEMENT_ADVICE_EN: Record<string, string> = {
    fuego:  "Channel fire energy into concrete projects. The drive is available — discipline will make the difference between enthusiasm and results.",
    tierra: "Earth energy favors patient building. Work with available resources and prioritize solidity over speed.",
    aire:   "Your best tool this year is the mind and the word. Connect, learn, and communicate — the ideas you plant now have long reach.",
    agua:   "Sensitivity is your most valuable resource. Trust your intuition, honor your emotions, and don't neglect self-care and those you love.",
  };
  const ELEMENT_ADVICE = lang === "en" ? ELEMENT_ADVICE_EN : ELEMENT_ADVICE_ES;
  const advice = ELEMENT_ADVICE[dominant_element] ??
    (lang === "en"
      ? `The Solar Return with ${ascSign} rising invites you to focus on what truly matters this year.`
      : `El Retorno Solar con ${ascSign} ascendente invita a enfocarte en lo que realmente importa este año.`);

  return {
    year_theme,
    asc_interpretation,
    mc_interpretation,
    angular_planets,
    stelliums,
    key_aspects,
    dominant_element,
    element_counts,
    opportunities,
    challenges,
    advice,
  };
}
