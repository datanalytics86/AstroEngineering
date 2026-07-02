import type { NatalInterpretation, PlanetPosition, HouseCusp, Aspect, AnglePoint } from "./types";

type Lang = "es" | "en";

// ── PLANET ARCHETYPES (ES) ──────────────────────────────────────────────────────

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
  "Nodo Norte": {
    function: "dirección evolutiva y propósito kármico",
    gift: "crecimiento hacia lo desconocido, expansión del alma",
    shadow: "resistencia al cambio, apego a patrones del pasado",
    keywords: ["evolución", "propósito", "karma", "crecimiento"],
  },
  Quirón: {
    function: "herida primaria y capacidad de sanación",
    gift: "sabiduría surgida del dolor, guía y sanación de otros",
    shadow: "victimismo, heridas no integradas, hipersensibilidad",
    keywords: ["sanación", "herida", "sabiduría", "integración"],
  },
};

// ── PLANET ARCHETYPES (EN) ──────────────────────────────────────────────────────

const PLANET_ARCHETYPE_EN: Record<
  string,
  { function: string; gift: string; shadow: string; keywords: string[] }
> = {
  Sol: {
    function: "identity and vital purpose",
    gift: "creative vitality, conscious will",
    shadow: "ego, rigidity, need for recognition",
    keywords: ["identity", "will", "purpose", "vitality"],
  },
  Luna: {
    function: "emotional response and needs",
    gift: "intuition, empathy, nurturing",
    shadow: "attachment, reactivity, dependence",
    keywords: ["emotions", "instincts", "home", "security"],
  },
  Mercurio: {
    function: "mental processing and communication",
    gift: "agility, curiosity, clear expression",
    shadow: "scatteredness, nervousness, superficiality",
    keywords: ["communication", "mind", "learning", "connection"],
  },
  Venus: {
    function: "creation of beauty and relationships",
    gift: "charm, aesthetic sense, harmony",
    shadow: "superficiality, indulgence, relational dependence",
    keywords: ["love", "values", "beauty", "resources"],
  },
  Marte: {
    function: "action, desire and assertiveness",
    gift: "courage, determination, passion",
    shadow: "aggression, impulsiveness, anger",
    keywords: ["action", "desire", "energy", "conflict"],
  },
  Júpiter: {
    function: "expansion, belief and growth",
    gift: "optimism, broad vision, generosity",
    shadow: "excess, arrogance, lack of limits",
    keywords: ["expansion", "faith", "wisdom", "abundance"],
  },
  Saturno: {
    function: "structure, limitation and mastery",
    gift: "discipline, responsibility, lasting achievement",
    shadow: "repression, coldness, pessimism",
    keywords: ["discipline", "structure", "maturity", "achievement"],
  },
  Urano: {
    function: "liberation, innovation and change",
    gift: "originality, future vision, revolutionary spirit",
    shadow: "destructive rebellion, emotional detachment",
    keywords: ["innovation", "freedom", "technology", "change"],
  },
  Neptuno: {
    function: "dissolution, dreaming and transcendence",
    gift: "creativity, spiritual inspiration, compassion",
    shadow: "escapism, illusion, confusion",
    keywords: ["spirituality", "creativity", "intuition", "mystery"],
  },
  Plutón: {
    function: "transformation, power and regeneration",
    gift: "capacity to be reborn, deep healing",
    shadow: "control, obsession, destructive power",
    keywords: ["transformation", "power", "regeneration", "depth"],
  },
  "Nodo Norte": {
    function: "evolutionary direction and karmic purpose",
    gift: "growth toward the unknown, expansion of the soul",
    shadow: "resistance to change, attachment to past patterns",
    keywords: ["evolution", "purpose", "karma", "growth"],
  },
  Quirón: {
    function: "primal wound and capacity for healing",
    gift: "wisdom born of pain, guiding and healing others",
    shadow: "victimhood, unintegrated wounds, hypersensitivity",
    keywords: ["healing", "wound", "wisdom", "integration"],
  },
};

// ── SIGN ARCHETYPES (ES) ─────────────────────────────────────────────────────────

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

