import type { TransitInterpretation } from "./types";

// ── Datos base para generar interpretaciones ──────────────────────────────────

const PLANET_ARCHETYPE: Record<string, { role: string; areas: string[]; energy: string }> = {
  "Júpiter":    { role: "la expansión y la abundancia",     areas: ["crecimiento", "filosofía", "viajes", "espiritualidad"], energy: "expansiva" },
  "Saturno":    { role: "la disciplina y el karma",         areas: ["carrera", "responsabilidades", "estructura", "límites"],  energy: "restrictiva" },
  "Urano":      { role: "el cambio súbito y la liberación", areas: ["innovación", "libertad", "tecnología", "revolución"],      energy: "disruptiva" },
  "Neptuno":    { role: "lo espiritual y lo disuelto",      areas: ["espiritualidad", "creatividad", "ilusiones", "sacrificio"], energy: "disolvente" },
  "Plutón":     { role: "la transformación y el poder",     areas: ["transformación", "poder", "regeneración", "secretos"],    energy: "transformadora" },
  "Marte":      { role: "la acción y la energía",           areas: ["energía", "conflictos", "sexualidad", "iniciativa"],      energy: "activadora" },
};

const NATAL_ARCHETYPE: Record<string, { role: string; areas: string[] }> = {
  "Sol":         { role: "tu identidad y voluntad",                  areas: ["identidad", "vitalidad", "ego", "propósito"] },
  "Luna":        { role: "tus emociones y hábitos",                  areas: ["emociones", "hogar", "familia", "instintos"] },
  "Mercurio":    { role: "tu mente y comunicación",                  areas: ["comunicación", "aprendizaje", "contratos", "pensamiento"] },
  "Venus":       { role: "tus valores y relaciones",                 areas: ["amor", "dinero", "belleza", "relaciones"] },
  "Marte":       { role: "tu energía y acción",                      areas: ["acción", "sexualidad", "coraje", "conflictos"] },
  "Júpiter":     { role: "tu expansión y optimismo",                 areas: ["expansión", "fe", "crecimiento", "filosofía"] },
  "Saturno":     { role: "tu estructura y limitaciones",             areas: ["disciplina", "madurez", "restricciones", "karma"] },
  // Planetas transpersonales como puntos natales (Tompkins, Sasportas):
  // cuando son aspectados por tránsitos representan el nivel generacional
  // y colectivo de la psique siendo activado por el ciclo actual.
  "Urano":       { role: "tu necesidad de libertad e innovación",    areas: ["libertad", "cambios", "originalidad", "rebeldía"] },
  "Neptuno":     { role: "tu vida espiritual e imaginativa",         areas: ["espiritualidad", "imaginación", "ideales", "compasión"] },
  "Plutón":      { role: "tu capacidad de transformación y poder",   areas: ["transformación", "poder", "sombra", "regeneración"] },
  "Nodo Norte":  { role: "tu dirección evolutiva y karma",           areas: ["propósito kármico", "crecimiento", "destino", "aprendizaje"] },
  "Quirón":      { role: "tu herida y potencial de sanación",        areas: ["herida", "sanación", "vulnerabilidad", "maestría"] },
  "Ascendente":  { role: "tu personalidad e imagen",                 areas: ["identidad", "apariencia", "comienzos", "perspectiva"] },
  "MC":          { role: "tu vocación y imagen pública",             areas: ["carrera", "reputación", "vocación", "logros"] },
};

