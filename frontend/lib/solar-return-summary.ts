import type { ChartResponse } from "./types";
import { SIGN_ELEMENT } from "./zodiac-utils";

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

const ASC_THEME: Record<string, string> = {
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

const ASC_DETAIL: Record<string, string> = {
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

// ── MC sign interpretations ───────────────────────────────────────────────────

const MC_DETAIL: Record<string, string> = {
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

// ── Angular planet interpretations ───────────────────────────────────────────

const ANGULAR_PLANET: Record<string, Record<number, string>> = {
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

const HOUSE_FOCUS: Record<number, string> = {
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

// ── Main generator ────────────────────────────────────────────────────────────

export function generateSolarReturnSummary(sr: ChartResponse): SolarReturnSummary {
  const ascSign = sr.ascendant.sign;
  const mcSign  = sr.midheaven.sign;

  // ── Year theme
  const year_theme = ASC_THEME[ascSign] ?? `Año con ${ascSign} en el Ascendente`;

  // ── ASC / MC interpretations
  const asc_interpretation = ASC_DETAIL[ascSign] ??
    `El Ascendente ${ascSign} en el Retorno Solar define el tono y la energía del año.`;
  const mc_interpretation = MC_DETAIL[mcSign] ??
    `El MC en ${mcSign} orienta la dirección profesional y pública del año.`;

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
        `${p.name} en Casa ${p.house} del Retorno Solar activa este eje de vida durante el año.`,
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
      focus:   HOUSE_FOCUS[Number(h)] ?? `Casa ${h}`,
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
  if (harmonicAspects.length > 3)
    opportunities.push(`${harmonicAspects.length} trígonos y sextiles activos — flujo de energía constructiva`);
  if (sr.planets.some((p) => p.name === "Júpiter" && ANGULAR.has(p.house)))
    opportunities.push("Júpiter angular — expansión significativa en el área de Casa " + sr.planets.find((p) => p.name === "Júpiter")!.house);
  if (sr.planets.some((p) => p.name === "Venus" && ANGULAR.has(p.house)))
    opportunities.push("Venus angular — relaciones y placer destacados");
  if (stelliums.length > 0)
    opportunities.push(`Stellium en Casa ${stelliums[0].house} — concentración de energía en ${stelliums[0].focus}`);
  if (dominant_element === "fuego")
    opportunities.push("Predominio de fuego — motivación, entusiasmo y capacidad de acción elevados");
  else if (dominant_element === "aire")
    opportunities.push("Predominio de aire — comunicación, ideas y networking fluidos");

  // ── Challenges (tense aspects + difficult angular planets)
  const challenges: string[] = [];
  const tenseAspects = sr.aspects.filter(
    (a) => (a.aspect_name === "Cuadratura" || a.aspect_name === "Oposición") && a.orb <= 2
  );
  if (tenseAspects.length > 2)
    challenges.push(`${tenseAspects.length} cuadraturas/oposiciones exactas — tensiones que impulsan el crecimiento`);
  if (sr.planets.some((p) => p.name === "Saturno" && ANGULAR.has(p.house)))
    challenges.push("Saturno angular — año de pruebas, responsabilidades y estructuración");
  if (sr.planets.some((p) => p.name === "Plutón" && ANGULAR.has(p.house)))
    challenges.push("Plutón angular — transformaciones intensas que no pueden evitarse");
  if (sr.planets.some((p) => p.name === "Marte" && ANGULAR.has(p.house)))
    challenges.push("Marte angular — energía elevada que requiere canalización consciente");
  if (sr.planets.some((p) => p.retrograde && ANGULAR.has(p.house)))
    challenges.push("Planeta retrógrado angular — temas del pasado resurgen para ser resueltos");

  // ── Advice
  const ELEMENT_ADVICE: Record<string, string> = {
    fuego:  "Canaliza la energía de fuego en proyectos concretos. El impulso está disponible — la disciplina marcará la diferencia entre entusiasmo y resultados.",
    tierra: "La energía de tierra favorece la construcción paciente. Trabaja con los recursos disponibles y prioriza la solidez sobre la velocidad.",
    aire:   "Tu mejor herramienta este año es la mente y la palabra. Conecta, aprende y comunica — las ideas que siembres ahora tienen largo alcance.",
    agua:   "La sensibilidad es tu recurso más valioso. Confía en la intuición, honra las emociones y no descuides el cuidado propio y de quienes amas.",
  };
  const advice = ELEMENT_ADVICE[dominant_element] ??
    `El Retorno Solar con ${ascSign} ascendente invita a enfocarte en lo que realmente importa este año.`;

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