// ── SIGN ARCHETYPES (EN) ─────────────────────────────────────────────────────────

const SIGN_ARCHETYPE_EN: Record<
  string,
  { element: string; modality: string; style: string; keywords: string[] }
> = {
  Aries: {
    element: "Fire",
    modality: "Cardinal",
    style: "direct, impulsive, pioneering",
    keywords: ["action", "initiative", "courage", "independence"],
  },
  Tauro: {
    element: "Earth",
    modality: "Fixed",
    style: "patient, sensory, building",
    keywords: ["stability", "beauty", "value", "sensuality"],
  },
  Géminis: {
    element: "Air",
    modality: "Mutable",
    style: "versatile, curious, communicative",
    keywords: ["communication", "versatility", "learning", "connection"],
  },
  Cáncer: {
    element: "Water",
    modality: "Cardinal",
    style: "intuitive, protective, emotional",
    keywords: ["home", "family", "protection", "intuition"],
  },
  Leo: {
    element: "Fire",
    modality: "Fixed",
    style: "radiant, expressive, generous",
    keywords: ["creativity", "leadership", "self-expression", "drama"],
  },
  Virgo: {
    element: "Earth",
    modality: "Mutable",
    style: "analytical, precise, service-oriented",
    keywords: ["analysis", "service", "precision", "health"],
  },
  Libra: {
    element: "Air",
    modality: "Cardinal",
    style: "diplomatic, refined, peace-seeking",
    keywords: ["harmony", "justice", "beauty", "relationships"],
  },
  Escorpio: {
    element: "Water",
    modality: "Fixed",
    style: "deep, intense, penetrating",
    keywords: ["transformation", "depth", "power", "secrets"],
  },
  Sagitario: {
    element: "Fire",
    modality: "Mutable",
    style: "expansive, philosophical, adventurous",
    keywords: ["philosophy", "freedom", "wisdom", "expansion"],
  },
  Capricornio: {
    element: "Earth",
    modality: "Cardinal",
    style: "disciplined, ambitious, responsible",
    keywords: ["discipline", "ambition", "structure", "achievement"],
  },
  Acuario: {
    element: "Air",
    modality: "Fixed",
    style: "innovative, independent, humanitarian",
    keywords: ["innovation", "freedom", "humanity", "future"],
  },
  Piscis: {
    element: "Water",
    modality: "Mutable",
    style: "intuitive, compassionate, mystical",
    keywords: ["spirituality", "compassion", "creativity", "transcendence"],
  },
};

// ── HOUSE MEANINGS (ES) ───────────────────────────────────────────────────────────

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

// ── HOUSE MEANINGS (EN) ───────────────────────────────────────────────────────────

const HOUSE_ARCHETYPES_EN: Record<number, { name: string; domain: string; keywords: string[] }> = {
  1: {
    name: "House of Self",
    domain: "personality, physical appearance, attitude toward life",
    keywords: ["identity", "body", "appearance", "beginnings"],
  },
  2: {
    name: "House of Resources",
    domain: "money, material and personal values",
    keywords: ["resources", "values", "money", "self-worth"],
  },
  3: {
    name: "House of the Mind",
    domain: "communication, learning, immediate environment",
    keywords: ["communication", "learning", "siblings", "neighborhood"],
  },
  4: {
    name: "House of Roots",
    domain: "home, family, private life, roots",
    keywords: ["home", "family", "roots", "childhood"],
  },
  5: {
    name: "House of Creation",
    domain: "creativity, romance, personal expression",
    keywords: ["creativity", "romance", "expression", "joy"],
  },
  6: {
    name: "House of Service",
    domain: "work, health, daily routine",
    keywords: ["work", "health", "service", "skills"],
  },
  7: {
    name: "House of the Other",
    domain: "significant relationships, partnerships",
    keywords: ["partner", "partnerships", "projection", "balance"],
  },
  8: {
    name: "House of Transformation",
    domain: "crisis, sexuality, shared resources, death/rebirth",
    keywords: ["transformation", "power", "sexuality", "inheritance"],
  },
  9: {
    name: "House of the Horizon",
    domain: "philosophy, travel, higher education",
    keywords: ["philosophy", "travel", "education", "wisdom"],
  },
  10: {
    name: "House of Vocation",
    domain: "career, reputation, public image",
    keywords: ["career", "reputation", "vocation", "authority"],
  },
  11: {
    name: "House of the Tribe",
    domain: "community, friendships, future vision",
    keywords: ["friends", "community", "ideals", "future"],
  },
  12: {
    name: "House of the Soul",
    domain: "inner world, spirituality, the hidden",
    keywords: ["spirituality", "unconscious", "solitude", "transcendence"],
  },
};