const ASPECT_TEMPLATE: Record<string, {
  nature: TransitInterpretation["nature"];
  keyword: string;
  dynamic: string;
  applying_note: string;
}> = {
  "Conjunción": {
    nature: "transformador",
    keyword: "fusión e intensificación",
    dynamic: "Las energías se fusionan de forma intensa, amplificando y transformando el principio natal.",
    applying_note: "El efecto se construye gradualmente y alcanza su pico en la fecha exacta.",
  },
  "Oposición": {
    nature: "desafiante",
    keyword: "polarización e integración",
    dynamic: "Tensión entre opuestos que exige integración consciente. A menudo se manifiesta a través de otras personas.",
    applying_note: "La tensión aumenta semanas antes del exacto y se libera lentamente.",
  },
  "Cuadratura": {
    nature: "desafiante",
    keyword: "fricción y acción forzada",
    dynamic: "Fricción que exige acción. El desafío es el catalizador del crecimiento si se responde conscientemente.",
    applying_note: "Los efectos son más notorios en los días cercanos al aspecto exacto.",
  },
  "Trígono": {
    nature: "constructivo",
    keyword: "fluidez y oportunidad",
    dynamic: "Las energías fluyen de forma armoniosa, facilitando el progreso y abriendo puertas naturalmente.",
    applying_note: "El flujo positivo se extiende varias semanas antes y después del exacto.",
  },
  "Sextil": {
    nature: "constructivo",
    keyword: "apoyo y oportunidad",
    dynamic: "Apoyo sutil que crea oportunidades, aunque requiere acción consciente para aprovecharse.",
    applying_note: "Ventana de oportunidad de 2-3 semanas alrededor del exacto.",
  },
};

const DURATION_NOTES: Record<string, string> = {
  "Júpiter": "Tránsito rápido: ~2-4 semanas de duración total. Efecto más intenso en la semana del exacto.",
  "Saturno": "Tránsito lento: puede durar 4-8 meses, incluyendo el paso retrógrado. Triple aspecto posible.",
  "Urano":   "Tránsito generacional: dura 1-2 años completos. El cambio suele sentirse meses antes del exacto.",
  "Neptuno": "Tránsito muy lento: dura 2-3 años. La confusión y la inspiración se acumulan gradualmente.",
  "Plutón":  "Tránsito generacional: puede durar 2-4 años. La transformación es profunda e irreversible.",
  "Marte":   "Tránsito rápido: ~1-2 semanas. Efecto agudo y directo en los días del exacto.",
};

// ── Overrides de alta calidad para las 30 combinaciones más importantes ───────

