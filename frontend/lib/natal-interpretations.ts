import type { NatalInterpretation, PlanetPosition, HouseCusp, Aspect, AnglePoint } from "./types";

// ── PLANET ARCHETYPES ──────────────────────────────────────────────────────────

const PLANET_ARCHETYPE: Record<
  string,
  { function: string; gift: string; shadow: string; keywords: string[] }
> = {
  Sol: {
    function: "identidad y propósito vital",
    gift: "vitalidad creadora, voluntad consciente",
    shadow: "ego, rigidez, necesidad de reconocimiento",
    keywords: ["identidad", "voluntad", "propósito", "vitalidad"],
  },
  Luna: {
    function: "respuesta emocional y necesidades",
    gift: "intuición, empatía, cuidado",
    shadow: "apego, reactividad, dependencia",
    keywords: ["emociones", "instintos", "hogar", "seguridad"],
  },
  Mercurio: {
    function: "procesamiento y comunicación mental",
    gift: "agilidad, curiosidad, expresión clara",
    shadow: "dispersión, nerviosismo, superficialidad",
    keywords: ["comunicación", "mente", "aprendizaje", "conexión"],
  },
  Venus: {
    function: "creación de belleza y relaciones",
    gift: "encanto, valor estético, armonía",
    shadow: "superficialidad, indulgencia, dependencia relacional",
    keywords: ["amor", "valores", "belleza", "recursos"],
  },
  Marte: {
    function: "acción, deseo y asertividad",
    gift: "coraje, determinación, pasión",
    shadow: "agresión, impulsividad, ira",
    keywords: ["acción", "deseo", "energía", "conflicto"],
  },
  Júpiter: {
    function: "expansión, creencia y crecimiento",
    gift: "optimismo, visión amplia, generosidad",
    shadow: "exceso, arrogancia, falta de límites",
    keywords: ["expansión", "fe", "sabiduría", "abundancia"],
  },
  Saturno: {
    function: "estructura, limitación y maestría",
    gift: "disciplina, responsabilidad, logro duradero",
    shadow: "represión, frialdad, pesimismo",
    keywords: ["disciplina", "estructura", "madurez", "logros"],
  },
  Urano: {
    function: "liberación, innovación y cambio",
    gift: "originalidad, visión futura, revolucionario",
    shadow: "rebeldía destructiva, desapego emocional",
    keywords: ["innovación", "libertad", "tecnología", "cambio"],
  },
  Neptuno: {
    function: "disolución, sueño y trascendencia",
    gift: "creatividad, inspiración espiritual, compasión",
    shadow: "evasión, ilusión, confusión",
    keywords: ["espiritualidad", "creatividad", "intuición", "misterio"],
  },
  Plutón: {
    function: "transformación, poder y regeneración",
    gift: "capacidad de renacer, sanación profunda",
    shadow: "control, obsesión, poder destructivo",
    keywords: ["transformación", "poder", "regeneración", "profundidad"],
  },
};

// ── SIGN ARCHETYPES ───────────────────────────────────────────────────────────

const SIGN_ARCHETYPE: Record<
  string,
  { element: string; modality: string; style: string; keywords: string[] }
> = {
  Aries: {
    element: "Fuego",
    modality: "Cardinal",
    style: "directa, impulsiva, pionera",
    keywords: ["acción", "iniciativa", "valor", "independencia"],
  },
  Tauro: {
    element: "Tierra",
    modality: "Fijo",
    style: "paciente, sensorial, constructora",
    keywords: ["estabilidad", "belleza", "valor", "sensualidad"],
  },
  Géminis: {
    element: "Aire",
    modality: "Mutable",
    style: "versátil, curiosa, comunicativa",
    keywords: ["comunicación", "versatilidad", "aprendizaje", "conexión"],
  },
  Cáncer: {
    element: "Agua",
    modality: "Cardinal",
    style: "intuitiva, protectora, emocional",
    keywords: ["hogar", "familia", "protección", "intuición"],
  },
  Leo: {
    element: "Fuego",
    modality: "Fijo",
    style: "radiante, expresiva, generosa",
    keywords: ["creatividad", "liderazgo", "autoexpresión", "dramatismo"],
  },
  Virgo: {
    element: "Tierra",
    modality: "Mutable",
    style: "analítica, precisa, servicial",
    keywords: ["análisis", "servicio", "precisión", "salud"],
  },
  Libra: {
    element: "Aire",
    modality: "Cardinal",
    style: "diplomática, refinada, buscadora de paz",
    keywords: ["armonía", "justicia", "belleza", "relaciones"],
  },
  Escorpio: {
    element: "Agua",
    modality: "Fijo",
    style: "profunda, intensa, penetrante",
    keywords: ["transformación", "profundidad", "poder", "secretos"],
  },
  Sagitario: {
    element: "Fuego",
    modality: "Mutable",
    style: "expansiva, filosófica, aventurera",
    keywords: ["filosofía", "libertad", "sabiduría", "expansión"],
  },
  Capricornio: {
    element: "Tierra",
    modality: "Cardinal",
    style: "disciplinada, ambiciosa, responsable",
    keywords: ["disciplina", "ambición", "estructura", "logros"],
  },
  Acuario: {
    element: "Aire",
    modality: "Fijo",
    style: "innovadora, independiente, humanitaria",
    keywords: ["innovación", "libertad", "humanidad", "futuro"],
  },
  Piscis: {
    element: "Agua",
    modality: "Mutable",
    style: "intuitiva, compasiva, mística",
    keywords: ["espiritualidad", "compasión", "creatividad", "trascendencia"],
  },
};

