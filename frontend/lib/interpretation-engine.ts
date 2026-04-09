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
  "Sol":         { role: "tu identidad y voluntad",        areas: ["identidad", "vitalidad", "ego", "propósito"] },
  "Luna":        { role: "tus emociones y hábitos",        areas: ["emociones", "hogar", "familia", "instintos"] },
  "Mercurio":    { role: "tu mente y comunicación",        areas: ["comunicación", "aprendizaje", "contratos", "pensamiento"] },
  "Venus":       { role: "tus valores y relaciones",       areas: ["amor", "dinero", "belleza", "relaciones"] },
  "Marte":       { role: "tu energía y acción",            areas: ["acción", "sexualidad", "coraje", "conflictos"] },
  "Júpiter":     { role: "tu expansión y optimismo",       areas: ["expansión", "fe", "crecimiento", "filosofía"] },
  "Saturno":     { role: "tu estructura y limitaciones",   areas: ["disciplina", "madurez", "restricciones", "karma"] },
  "Ascendente":  { role: "tu personalidad e imagen",       areas: ["identidad", "apariencia", "comienzos", "perspectiva"] },
  "MC":          { role: "tu vocación y imagen pública",   areas: ["carrera", "reputación", "vocación", "logros"] },
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
  const combinedAreas = [...new Set([...ta.areas.slice(0, 2), ...na.areas.slice(0, 2)])];

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
const NATAL_PLANETS = ["Sol", "Luna", "Mercurio", "Venus", "Marte", "Júpiter", "Saturno", "Ascendente", "MC"];

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