const OVERRIDES: Partial<Record<string, Partial<TransitInterpretation>>> = {
  "júpiter_conjunción_sol": {
    title: "Júpiter conjunción Sol natal",
    summary: "Año de expansión personal, reconocimiento y nuevas oportunidades. Tu vitalidad y confianza están en su punto más alto.",
    detailed: "Júpiter amplifica todo lo que el Sol representa: tu identidad, tu voluntad y tu sentido del propósito. Este tránsito marca el inicio de un nuevo ciclo de 12 años en tu desarrollo personal. Las oportunidades llegan con naturalidad, y tu optimismo atrae situaciones favorables.",
    life_areas: ["identidad", "carrera", "salud", "propósito"],
    advice: "Aprovecha esta energía para iniciar proyectos importantes y expandir tu visión de quién eres.",
  },
  "saturno_conjunción_sol": {
    title: "Saturno conjunción Sol natal",
    summary: "Período de examen profundo de tu identidad y propósito. Sientes el peso de las responsabilidades pero también la solidez de lo que construyes.",
    detailed: "Saturno pone a prueba la autenticidad de tu camino vital. Este tránsito, que ocurre cada 29 años, exige madurez y realismo. Lo que no es genuino en tu vida se torna insostenible; lo que es sólido se fortalece enormemente.",
    life_areas: ["identidad", "carrera", "autoridad", "madurez"],
    nature: "desafiante",
    advice: "Enfócate en construir desde la autenticidad. No te exijas perfección, pero sí honestidad.",
  },
  "plutón_conjunción_sol": {
    title: "Plutón conjunción Sol natal",
    summary: "Transformación radical de la identidad. Una parte de quien eras debe morir para que emerja quien realmente eres.",
    detailed: "Este es uno de los tránsitos más profundos de la vida. Plutón destruye para reconstruir desde los cimientos. Puedes experimentar crisis de identidad, confrontaciones con el poder, o transformaciones en tu estilo de vida que te resulten inevitables.",
    life_areas: ["identidad", "poder", "transformación", "propósito"],
    nature: "transformador",
    advice: "No resistas el cambio. Pregúntate qué parte de tu identidad ya no te sirve y suéltala conscientemente.",
  },
  "saturno_cuadratura_luna": {
    title: "Saturno cuadratura Luna natal",
    summary: "Período emocionalmente exigente. Las emociones encuentran resistencia o bloqueo, y las responsabilidades familiares o personales se sienten como carga.",
    detailed: "Saturno frena el flujo natural de las emociones, creando una sensación de soledad, pesadez o inadecuación emocional. Es un período de maduración emocional donde aprendes a sostener tus sentimientos con disciplina.",
    life_areas: ["emociones", "familia", "hogar", "madurez"],
    nature: "desafiante",
    advice: "Busca apoyo sin vergüenza. La vulnerabilidad controlada es una fortaleza en este período.",
  },
  "júpiter_trígono_venus": {
    title: "Júpiter trígono Venus natal",
    summary: "Período de gracia y abundancia en el amor y las finanzas. Las relaciones florecen y el dinero fluye con mayor facilidad.",
    detailed: "Una de las combinaciones más beneficiosas en astrología de tránsitos. Júpiter amplifica los principios de Venus creando un período de atracción, generosidad y abundancia relacional. Ideal para comprometerse, iniciar proyectos artísticos o inversiones.",
    life_areas: ["amor", "dinero", "arte", "relaciones"],
    nature: "constructivo",
    advice: "Este es un momento ideal para dar pasos importantes en amor o finanzas. El universo está de tu lado.",
  },
  "urano_conjunción_ascendente": {
    title: "Urano conjunción Ascendente natal",
    summary: "Revolución de la identidad y la apariencia. Cambios súbitos en cómo te percibes y cómo te perciben los demás.",
    detailed: "Urano cruza el punto más personal de la carta: la máscara con que te presentas al mundo. Puedes cambiar radicalmente de imagen, actitud o estilo de vida. Los cambios parecen llegar de la nada pero estaban acumulándose hace años.",
    life_areas: ["identidad", "apariencia", "comienzos", "libertad"],
    nature: "transformador",
    advice: "Abraza el cambio en lugar de resistirlo. Lo que rompes ahora era una cárcel disfrazada de comodidad.",
  },
  "saturno_conjunción_mc": {
    title: "Saturno conjunción MC natal",
    summary: "Momento cúspide de la carrera profesional. Logros importantes, pero también el peso máximo de las responsabilidades.",
    detailed: "Este tránsito marca el cenit profesional del ciclo de Saturno. Puedes alcanzar reconocimiento y posiciones de autoridad, pero a un costo: las demandas son enormes. Lo que construiste en los últimos 14 años sale a la luz.",
    life_areas: ["carrera", "reputación", "logros", "autoridad"],
    advice: "Asume la responsabilidad de lo que has construido. El éxito real viene con compromisos reales.",
  },
  "neptuno_conjunción_venus": {
    title: "Neptuno conjunción Venus natal",
    summary: "El amor y los valores se disuelven en lo ideal. Riesgo de ilusión romántica, pero también de amor espiritual profundo.",
    detailed: "Neptuno disuelve los límites del amor: puedes enamorarte perdidamente de alguien que no es lo que parece, o experimentar un amor espiritual genuinamente trascendente. Las finanzas también pueden volverse confusas o idealizadas.",
    life_areas: ["amor", "ilusiones", "espiritualidad", "dinero"],
    nature: "transformador",
    advice: "Sé honesto sobre lo que ves versus lo que deseas ver en tus relaciones. Escucha tu intuición.",
  },
  "plutón_conjunción_luna": {
    title: "Plutón conjunción Luna natal",
    summary: "Transformación profunda del mundo emocional. Viejos patrones familiares salen a la superficie para ser erradicados.",
    detailed: "Plutón destruye los patrones emocionales obsoletos que heredaste o desarrollaste. Este proceso es intenso y a veces doloroso, pero libera una profundidad emocional que antes no tenías acceso. Temas de familia, madre o infancia pueden resurgir.",
    life_areas: ["emociones", "familia", "transformación", "subconsciente"],
    advice: "Permite que lo que necesite salir, salga. La terapia o el trabajo interior son aliados valiosos.",
  },
  "júpiter_conjunción_mc": {
    title: "Júpiter conjunción MC natal",
    summary: "Auge profesional y reconocimiento. Las oportunidades laborales y de visibilidad pública alcanzan su punto máximo.",
    detailed: "Júpiter expande el MC, el punto de la carta asociado con la carrera y la imagen pública. Puedes recibir ascensos, reconocimiento, ofertas laborales o lograr metas profesionales que llevas años persiguiendo.",
    life_areas: ["carrera", "reputación", "logros", "visibilidad"],
    advice: "Visibilízate. Presenta tus proyectos, postúlate, haztu trabajo conocido: el timing es perfecto.",
  },

  // ── Ciclos planetarios propios — hitos biográficos (Sasportas "The Gods of Change",
  //    Arroyo "Astrology, Karma & Transformation"). Saturno/Urano/Neptuno/Plutón
  //    retornan o hacen cuadratura/oposición a su posición natal en edades específicas
  //    que la bibliografía reconoce como crisis de desarrollo universales. ──────────

  // Saturno retorno (≈29 y 58 años) — el más conocido
  "saturno_conjunción_saturno": {
    title: "Retorno de Saturno",
    summary: "El retorno de Saturno (~29 y ~58 años) marca el fin de una era vital. Nada que no sea genuino sobrevive a este tránsito: relaciones, carreras y estructuras de vida se someten a examen.",
    detailed: "Es el rito de paso astrológico por excelencia. Saturno regresa a su posición natal e inaugura un nuevo ciclo de 29 años. La primera vuelta (~29 años) cierra la juventud y exige hacerse responsable de la propia vida. La segunda vuelta (~58 años) invita a la sabiduría y la transmisión. Lo que sientes que 'ya no te sirve' necesita ser honradamente soltado; lo que construiste sobre bases sólidas encontrará su forma definitiva.",
    life_areas: ["madurez", "estructura vital", "carrera", "relaciones comprometidas"],
    nature: "transformador",
    advice: "No huyas de las responsabilidades que aparecen ahora. Son el precio de la autenticidad y la base de la próxima fase de tu vida.",
    duration_note: "Proceso de 1-2 años. Puede haber triple pasada si Saturno retrograda sobre su posición natal.",
  },
  "saturno_cuadratura_saturno": {
    title: "Cuadratura de Saturno (~21 y ~43 años)",
    summary: "Crisis de estructura vital. Las cuadraturas de Saturno a sí mismo (~7, 21, 36, 43 años) son puntos de inflexión donde lo construido hasta ahora se somete a prueba.",
    detailed: "La cuadratura de Saturno a sí mismo es la 'fricción kármica' de su propio ciclo. A los ~21 años, el individuo enfrenta el desafío de construir su propia estructura separada de la familia. A los ~43, la estructura de la madurez confronta sus límites y exige actualización. El dolor no es un fracaso: es la señal de que algo necesita ser rediseñado con mayor autenticidad.",
    life_areas: ["estructura", "carrera", "relaciones", "responsabilidades"],
    nature: "desafiante",
    advice: "Identifica qué estructuras de tu vida ya no reflejan quién eres hoy. Este tránsito no pide que lo destruyas todo, sino que lo fortalezcas honestamente.",
  },
  "saturno_oposición_saturno": {
    title: "Oposición de Saturno (~44 años) — crisis de mediana vida",
    summary: "La oposición de Saturno a sí mismo (~44 años) es la 'crisis de la mediana vida' estructural: el momento en que debes integrar lo logrado y lo no logrado con ecuanimidad.",
    detailed: "Saturno se opone a su posición natal una sola vez en la vida, alrededor de los 44-45 años. Es la culminación del primer ciclo completo: todo lo que construiste, rechazaste o postergaste sale a la luz. Los compromisos actuales —laborales, relacionales, de identidad— se someten a una auditoría existencial.",
    life_areas: ["identidad madura", "carrera", "relaciones de largo plazo", "legado"],
    nature: "desafiante",
    advice: "No compares tu vida con la de otros: compárala con lo que viniste a vivir. La honestidad contigo mismo es el único camino.",
  },

  // Urano oposición Urano (~42 años) — el detonador de la crisis de mediana vida
  "urano_oposición_urano": {
    title: "Oposición de Urano (~42 años) — despertar del alma",
    summary: "La oposición de Urano a sí mismo (~42 años) es el detonante astrológico clásico de la 'crisis de mediana vida'. El alma exige libertad de todo aquello que la tuvo encadenada.",
    detailed: "Este tránsito solo ocurre una vez en la vida y suele precipitar cambios radicales e inesperados: divorcios, cambios de carrera, relocalizaciones o crisis espirituales. La presión que sientes no es desintegración: es el auténtico yo rompiéndose paso. Urano no acepta estructuras artificiales a los 42 años; lo que cae tenía que caer.",
    life_areas: ["libertad", "identidad auténtica", "relaciones", "carrera y vocación"],
    nature: "transformador",
    advice: "No tomes decisiones impulsivas bajo la primera descarga de energía. Pero tampoco ignores lo que te pide salir. La pregunta clave: ¿qué estarías haciendo si no tuvieras miedo?",
    duration_note: "Tránsito generacional: 1-2 años de proceso. La revelación puede llegar de golpe.",
  },

  // Neptuno cuadratura Neptuno (~40-42 años) y oposición (~80-84 años)
  "neptuno_cuadratura_neptuno": {
    title: "Cuadratura de Neptuno (~40-42 años) — crisis de los ideales",
    summary: "La primera cuadratura de Neptuno a sí mismo (~40-42 años) señala el momento en que los ideales de juventud chocan con la realidad. ¿Qué parte de tus sueños era auténtica?",
    detailed: "Neptuno cuestiona los ideales, las ilusiones y las aspiraciones profundas con las que construiste tu identidad. Lo que descubres no es que los sueños estaban mal: es que algunos necesitaban madurar y otros necesitan ser honradamente soltados. Puede haber confusión, desilusión o, paradójicamente, una renovación espiritual profunda si permites que el proceso ocurra sin resistir.",
    life_areas: ["ideales", "espiritualidad", "propósito profundo", "mundo interior"],
    nature: "transformador",
    advice: "Distingue entre el sueño que te trajo hasta aquí y el sueño que necesitas para el siguiente capítulo. No son el mismo.",
    duration_note: "Proceso de 2-3 años. Neptuno se mueve lentamente y el tránsito puede tener múltiples exactos.",
  },

  // Plutón cuadratura Plutón (~36-40 años generación Plutón en Libra/Virgo)
  "plutón_cuadratura_plutón": {
    title: "Cuadratura de Plutón (~36-40 años) — crisis de poder",
    summary: "La cuadratura de Plutón a sí mismo (~36-40 años según la generación) marca una crisis de poder personal: lo que no lograste transformar antes, se vuelve urgente ahora.",
    detailed: "Plutón cuestiona la distribución de poder en tu vida: ¿dónde te has sometido por miedo? ¿Dónde ejerces poder de forma no auténtica? Este tránsito fuerza una actualización psicológica profunda. Lo que resistes, persiste. Lo que permites que muera, renace transformado.",
    life_areas: ["poder personal", "transformación psicológica", "relaciones de poder", "sombra"],
    nature: "transformador",
    advice: "Este no es el momento de controlar más: es el momento de soltar lo que no era tuyo. La psicoterapia, el trabajo con el cuerpo o la práctica espiritual son aliados naturales.",
    duration_note: "Proceso de 2-3 años. El tránsito puede tener hasta 3 pasadas exactas por retrogradación de Plutón.",
  },
};