// ── HOUSE MEANINGS ─────────────────────────────────────────────────────────────

const HOUSE_ARCHETYPES: Record<number, { name: string; domain: string; keywords: string[] }> = {
  1: {
    name: "Casa del Ser",
    domain: "personalidad, apariencia física, actitud hacia la vida",
    keywords: ["identidad", "cuerpo", "apariencia", "comienzos"],
  },
  2: {
    name: "Casa de Recursos",
    domain: "dinero, valores materiales y personales",
    keywords: ["recursos", "valores", "dinero", "autoestima"],
  },
  3: {
    name: "Casa de la Mente",
    domain: "comunicación, aprendizaje, entorno cercano",
    keywords: ["comunicación", "aprendizaje", "hermanos", "vecindad"],
  },
  4: {
    name: "Casa de Raíces",
    domain: "hogar, familia, vida privada, raíces",
    keywords: ["hogar", "familia", "raíces", "infancia"],
  },
  5: {
    name: "Casa de Creación",
    domain: "creatividad, romance, expresión personal",
    keywords: ["creatividad", "romance", "expresión", "alegría"],
  },
  6: {
    name: "Casa de Servicio",
    domain: "trabajo, salud, rutina diaria",
    keywords: ["trabajo", "salud", "servicio", "habilidades"],
  },
  7: {
    name: "Casa del Otro",
    domain: "relaciones significativas, asociaciones",
    keywords: ["pareja", "asociaciones", "proyección", "equilibrio"],
  },
  8: {
    name: "Casa de Transformación",
    domain: "crisis, sexualidad, recursos compartidos, muerte/renacimiento",
    keywords: ["transformación", "poder", "sexualidad", "herencias"],
  },
  9: {
    name: "Casa del Horizonte",
    domain: "filosofía, viajes, educación superior",
    keywords: ["filosofía", "viajes", "educación", "sabiduría"],
  },
  10: {
    name: "Casa de Vocación",
    domain: "carrera, reputación, imagen pública",
    keywords: ["carrera", "reputación", "vocación", "autoridad"],
  },
  11: {
    name: "Casa de la Tribu",
    domain: "comunidad, amistades, visión futura",
    keywords: ["amigos", "comunidad", "ideales", "futuro"],
  },
  12: {
    name: "Casa del Alma",
    domain: "mundo interior, espiritualidad, lo oculto",
    keywords: ["espiritualidad", "inconsciente", "soledad", "transcendencia"],
  },
};

// ── KEYPHRASES ────────────────────────────────────────────────────────────────

const KEYPHRASES = {
  Sol_Aries: "El fuego de ser pionero quema en tu corazón",
  Sol_Tauro: "Tu identidad es un templo de belleza y valor",
  Sol_Géminis: "Tu verdadero yo es un mensajero infinito",
  Sol_Cáncer: "Tu luz brilla en el cuidado del hogar",
  Sol_Leo: "Tu creación es tu firma en el mundo",
  Sol_Virgo: "Tu perfección está en servir con precisión",
  Sol_Libra: "Tu equilibrio es tu mayor fortaleza",
  Sol_Escorpio: "Tu profundidad es tu poder transformador",
  Sol_Sagitario: "Tu verdad es tu libertad",
  Sol_Capricornio: "Tu disciplina es tu legado",
  Sol_Acuario: "Tu visión futura ilumina a otros",
  Sol_Piscis: "Tu espíritu trasciende los límites",
  Luna_Cáncer: "Tu mundo emocional es tu hogar seguro",
  Luna_Piscis: "Tu intuición es tu brújula espiritual",
} as const;

type KeyphraseKey = keyof typeof KEYPHRASES;

// ── GENERATOR FUNCTIONS ────────────────────────────────────────────────────────