// ── KEYPHRASES (ES) ───────────────────────────────────────────────────────────────

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

// ── KEYPHRASES (EN) ───────────────────────────────────────────────────────────────

const KEYPHRASES_EN: Record<KeyphraseKey, string> = {
  Sol_Aries: "The fire of being a pioneer burns in your heart",
  Sol_Tauro: "Your identity is a temple of beauty and worth",
  Sol_Géminis: "Your true self is an endless messenger",
  Sol_Cáncer: "Your light shines in caring for the home",
  Sol_Leo: "Your creation is your signature on the world",
  Sol_Virgo: "Your perfection lies in serving with precision",
  Sol_Libra: "Your balance is your greatest strength",
  Sol_Escorpio: "Your depth is your transformative power",
  Sol_Sagitario: "Your truth is your freedom",
  Sol_Capricornio: "Your discipline is your legacy",
  Sol_Acuario: "Your future vision illuminates others",
  Sol_Piscis: "Your spirit transcends all limits",
  Luna_Cáncer: "Your emotional world is your safe home",
  Luna_Piscis: "Your intuition is your spiritual compass",
};

// ── GENERATOR FUNCTIONS ────────────────────────────────────────────────────────

function generatePlanetInSign(planet: string, sign: string, lang: Lang = "es"): NatalInterpretation | null {
  if (lang === "en") {
    const p = PLANET_ARCHETYPE_EN[planet];
    const s = SIGN_ARCHETYPE_EN[sign];
    if (!p || !s) return null;

    const keywords = [...p.keywords.slice(0, 2), ...s.keywords.slice(0, 2)];
    const keyphraseKey = `${planet}_${sign}` as KeyphraseKey;
    const keyphrase =
      KEYPHRASES_EN[keyphraseKey] ||
      `${planet} in ${sign}: your ${p.function} expresses itself in a ${s.style.toLowerCase()} way`;

    return {
      title: `${planet} in ${sign}`,
      subtitle: `${s.element} ${s.modality}`,
      principal: `${planet} represents ${p.function}. In ${sign}, this energy takes on a ${s.style.toLowerCase()} style. You express your ${p.function} in a way characteristic of ${sign}: ${s.keywords.join(", ")}.`,
      strengths: [
        `Capacity for ${s.keywords[0]} thanks to your ${p.gift}`,
        `${s.style.charAt(0).toUpperCase() + s.style.slice(1).toLowerCase()} expression of your ${p.function}`,
        `Integration of ${s.element} with your ${p.function}`,
      ],
      challenges: [
        `Tendency toward ${p.shadow.split(",")[0]} expressed in a ${s.style.toLowerCase()} way`,
        `Can become ${s.modality === "Fixed" ? "obsessive" : "scattered"} around themes of ${p.keywords[0]}`,
        `Need to learn balance regarding ${s.keywords[1]}`,
      ],
      growth: `Your growth lies in recognizing that your ${p.function} carries both strengths and shadows. Consciously integrate ${s.element} with your deeper purpose. Seek to express your ${p.gift} responsibly.`,
      keywords,
      keyphrase,
    };
  }

  const p = PLANET_ARCHETYPE[planet];
  const s = SIGN_ARCHETYPE[sign];
  if (!p || !s) return null;

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

function generatePlanetInHouse(planet: string, house: number, lang: Lang = "es"): NatalInterpretation {
  if (lang === "en") {
    const p = PLANET_ARCHETYPE_EN[planet];
    const h = HOUSE_ARCHETYPES_EN[house];
    if (!p || !h) throw new Error(`Missing EN archetype for ${planet} in house ${house}`);

    return {
      title: `${planet} in House ${house}`,
      subtitle: h.name,
      principal: `${planet} (your ${p.function}) operates in the ${h.name}, the life area of ${h.domain}. Your ${p.function} unfolds mainly in the context of ${h.keywords[0]}.`,
      strengths: [
        `Talent for ${h.keywords[0]} thanks to your ${p.function}`,
        `Natural capacity around themes of ${h.keywords[1]}`,
        `Your ${p.gift} is especially useful in house ${house}`,
      ],
      challenges: [
        `Possible excessive focus on themes of ${h.domain}`,
        `Can manifest as ${p.shadow.split(",")[0]} in this area`,
        `Need to expand beyond house ${house}`,
      ],
      growth: `Your soul lesson in this life includes learning to express your ${p.function} in a balanced way in the area of ${h.domain}. Use your ${p.gift} to contribute consciously to these themes.`,
      keywords: [...p.keywords.slice(0, 2), ...h.keywords.slice(0, 2)],
      keyphrase: `Your ${p.function} transforms the world of ${h.domain}`,
    };
  }

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

const ASPECT_INFO: Record<string, { nature: string; dynamic: string; phrase: string }> = {
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

const ASPECT_INFO_EN: Record<string, { nature: string; dynamic: string; phrase: string }> = {
  Conjunción: {
    nature: "transformative",
    dynamic: "fusion and intensification of energies",
    phrase: "merge within you",
  },
  Oposición: {
    nature: "challenging",
    dynamic: "polarization that demands integration",
    phrase: "create creative tension",
  },
  Cuadratura: {
    nature: "challenging",
    dynamic: "friction that generates growth",
    phrase: "grind against each other productively",
  },
  Trígono: {
    nature: "constructive",
    dynamic: "fluidity and ease",
    phrase: "flow in harmony",
  },
  Sextil: {
    nature: "constructive",
    dynamic: "subtle support and opportunities",
    phrase: "support each other",
  },
};

function generateAspect(
  planet1: string,
  aspectName: string,
  planet2: string,
  orb?: number,
  lang: Lang = "es"
): NatalInterpretation {
  if (lang === "en") {
    const p1 = PLANET_ARCHETYPE_EN[planet1];
    const p2 = PLANET_ARCHETYPE_EN[planet2];
    if (!p1 || !p2) throw new Error(`Missing EN archetype for ${planet1} or ${planet2}`);

    const aspect = ASPECT_INFO_EN[aspectName] || ASPECT_INFO_EN.Conjunción;

    return {
      title: `${planet1} ${aspectName} ${planet2}`,
      subtitle: aspectName,
      principal: `Your ${p1.function} and your ${p2.function} ${aspect.phrase} in your psyche. This is a relationship of ${aspect.dynamic}. This aspect means these two inner functions must learn to coexist.`,
      strengths: [
        `Potential to integrate ${p1.function} and ${p2.function}`,
        `Your ${aspect.nature === "constructive" ? p1.gift : "unique character"} is enhanced`,
        `Capacity to turn this aspect into growth`,
      ],
      challenges: [
        `${aspect.nature === "challenging" ? "Natural tension between" : "Need to activate"} ${p1.function} and ${p2.function}`,
        `Possible ${p1.shadow.split(",")[0]} if you ignore ${p2.function}`,
        `Requires awareness to avoid projecting outward`,
      ],
      growth: `Integrate these two forces by recognizing that both are valid. Your lesson is to learn that ${p1.function} and ${p2.function} are not enemies but companions in your evolution.`,
      keywords: [...p1.keywords.slice(0, 2), ...p2.keywords.slice(0, 2)],
      keyphrase: `The dance between ${planet1} and ${planet2} is your mastery`,
    };
  }

  const p1 = PLANET_ARCHETYPE[planet1];
  const p2 = PLANET_ARCHETYPE[planet2];
  if (!p1 || !p2) throw new Error(`Missing archetype for ${planet1} or ${planet2}`);

  const aspect = ASPECT_INFO[aspectName] || ASPECT_INFO.Conjunción;

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

export function getPlanetInSignInterpretation(
  planet: string,
  sign: string,
  lang: Lang = "es"
): NatalInterpretation | null {
  return generatePlanetInSign(planet, sign, lang);
}

export function getPlanetInHouseInterpretation(
  planet: string,
  house: number,
  lang: Lang = "es"
): NatalInterpretation {
  return generatePlanetInHouse(planet, house, lang);
}

export function getAspectInterpretation(
  planet1: string,
  aspectName: string,
  planet2: string,
  orb?: number,
  lang: Lang = "es"
): NatalInterpretation {
  return generateAspect(planet1, aspectName, planet2, orb, lang);
}

export function getHouseMeaning(house: number, lang: Lang = "es"): NatalInterpretation {
  if (lang === "en") {
    const h = HOUSE_ARCHETYPES_EN[house];
    if (!h) throw new Error(`House ${house} not found`);

    return {
      title: `House ${house}: ${h.name}`,
      subtitle: "Meaning",
      principal: `House ${house} is the area of your life related to ${h.domain}. This house shows where and how you express your energies in day-to-day experience.`,
      strengths: [
        `Opportunity to grow in ${h.keywords[0]}`,
        `Life areas where you have conscious control`,
        `Space to express your authenticity`,
      ],
      challenges: [
        `Can be an area of karmic testing`,
        `Themes that require attention and development`,
        `Places where you learn important lessons`,
      ],
      growth: `House ${house} invites you to develop mastery in ${h.domain}. It is an area where you can meaningfully contribute to your own evolution and that of others.`,
      keywords: h.keywords,
      keyphrase: `In house ${house}, your ${h.keywords[0]} flourishes`,
    };
  }

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

const ANGLE_DESCRIPTIONS: Record<string, { role: string; phrase: string }> = {
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

const ANGLE_DESCRIPTIONS_EN: Record<string, { role: string; phrase: string }> = {
  ASC: {
    role: "the mask you present to the world",
    phrase: "how others see you and how you see life",
  },
  DSC: {
    role: "what you attract in relationships",
    phrase: "the mirror in which you see your shadow",
  },
  MC: {
    role: "your vocation and public image",
    phrase: "your contribution to the world",
  },
  IC: {
    role: "your roots and privacy",
    phrase: "your emotional home and psychological foundation",
  },
};

export function getAngleMeaning(angleName: string, sign: string, lang: Lang = "es"): NatalInterpretation {
  if (lang === "en") {
    const s = SIGN_ARCHETYPE_EN[sign];
    if (!s) throw new Error(`Sign ${sign} not found`);

    const desc = ANGLE_DESCRIPTIONS_EN[angleName] || ANGLE_DESCRIPTIONS_EN.ASC;

    return {
      title: `${angleName} in ${sign}`,
      subtitle: "Angle",
      principal: `Your ${angleName} in ${sign} represents ${desc.role}. In ${sign}, you express this in a ${s.style.toLowerCase()} way, with emphasis on ${s.keywords.join(", ")}.`,
      strengths: [
        `Natural ease expressing ${s.keywords[0]}`,
        `Ability to embody ${s.element}`,
        `Authenticity in how you present yourself to the world`,
      ],
      challenges: [
        `Tendency to overplay aspects of ${sign}`,
        `Can seem ${s.modality === "Fixed" ? "inflexible" : "inconsistent"}`,
        `Shadow-integration work for ${sign}`,
      ],
      growth: `Your ${angleName} invites you to develop the gifts of ${sign} while integrating its shadows. Remember that ${desc.phrase}.`,
      keywords: s.keywords,
      keyphrase: `Your ${angleName} is your cosmic signature in ${sign}`,
    };
  }

  const s = SIGN_ARCHETYPE[sign];
  if (!s) throw new Error(`Sign ${sign} not found`);

  const desc = ANGLE_DESCRIPTIONS[angleName] || ANGLE_DESCRIPTIONS.ASC;

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