// ── Generador de interpretaciones ─────────────────────────────────────────────

function buildKey(tp: string, aspect: string, np: string): string {
  return `${tp.toLowerCase()}_${aspect.toLowerCase().replace(/ /g, "_")}_${np.toLowerCase()}`;
}

function generate(tp: string, aspect: string, np: string): TransitInterpretation {
  const key = buildKey(tp, aspect, np);
  const ta = PLANET_ARCHETYPE[tp];
  const na = NATAL_ARCHETYPE[np];
  const asp = ASPECT_TEMPLATE[aspect];

  if (!ta || !na || !asp) throw new Error(`Missing template for ${key}`);

  const override = OVERRIDES[key] ?? {};
  const combinedAreas = Array.from(new Set([...ta.areas.slice(0, 2), ...na.areas.slice(0, 2)]));

  const base: TransitInterpretation = {
    key,
    transit_planet: tp,
    natal_planet: np,
    aspect,
    title: `${tp} ${aspect.toLowerCase()} ${np} natal`,
    summary: `${tp} activa tu ${na.role} a través de ${asp.keyword}. ${asp.dynamic}`,
    detailed: `La energía ${ta.energy} de ${tp} impacta directamente sobre ${na.role}. ${asp.dynamic} Este período te invita a trabajar conscientemente con los temas de ${combinedAreas.slice(0, 2).join(" y ")}, con especial énfasis en ${na.areas[0]}.`,
    life_areas: combinedAreas,
    nature: asp.nature,
    advice: `Trabaja conscientemente con los temas de ${na.areas[0]} y ${ta.areas[0]} durante este período.`,
    duration_note: DURATION_NOTES[tp] ?? "Duración variable según el planeta transitante.",
  };

  return { ...base, ...override } as TransitInterpretation;
}