function generatePlanetInSign(planet: string, sign: string): NatalInterpretation {
  const p = PLANET_ARCHETYPE[planet];
  const s = SIGN_ARCHETYPE[sign];
  if (!p || !s) throw new Error(`Missing archetype for ${planet} in ${sign}`);

  const keywords = [...p.keywords.slice(0, 2), ...s.keywords.slice(0, 2)];
  const keyphraseKey = `${planet}_${sign}` as KeyphraseKey;
  const keyphrase =
    (KEYPHRASES[keyphraseKey] as string | undefined) ||
    `${planet} en ${sign}: Tu ${p.function} se expresa de forma ${s.style.toLowerCase()}`;

  return {
    title: `${planet} en ${sign}`,
    subtitle: `${s.element} ${s.modality}`,
    principal: `${planet} representa ${p.function}. En ${sign}, esta energía toma un estilo ${s.style.toLowerCase()}. Expresas tu ${p.function} de manera característica de ${sign}: ${s.keywords.join(", ")}.`,
    strengths: [
      `Capacidad para ${s.keywords[0]} gracias a ${p.gift}`,
      `Expresión ${s.style.toLowerCase()} de tu ${p.function}`,
      `Integración del ${s.element} con tu ${p.function}`,
    ],
    challenges: [
      `Tendencia al ${p.shadow.split(",")[0]} en forma ${s.style.toLowerCase()}`,
      `Puede resultar ${s.modality === "Fijo" ? "obsesivo" : "disperso"} en temas de ${p.keywords[0]}`,
      `Necesidad de aprender balance en ${s.keywords[1]}`,
    ],
    growth: `Tu crecimiento está en reconocer que tu ${p.function} tiene tanto fortalezas como sombras. Integra conscientemente el ${s.element} con tu propósito más profundo. Busca expresar tu ${p.gift} de forma responsable.`,
    keywords,
    keyphrase,
  };
}

function generatePlanetInHouse(planet: string, house: number): NatalInterpretation {
  const p = PLANET_ARCHETYPE[planet];
  const h = HOUSE_ARCHETYPES[house];
  if (!p || !h) throw new Error(`Missing archetype for ${planet} in house ${house}`);

  return {
    title: `${planet} en Casa ${house}`,
    subtitle: h.name,
    principal: `${planet} (tu ${p.function}) opera en la ${h.name}, el área de vida de ${h.domain}. Tu ${p.function} se despliega principalmente en contextos de ${h.keywords[0]}.`,
    strengths: [
      `Talento para ${h.keywords[0]} gracias a tu ${p.function}`,
      `Capacidad natural en temas de ${h.keywords[1]}`,
      `Tu ${p.gift} es especialmente útil en casa ${house}`,
    ],
    challenges: [
      `Posible concentración excesiva en temas de ${h.domain}`,
      `Puede manifestarse como ${p.shadow.split(",")[0]} en esta área`,
      `Necesidad de expansión más allá de casa ${house}`,
    ],
    growth: `Tu lección de alma en esta vida incluye aprender a expresar tu ${p.function} de forma equilibrada en el área de ${h.domain}. Usa tu ${p.gift} para contribuir conscientemente en estos temas.`,
    keywords: [...p.keywords.slice(0, 2), ...h.keywords.slice(0, 2)],
    keyphrase: `Tu ${p.function} transforma el mundo de ${h.domain}`,
  };
}

function generateAspect(
  planet1: string,
  aspectName: string,
  planet2: string,
  orb?: number
): NatalInterpretation {
  const p1 = PLANET_ARCHETYPE[planet1];
  const p2 = PLANET_ARCHETYPE[planet2];
  if (!p1 || !p2) throw new Error(`Missing archetype for ${planet1} or ${planet2}`);

  const aspectInfo: Record<
    string,
    { nature: string; dynamic: string; phrase: string }
  > = {
    Conjunción: {
      nature: "transformador",
      dynamic: "fusión e intensificación de energías",
      phrase: "se unen en ti",
    },
    Oposición: {
      nature: "desafiante",
      dynamic: "polarización que exige integración",
      phrase: "crean tensión creativa",
    },
    Cuadratura: {
      nature: "desafiante",
      dynamic: "fricción que genera crecimiento",
      phrase: "se friccionan productivamente",
    },
    Trígono: {
      nature: "constructivo",
      dynamic: "fluidez y facilidad",
      phrase: "fluyen en armonía",
    },
    Sextil: {
      nature: "constructivo",
      dynamic: "apoyo sutil y oportunidades",
      phrase: "se apoyan mutuamente",
    },
  };

  const aspect = aspectInfo[aspectName] || aspectInfo.Conjunción;

  return {
    title: `${planet1} ${aspectName} ${planet2}`,
    subtitle: aspectName,
    principal: `Tu ${p1.function} y tu ${p2.function} ${aspect.phrase} en tu psique. Esta es una relación de ${aspect.dynamic}. ${aspectName} significa que estas dos funciones internas deben aprender a coexistir.`,
    strengths: [
      `Potencial para integrar ${p1.function} y ${p2.function}`,
      `Tu ${aspect.nature === "constructivo" ? p1.gift : "carácter único"} se potencia`,
      `Capacidad para transformar ${aspectName.toLowerCase()} en crecimiento`,
    ],
    challenges: [
      `${aspect.nature === "desafiante" ? "Tensión natural entre" : "Necesidad de activar"} ${p1.function} y ${p2.function}`,
      `Posible ${p1.shadow.split(",")[0]} si ignoras ${p2.function}`,
      `Requiere consciencia para no proyectar externamente`,
    ],
    growth: `Integra estas dos fuerzas reconociendo que ambas son válidas. Tu lección es aprender que ${p1.function} y ${p2.function} no son enemigos sino compañeros en tu evolución.`,
    keywords: [...p1.keywords.slice(0, 2), ...p2.keywords.slice(0, 2)],
    keyphrase: `La danza entre ${planet1} y ${planet2} es tu maestría`,
  };
}

// ── LOOKUP FUNCTIONS ───────────────────────────────────────────────────────────

export function getPlanetInSignInterpretation(planet: string, sign: string): NatalInterpretation {
  return generatePlanetInSign(planet, sign);
}

export function getPlanetInHouseInterpretation(planet: string, house: number): NatalInterpretation {
  return generatePlanetInHouse(planet, house);
}

export function getAspectInterpretation(
  planet1: string,
  aspectName: string,
  planet2: string,
  orb?: number
): NatalInterpretation {
  return generateAspect(planet1, aspectName, planet2, orb);
}

export function getHouseMeaning(house: number): NatalInterpretation {
  const h = HOUSE_ARCHETYPES[house];
  if (!h) throw new Error(`House ${house} not found`);

  return {
    title: `Casa ${house}: ${h.name}`,
    subtitle: "Significado",
    principal: `La Casa ${house} es el área de tu vida relacionada con ${h.domain}. Esta casa muestra dónde y cómo expresas tus energías en la experiencia cotidiana.`,
    strengths: [
      `Oportunidad para crecer en ${h.keywords[0]}`,
      `Áreas de vida donde tienes control consciente`,
      `Espacio para expresar tu autenticidad`,
    ],
    challenges: [
      `Puede ser área de prueba kármica`,
      `Temas que requieren atención y desarrollo`,
      `Lugares donde aprendes lecciones importantes`,
    ],
    growth: `La Casa ${house} te invita a desarrollar maestría en ${h.domain}. Es un área donde puedes contribuir significativamente a tu propia evolución y la de otros.`,
    keywords: h.keywords,
    keyphrase: `En casa ${house} florece tu ${h.keywords[0]}`,
  };
}

export function getAngleMeaning(angleName: string, sign: string): NatalInterpretation {
  const s = SIGN_ARCHETYPE[sign];
  if (!s) throw new Error(`Sign ${sign} not found`);

  const angleDescriptions: Record<string, { role: string; phrase: string }> = {
    ASC: {
      role: "la máscara que presentas al mundo",
      phrase: "cómo te ven los demás y cómo ves la vida",
    },
    DSC: {
      role: "lo que atraes en relaciones",
      phrase: "el espejo en el que ves tu sombra",
    },
    MC: {
      role: "tu vocación y imagen pública",
      phrase: "tu contribución al mundo",
    },
    IC: {
      role: "tus raíces y privacidad",
      phrase: "tu hogar emocional y base psicológica",
    },
  };

  const desc = angleDescriptions[angleName] || angleDescriptions.ASC;

  return {
    title: `${angleName} en ${sign}`,
    subtitle: "Ángulo",
    principal: `Tu ${angleName} en ${sign} representa ${desc.role}. En ${sign}, expresas esto de forma ${s.style.toLowerCase()}, con énfasis en ${s.keywords.join(", ")}.`,
    strengths: [
      `Naturalidad al expresar ${s.keywords[0]}`,
      `Capacidad para encarnar ${s.element}`,
      `Autenticidad en tu presentación al mundo`,
    ],
    challenges: [
      `Tendencia a exagerar aspectos de ${sign}`,
      `Puede parecer ${s.modality === "Fijo" ? "inflexible" : "inconsistente"}`,
      `Trabajo de integración de sombra ${sign}`,
    ],
    growth: `Tu ${angleName} te invita a desarrollar los dones de ${sign} mientras integras sus sombras. Recuerda que ${desc.phrase}.`,
    keywords: s.keywords,
    keyphrase: `Tu ${angleName} es tu firma cósmica en ${sign}`,
  };
}