// ── Construir diccionario completo de 270 interpretaciones ────────────────────

const TRANSIT_PLANETS = ["Júpiter", "Saturno", "Urano", "Neptuno", "Plutón", "Marte"];
const ASPECTS = ["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"];
// Incluye los 5 planetas natales que faltaban: Urano/Neptuno/Plutón/Nodo Norte/Quirón.
// Sin esto, getInterpretation() devolvía undefined para cualquier tránsito
// que tocara uno de estos puntos natales (p. ej. Saturno cuadratura Plutón natal).
const NATAL_PLANETS = [
  "Sol", "Luna", "Mercurio", "Venus", "Marte",
  "Júpiter", "Saturno", "Urano", "Neptuno", "Plutón",
  "Nodo Norte", "Quirón", "Ascendente", "MC",
];

export const INTERPRETATIONS: Record<string, TransitInterpretation> = {};

for (const tp of TRANSIT_PLANETS) {
  for (const aspect of ASPECTS) {
    for (const np of NATAL_PLANETS) {
      const interp = generate(tp, aspect, np);
      INTERPRETATIONS[interp.key] = interp;
    }
  }
}

// ── Mapa de aspectos menores a mayores para fallback ─────────────────────────

const MINOR_ASPECT_FALLBACK: Record<string, string> = {
  "Semi-sextil":      "Sextil",
  "Semisextil":       "Sextil",
  "Semisquare":       "Cuadratura",
  "Semicuadratura":   "Cuadratura",
  "Sesquicuadratura": "Cuadratura",
  "Quincuncio":       "Oposición",
  "Quincunx":         "Oposición",
};

function resolveAspect(aspect: string): string {
  return MINOR_ASPECT_FALLBACK[aspect] ?? aspect;
}

// ── API pública ───────────────────────────────────────────────────────────────

export function getInterpretation(key: string): TransitInterpretation | undefined {
  if (INTERPRETATIONS[key]) return INTERPRETATIONS[key];
  // Attempt minor-aspect fallback: replace aspect segment in key
  for (const [minor, major] of Object.entries(MINOR_ASPECT_FALLBACK)) {
    const minorSlug = minor.toLowerCase().replace(/ /g, "_");
    const majorSlug = major.toLowerCase().replace(/ /g, "_");
    if (key.includes(minorSlug)) {
      const fallbackKey = key.replace(minorSlug, majorSlug);
      if (INTERPRETATIONS[fallbackKey]) return INTERPRETATIONS[fallbackKey];
    }
  }
  return undefined;
}

export function getInterpretationByComponents(
  transitPlanet: string,
  aspect: string,
  natalPlanet: string
): TransitInterpretation | undefined {
  const resolvedAspect = resolveAspect(aspect);
  const key = buildKey(transitPlanet, resolvedAspect, natalPlanet);
  return INTERPRETATIONS[key];
}
