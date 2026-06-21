import type { TransitInterpretation } from "./types";

// ── Datos base para generar interpretaciones (ES) ─────────────────────────────

const PLANET_ARCHETYPE: Record<string, { role: string; areas: string[]; energy: string }> = {
  "Júpiter": { role: "la expansión y la abundancia",     areas: ["crecimiento", "filosofía", "viajes", "espiritualidad"], energy: "expansiva" },
  "Saturno": { role: "la disciplina y el karma",         areas: ["carrera", "responsabilidades", "estructura", "límites"],  energy: "restrictiva" },
  "Urano":   { role: "el cambio súbito y la liberación", areas: ["innovación", "libertad", "tecnología", "revolución"],      energy: "disruptiva" },
  "Neptuno": { role: "lo espiritual y lo disuelto",      areas: ["espiritualidad", "creatividad", "ilusiones", "sacrificio"], energy: "disolvente" },
  "Plutón":  { role: "la transformación y el poder",     areas: ["transformación", "poder", "regeneración", "secretos"],    energy: "transformadora" },
  "Marte":   { role: "la acción y la energía",           areas: ["energía", "conflictos", "sexualidad", "iniciativa"],      energy: "activadora" },
};

const NATAL_ARCHETYPE: Record<string, { role: string; areas: string[] }> = {
  "Sol":        { role: "tu identidad y voluntad",                areas: ["identidad", "vitalidad", "ego", "propósito"] },
  "Luna":       { role: "tus emociones y hábitos",               areas: ["emociones", "hogar", "familia", "instintos"] },
  "Mercurio":   { role: "tu mente y comunicación",               areas: ["comunicación", "aprendizaje", "contratos", "pensamiento"] },
  "Venus":      { role: "tus valores y relaciones",              areas: ["amor", "dinero", "belleza", "relaciones"] },
  "Marte":      { role: "tu energía y acción",                   areas: ["acción", "sexualidad", "coraje", "conflictos"] },
  "Júpiter":    { role: "tu expansión y optimismo",              areas: ["expansión", "fe", "crecimiento", "filosofía"] },
  "Saturno":    { role: "tu estructura y limitaciones",          areas: ["disciplina", "madurez", "restricciones", "karma"] },
  // Planetas transpersonales como puntos natales (Tompkins, Sasportas):
  // cuando son aspectados por tránsitos representan el nivel generacional
  // y colectivo de la psique siendo activado por el ciclo actual.
  "Urano":      { role: "tu necesidad de libertad e innovación", areas: ["libertad", "cambios", "originalidad", "rebeldía"] },
  "Neptuno":    { role: "tu vida espiritual e imaginativa",      areas: ["espiritualidad", "imaginación", "ideales", "compasión"] },
  "Plutón":     { role: "tu capacidad de transformación y poder", areas: ["transformación", "poder", "sombra", "regeneración"] },
  "Nodo Norte": { role: "tu dirección evolutiva y karma",        areas: ["propósito kármico", "crecimiento", "destino", "aprendizaje"] },
  "Quirón":     { role: "tu herida y potencial de sanación",     areas: ["herida", "sanación", "vulnerabilidad", "maestría"] },
  "Ascendente": { role: "tu personalidad e imagen",              areas: ["identidad", "apariencia", "comienzos", "perspectiva"] },
  "MC":         { role: "tu vocación y imagen pública",          areas: ["carrera", "reputación", "vocación", "logros"] },
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

// ── Base data for generating interpretations (EN) ─────────────────────────────

const PLANET_ARCHETYPE_EN: Record<string, { role: string; areas: string[]; energy: string }> = {
  "Júpiter": { role: "expansion and abundance",          areas: ["growth", "philosophy", "travel", "spirituality"], energy: "expansive" },
  "Saturno": { role: "discipline and karma",             areas: ["career", "responsibilities", "structure", "limits"], energy: "restrictive" },
  "Urano":   { role: "sudden change and liberation",     areas: ["innovation", "freedom", "technology", "revolution"], energy: "disruptive" },
  "Neptuno": { role: "the spiritual and the dissolved",  areas: ["spirituality", "creativity", "illusions", "sacrifice"], energy: "dissolving" },
  "Plutón":  { role: "transformation and power",         areas: ["transformation", "power", "regeneration", "secrets"], energy: "transformative" },
  "Marte":   { role: "action and energy",                areas: ["energy", "conflict", "sexuality", "initiative"], energy: "activating" },
};

const NATAL_ARCHETYPE_EN: Record<string, { role: string; areas: string[] }> = {
  "Sol":        { role: "your identity and will",                    areas: ["identity", "vitality", "ego", "purpose"] },
  "Luna":       { role: "your emotions and habits",                  areas: ["emotions", "home", "family", "instincts"] },
  "Mercurio":   { role: "your mind and communication",              areas: ["communication", "learning", "contracts", "thinking"] },
  "Venus":      { role: "your values and relationships",            areas: ["love", "money", "beauty", "relationships"] },
  "Marte":      { role: "your energy and drive",                    areas: ["action", "sexuality", "courage", "conflict"] },
  "Júpiter":    { role: "your expansion and optimism",              areas: ["expansion", "faith", "growth", "philosophy"] },
  "Saturno":    { role: "your structure and limitations",           areas: ["discipline", "maturity", "restrictions", "karma"] },
  // Transpersonal planets as natal points (Tompkins, Sasportas):
  // when aspected by transits they represent the generational
  // and collective level of the psyche being activated by the current cycle.
  "Urano":      { role: "your need for freedom and innovation",     areas: ["freedom", "change", "originality", "rebellion"] },
  "Neptuno":    { role: "your spiritual and imaginative life",      areas: ["spirituality", "imagination", "ideals", "compassion"] },
  "Plutón":     { role: "your capacity for transformation and power", areas: ["transformation", "power", "shadow", "regeneration"] },
  "Nodo Norte": { role: "your evolutionary direction and karma",    areas: ["karmic purpose", "growth", "destiny", "learning"] },
  "Quirón":     { role: "your wound and healing potential",         areas: ["wound", "healing", "vulnerability", "mastery"] },
  "Ascendente": { role: "your personality and image",              areas: ["identity", "appearance", "beginnings", "perspective"] },
  "MC":         { role: "your vocation and public image",          areas: ["career", "reputation", "vocation", "achievement"] },
};

const ASPECT_TEMPLATE_EN: Record<string, {
  nature: TransitInterpretation["nature"];
  keyword: string;
  dynamic: string;
  applying_note: string;
}> = {
  "Conjunción": {
    nature: "transformador",
    keyword: "fusion and intensification",
    dynamic: "The energies merge intensely, amplifying and transforming the natal principle.",
    applying_note: "The effect builds gradually and peaks at the exact date.",
  },
  "Oposición": {
    nature: "desafiante",
    keyword: "polarization and integration",
    dynamic: "Tension between opposites that demands conscious integration. It often manifests through other people.",
    applying_note: "Tension rises weeks before the exact aspect and releases slowly.",
  },
  "Cuadratura": {
    nature: "desafiante",
    keyword: "friction and forced action",
    dynamic: "Friction that demands action. The challenge is the catalyst for growth if met consciously.",
    applying_note: "Effects are most noticeable in the days closest to the exact aspect.",
  },
  "Trígono": {
    nature: "constructivo",
    keyword: "flow and opportunity",
    dynamic: "The energies flow harmoniously, facilitating progress and opening doors naturally.",
    applying_note: "The positive flow extends several weeks before and after the exact aspect.",
  },
  "Sextil": {
    nature: "constructivo",
    keyword: "support and opportunity",
    dynamic: "Subtle support that creates opportunities, though conscious action is required to take advantage of them.",
    applying_note: "A 2–3 week window of opportunity around the exact aspect.",
  },
};

const DURATION_NOTES_EN: Record<string, string> = {
  "Júpiter": "Fast transit: ~2–4 weeks total duration. Most intense during the week of exactness.",
  "Saturno": "Slow transit: can last 4–8 months, including retrograde passage. A triple pass is possible.",
  "Urano":   "Generational transit: lasts 1–2 full years. The change is often felt months before the exact aspect.",
  "Neptuno": "Very slow transit: lasts 2–3 years. Confusion and inspiration accumulate gradually.",
  "Plutón":  "Generational transit: can last 2–4 years. The transformation is deep and irreversible.",
  "Marte":   "Fast transit: ~1–2 weeks. Sharp and direct effect in the days around exactness.",
};

// ── Overrides de alta calidad para las 30 combinaciones más importantes (ES) ──

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

  // ── Nuevos overrides de alta calidad — planetas lentos × Sol/Luna/ASC/MC ──────

  "júpiter_oposición_sol": {
    title: "Júpiter oposición Sol natal",
    summary: "Expansión a través del contraste y la relación. Puedes recibir oportunidades a través de socios o en contextos opuestos a tu zona de comodidad.",
    detailed: "Júpiter se opone al Sol natal activando el eje yo–otro. Las oportunidades llegan mediadas por otras personas: socios, mentores o situaciones públicas. Hay tendencia al exceso de confianza; es clave discernir qué expansión es genuina y cuál es inflar el ego.",
    life_areas: ["relaciones", "socios", "identidad", "expansión"],
    nature: "constructivo",
    advice: "Aprovecha las oportunidades que llegan a través de otros, pero mantén tu sentido del límite personal.",
  },
  "júpiter_cuadratura_sol": {
    title: "Júpiter cuadratura Sol natal",
    summary: "Crecimiento con fricción: las oportunidades exigen esfuerzo real. Evita el exceso de optimismo o la sobreextensión de recursos.",
    detailed: "La cuadratura de Júpiter al Sol genera entusiasmo y ambición, pero también el riesgo de comprometerse con más de lo que se puede sostener. Es un período de lecciones sobre el discernimiento: no toda oportunidad que parece grande lo es.",
    life_areas: ["identidad", "ambición", "crecimiento", "recursos"],
    nature: "constructivo",
    advice: "Mantén el optimismo pero templa las expectativas. El crecimiento real requiere consolidación.",
  },
  "saturno_trígono_sol": {
    title: "Saturno trígono Sol natal",
    summary: "Período de consolidación y reconocimiento. El trabajo disciplinado de años anteriores comienza a dar frutos concretos.",
    detailed: "Saturno en trígono al Sol es uno de los tránsitos más favorables para la carrera y la maduración personal. La disciplina fluye sin fricción y los logros obtenidos ahora tienen bases sólidas. Las figuras de autoridad pueden reconocerte o apoyarte activamente.",
    life_areas: ["carrera", "logros", "disciplina", "reconocimiento"],
    nature: "constructivo",
    advice: "Formaliza proyectos, firma contratos y busca el reconocimiento que mereces. El momento es propicio.",
  },
  "saturno_sextil_sol": {
    title: "Saturno sextil Sol natal",
    summary: "Ventana de oportunidad para consolidar logros profesionales con esfuerzo moderado y planificación estratégica.",
    detailed: "El sextil de Saturno al Sol crea una ventana de apoyo sutil para la disciplina, la planificación y el trabajo concreto. Las responsabilidades se sienten manejables y las estructuras de vida se pueden ajustar con menos resistencia que en otros períodos.",
    life_areas: ["trabajo", "planificación", "estructura", "propósito"],
    nature: "constructivo",
    advice: "Organiza, planifica y trabaja con constancia. Este período favorece el esfuerzo sostenido.",
  },
  "neptuno_trígono_sol": {
    title: "Neptuno trígono Sol natal",
    summary: "Período de sensibilidad espiritual, inspiración creativa y apertura a lo sutil. La identidad se expande más allá del ego ordinario.",
    detailed: "Neptuno en trígono al Sol disuelve suavemente los límites del ego, abriendo a la experiencia mística, artística o espiritual. La creatividad fluye con naturalidad y la compasión se expande. Sin la tensión de aspectos difíciles, este tránsito puede traer visiones clarificadoras sobre el propósito de vida.",
    life_areas: ["espiritualidad", "creatividad", "propósito", "inspiración"],
    nature: "constructivo",
    advice: "Cultiva prácticas contemplativas, artísticas o de servicio. Lo que abre ahora puede guiar años futuros.",
  },
  "neptuno_oposición_sol": {
    title: "Neptuno oposición Sol natal",
    summary: "Período de confusión de identidad y búsqueda de propósito más profundo. Lo que creías saber sobre ti mismo puede disolverse.",
    detailed: "Neptuno se opone al Sol natal desafiando la claridad de la identidad. Puedes sentirte perdido, sin dirección o susceptible a las proyecciones de otros. Sin embargo, bajo la confusión hay una invitación a encontrar un sentido de identidad más espiritual y menos egocéntrico.",
    life_areas: ["identidad", "propósito", "ilusiones", "espiritualidad"],
    nature: "transformador",
    advice: "No tomes decisiones importantes de identidad durante el punto álgido. Deja que la confusión te lleve a preguntas más profundas.",
  },
  "plutón_oposición_sol": {
    title: "Plutón oposición Sol natal",
    summary: "Crisis de poder e identidad. Las confrontaciones con el mundo externo fuerzan una transformación profunda del sentido de sí mismo.",
    detailed: "Plutón se opone al Sol natal enfrentándote con fuerzas externas que desafían tu voluntad, poder o sentido de control. Puedes experimentar confrontaciones con figuras de autoridad, batallas de poder en relaciones o circunstancias que te obligan a reinventarte profundamente.",
    life_areas: ["poder", "identidad", "confrontaciones", "transformación"],
    nature: "transformador",
    advice: "No luches contra los cambios que vienen del exterior. Identifica qué parte de tu identidad puede transformarse, no qué puede resistir.",
  },
  "júpiter_conjunción_luna": {
    title: "Júpiter conjunción Luna natal",
    summary: "Expansión emocional y apertura familiar. Período de generosidad, calidez y oportunidades a través del hogar y la familia.",
    detailed: "Júpiter amplifica los principios de la Luna: el hogar se expande, las emociones son más generosas y optimistas, y la relación con la familia o las figuras nutricias puede mejorar notablemente. Hay tendencia a la sobreindulgencia emocional, pero predomina la calidez.",
    life_areas: ["emociones", "familia", "hogar", "bienestar"],
    nature: "constructivo",
    advice: "Cuida a quienes amas con generosidad. Es también un buen momento para ampliar el hogar o crear familia.",
  },
  "saturno_conjunción_luna": {
    title: "Saturno conjunción Luna natal",
    summary: "Maduración emocional profunda. El período puede traer soledad, responsabilidades familiares intensas o la necesidad de poner límites emocionales.",
    detailed: "Saturno transita sobre la Luna natal: las emociones se enfrían, se vuelven más serias o encuentran resistencia. Pueden surgir responsabilidades con la familia, la madre o el hogar. Aunque el período puede sentirse pesado, es una oportunidad de maduración emocional genuina.",
    life_areas: ["emociones", "familia", "límites", "madurez"],
    nature: "desafiante",
    advice: "Establece límites emocionales saludables. La frialdad que sientes no es ausencia de amor, sino llamado a la madurez.",
  },
  "plutón_trígono_luna": {
    title: "Plutón trígono Luna natal",
    summary: "Transformación emocional profunda que fluye sin resistencia. Sanación de heridas antiguas y renovación del mundo interior.",
    detailed: "El trígono de Plutón a la Luna facilita la transformación emocional sin la intensidad destructiva de aspectos tensos. Viejos patrones emocionales pueden disolverse naturalmente, haciendo espacio para una profundidad emocional más auténtica. La relación con la familia o el pasado puede sanar.",
    life_areas: ["emociones", "sanación", "transformación", "familia"],
    nature: "constructivo",
    advice: "Trabaja conscientemente con tu mundo interior: terapia, introspección o trabajo con el cuerpo pueden ser especialmente fructíferos.",
  },
  "urano_cuadratura_luna": {
    title: "Urano cuadratura Luna natal",
    summary: "Inestabilidad emocional y ruptura con patrones familiares o domésticos. Los cambios llegan de forma súbita e inesperada al mundo emocional.",
    detailed: "Urano en cuadratura a la Luna perturba la estabilidad emocional y del hogar. Pueden ocurrir rupturas familiares, cambios de residencia no planificados o alteraciones en los ritmos vitales (sueño, hábitos). La inestabilidad es real pero temporal; el objetivo es liberar el mundo emocional de condicionamientos obsoletos.",
    life_areas: ["emociones", "hogar", "familia", "hábitos"],
    nature: "desafiante",
    advice: "No te alarmes ante los cambios repentinos. Bajo la inestabilidad hay una liberación emocional necesaria.",
  },
  "júpiter_conjunción_ascendente": {
    title: "Júpiter conjunción Ascendente natal",
    summary: "Período de expansión de la personalidad y la imagen. Las oportunidades llegan al cruzar umbrales nuevos; la visibilidad personal aumenta.",
    detailed: "Júpiter cruza el Ascendente, el punto más personal de la carta. Tu presencia personal se expande, tu confianza crece y las oportunidades se abren en el entorno inmediato. Es uno de los mejores momentos para iniciar proyectos, emprendimientos o relaciones significativas.",
    life_areas: ["identidad", "oportunidades", "imagen personal", "comienzos"],
    nature: "constructivo",
    advice: "Preséntate al mundo con confianza. Las puertas que se abren ahora merecen ser atravesadas.",
  },
  "saturno_oposición_ascendente": {
    title: "Saturno oposición Ascendente (conjunción Descendente)",
    summary: "Las relaciones importantes entran en un período de prueba estructural. Se consolidan o se transforman radicalmente.",
    detailed: "Saturno sobre el Descendente (opuesto al Ascendente) pone a prueba los compromisos relacionales: los que son genuinos se formalizan o fortalecen, los que no lo son muestran sus grietas. Pueden surgir responsabilidades en pareja, compromisos formales o la conclusión de relaciones que habían llegado a su límite.",
    life_areas: ["relaciones", "compromisos", "pareja", "socios"],
    nature: "desafiante",
    advice: "Evalúa honestamente tus relaciones más importantes. No por miedo, sino por madurez y autenticidad.",
  },
  "plutón_conjunción_mc": {
    title: "Plutón conjunción MC natal",
    summary: "Transformación radical de la carrera y la imagen pública. Lo que construiste profesionalmente puede derrumbarse para reconstruirse con mayor autenticidad.",
    detailed: "Este es uno de los tránsitos profesionales más poderosos. Plutón en conjunción al MC transforma la vocación desde la raíz: puedes experimentar el fin de una carrera y el nacimiento de otra, confrontaciones con el poder institucional o un ascenso que viene acompañado de responsabilidades enormes.",
    life_areas: ["carrera", "vocación", "poder", "imagen pública"],
    nature: "transformador",
    advice: "No te aferres a la forma en que tu carrera ha sido hasta ahora. La transformación viene a revelar una vocación más auténtica.",
  },
  "neptuno_conjunción_mc": {
    title: "Neptuno conjunción MC natal",
    summary: "El propósito vocacional se disuelve y se reorienta. Período de confusión profesional que puede culminar en una vocación más espiritual o creativa.",
    detailed: "Neptuno sobre el MC disuelve la claridad vocacional. Puede haber confusión sobre el camino profesional, idealización de metas o pérdida de dirección. Sin embargo, bajo la disolución emerge la posibilidad de una vocación más conectada con lo creativo, lo espiritual o el servicio genuino.",
    life_areas: ["carrera", "vocación", "propósito", "idealismo"],
    nature: "transformador",
    advice: "No busques claridad forzada. Permite que la confusión revele qué es lo que genuinamente importa hacer con tu vida.",
  },
  "urano_conjunción_mc": {
    title: "Urano conjunción MC natal",
    summary: "Ruptura con la trayectoria profesional anterior. Cambios súbitos en la carrera que abren caminos completamente inesperados.",
    detailed: "Urano cruza el Medio Cielo rompiendo la continuidad de la trayectoria profesional. Lo que parecía un camino establecido puede invertirse de golpe: pueden surgir nuevas vocaciones, cambios de industria o revelaciones sobre qué tipo de trabajo te hace verdaderamente libre.",
    life_areas: ["carrera", "vocación", "libertad", "innovación"],
    nature: "transformador",
    advice: "Abraza la ruptura con lo conocido. Lo que se rompió no era el destino final: era el andamio.",
  },
};

// ── High-quality overrides — same keys, English text (EN) ────────────────────

const OVERRIDES_EN: Partial<Record<string, Partial<TransitInterpretation>>> = {
  "júpiter_conjunción_sol": {
    title: "Jupiter conjunct natal Sun",
    summary: "A year of personal expansion, recognition, and new opportunities. Your vitality and confidence are at an all-time high.",
    detailed: "Jupiter amplifies everything the Sun represents: your identity, your will, and your sense of purpose. This transit marks the beginning of a new 12-year cycle in your personal development. Opportunities arrive naturally, and your optimism attracts favorable situations.",
    life_areas: ["identity", "career", "health", "purpose"],
    advice: "Use this energy to launch important projects and expand your vision of who you are.",
  },
  "saturno_conjunción_sol": {
    title: "Saturn conjunct natal Sun",
    summary: "A period of deep examination of your identity and purpose. You feel the weight of responsibilities but also the solidity of what you are building.",
    detailed: "Saturn tests the authenticity of your life path. This transit, which occurs every 29 years, demands maturity and realism. Whatever is not genuine in your life becomes unsustainable; what is solid grows enormously stronger.",
    life_areas: ["identity", "career", "authority", "maturity"],
    nature: "desafiante",
    advice: "Focus on building from a place of authenticity. Do not demand perfection of yourself, but do demand honesty.",
  },
  "plutón_conjunción_sol": {
    title: "Pluto conjunct natal Sun",
    summary: "Radical transformation of identity. Part of who you were must die so that who you truly are can emerge.",
    detailed: "This is one of the deepest transits in a lifetime. Pluto destroys in order to rebuild from the foundations. You may experience identity crises, confrontations with power, or lifestyle transformations that feel inevitable.",
    life_areas: ["identity", "power", "transformation", "purpose"],
    nature: "transformador",
    advice: "Do not resist the change. Ask yourself which part of your identity no longer serves you and consciously release it.",
  },
  "saturno_cuadratura_luna": {
    title: "Saturn square natal Moon",
    summary: "An emotionally demanding period. Emotions meet resistance or blockage, and family or personal responsibilities feel like a burden.",
    detailed: "Saturn slows the natural flow of emotions, creating a sense of loneliness, heaviness, or emotional inadequacy. It is a period of emotional maturation in which you learn to hold your feelings with discipline.",
    life_areas: ["emotions", "family", "home", "maturity"],
    nature: "desafiante",
    advice: "Seek support without shame. Controlled vulnerability is a strength during this period.",
  },
  "júpiter_trígono_venus": {
    title: "Jupiter trine natal Venus",
    summary: "A period of grace and abundance in love and finances. Relationships flourish and money flows more easily.",
    detailed: "One of the most beneficial combinations in transit astrology. Jupiter amplifies the principles of Venus, creating a period of attraction, generosity, and relational abundance. Ideal for making commitments, starting artistic projects, or investments.",
    life_areas: ["love", "money", "art", "relationships"],
    nature: "constructivo",
    advice: "This is an ideal moment to take important steps in love or finances. The universe is on your side.",
  },
  "urano_conjunción_ascendente": {
    title: "Uranus conjunct natal Ascendant",
    summary: "A revolution of identity and appearance. Sudden changes in how you perceive yourself and how others perceive you.",
    detailed: "Uranus crosses the most personal point of the chart: the mask with which you present yourself to the world. You may radically change your image, attitude, or lifestyle. The changes seem to come out of nowhere, but they have been accumulating for years.",
    life_areas: ["identity", "appearance", "beginnings", "freedom"],
    nature: "transformador",
    advice: "Embrace the change rather than resisting it. What you break now was a prison disguised as comfort.",
  },
  "saturno_conjunción_mc": {
    title: "Saturn conjunct natal MC",
    summary: "The apex of your professional career. Major achievements, but also the maximum weight of responsibilities.",
    detailed: "This transit marks the professional zenith of Saturn's cycle. You may attain recognition and positions of authority, but at a cost: the demands are enormous. What you have built over the past 14 years comes to light.",
    life_areas: ["career", "reputation", "achievement", "authority"],
    advice: "Take responsibility for what you have built. Real success comes with real commitments.",
  },
  "neptuno_conjunción_venus": {
    title: "Neptune conjunct natal Venus",
    summary: "Love and values dissolve into the ideal. Risk of romantic illusion, but also of deep spiritual love.",
    detailed: "Neptune dissolves the boundaries of love: you may fall deeply in love with someone who is not what they appear, or experience a genuinely transcendent spiritual love. Finances may also become confused or idealized.",
    life_areas: ["love", "illusions", "spirituality", "money"],
    nature: "transformador",
    advice: "Be honest about what you see versus what you want to see in your relationships. Trust your intuition.",
  },
  "plutón_conjunción_luna": {
    title: "Pluto conjunct natal Moon",
    summary: "Deep transformation of the emotional world. Old family patterns surface to be uprooted.",
    detailed: "Pluto dismantles the obsolete emotional patterns you inherited or developed. This process is intense and sometimes painful, but it liberates an emotional depth you did not previously have access to. Themes of family, mother, or childhood may resurface.",
    life_areas: ["emotions", "family", "transformation", "subconscious"],
    advice: "Allow what needs to come out to come out. Therapy or inner work are valuable allies.",
  },
  "júpiter_conjunción_mc": {
    title: "Jupiter conjunct natal MC",
    summary: "Professional peak and recognition. Career opportunities and public visibility reach their maximum.",
    detailed: "Jupiter expands the MC, the chart point associated with career and public image. You may receive promotions, recognition, job offers, or achieve professional goals you have been pursuing for years.",
    life_areas: ["career", "reputation", "achievement", "visibility"],
    advice: "Make yourself visible. Present your projects, apply for positions, let your work be known: the timing is perfect.",
  },

  // ── Planetary return cycles — biographical milestones ───────────────────────

  "saturno_conjunción_saturno": {
    title: "Saturn Return",
    summary: "The Saturn Return (~29 and ~58 years) marks the end of a vital era. Nothing that is not genuine survives this transit: relationships, careers, and life structures are put to the test.",
    detailed: "This is the astrological rite of passage par excellence. Saturn returns to its natal position and inaugurates a new 29-year cycle. The first return (~29 years) closes youth and demands taking responsibility for one's own life. The second return (~58 years) invites wisdom and transmission. What you feel 'no longer serves you' must be honestly released; what you built on solid foundations will find its definitive form.",
    life_areas: ["maturity", "life structure", "career", "committed relationships"],
    nature: "transformador",
    advice: "Do not flee from the responsibilities that appear now. They are the price of authenticity and the foundation of the next phase of your life.",
    duration_note: "A 1–2 year process. There may be a triple pass if Saturn retrogrades over its natal position.",
  },
  "saturno_cuadratura_saturno": {
    title: "Saturn Square Saturn (~21 and ~43 years)",
    summary: "A crisis of life structure. Saturn's squares to itself (~7, 21, 36, 43 years) are turning points where everything built so far is put to the test.",
    detailed: "The Saturn square to itself is the 'karmic friction' of its own cycle. At ~21 years, the individual faces the challenge of building their own structure separate from family. At ~43, the structure of maturity confronts its limits and demands updating. The pain is not failure: it is the signal that something needs to be redesigned with greater authenticity.",
    life_areas: ["structure", "career", "relationships", "responsibilities"],
    nature: "desafiante",
    advice: "Identify which structures in your life no longer reflect who you are today. This transit does not ask you to destroy everything, but to strengthen it honestly.",
  },
  "saturno_oposición_saturno": {
    title: "Saturn Opposition Saturn (~44 years) — midlife crisis",
    summary: "The Saturn opposition to itself (~44 years) is the structural 'midlife crisis': the moment when you must integrate what has been achieved and what has not, with equanimity.",
    detailed: "Saturn opposes its natal position only once in a lifetime, around ages 44–45. It is the culmination of the first complete cycle: everything you built, rejected, or postponed comes to light. Current commitments — professional, relational, and of identity — undergo an existential audit.",
    life_areas: ["mature identity", "career", "long-term relationships", "legacy"],
    nature: "desafiante",
    advice: "Do not compare your life with others': compare it with what you came to live. Honesty with yourself is the only path.",
  },

  "urano_oposición_urano": {
    title: "Uranus Opposition Uranus (~42 years) — soul awakening",
    summary: "The Uranus opposition to itself (~42 years) is the classic astrological trigger for the 'midlife crisis'. The soul demands freedom from everything that has kept it chained.",
    detailed: "This transit occurs only once in a lifetime and typically precipitates radical and unexpected changes: divorces, career changes, relocations, or spiritual crises. The pressure you feel is not disintegration: it is your authentic self breaking through. Uranus accepts no artificial structures at age 42; what falls had to fall.",
    life_areas: ["freedom", "authentic identity", "relationships", "career and vocation"],
    nature: "transformador",
    advice: "Do not make impulsive decisions under the first surge of energy. But do not ignore what asks to leave either. The key question: what would you be doing if you had no fear?",
    duration_note: "Generational transit: 1–2 years of process. The revelation can arrive all at once.",
  },

  "neptuno_cuadratura_neptuno": {
    title: "Neptune Square Neptune (~40–42 years) — crisis of ideals",
    summary: "The first Neptune square to itself (~40–42 years) signals the moment when the ideals of youth collide with reality. Which part of your dreams was authentic?",
    detailed: "Neptune questions the ideals, illusions, and deep aspirations with which you built your identity. What you discover is not that the dreams were wrong: it is that some needed to mature and others need to be honestly released. There may be confusion, disillusionment, or, paradoxically, a deep spiritual renewal if you allow the process to unfold without resistance.",
    life_areas: ["ideals", "spirituality", "deep purpose", "inner world"],
    nature: "transformador",
    advice: "Distinguish between the dream that brought you here and the dream you need for the next chapter. They are not the same.",
    duration_note: "A 2–3 year process. Neptune moves slowly and the transit may have multiple exact passes.",
  },

  "plutón_cuadratura_plutón": {
    title: "Pluto Square Pluto (~36–40 years) — power crisis",
    summary: "The Pluto square to itself (~36–40 years, depending on generation) marks a personal power crisis: what you did not manage to transform before becomes urgent now.",
    detailed: "Pluto questions the distribution of power in your life: where have you submitted out of fear? Where do you exercise power inauthentically? This transit forces a deep psychological update. What you resist, persists. What you allow to die, is reborn transformed.",
    life_areas: ["personal power", "psychological transformation", "power relationships", "shadow"],
    nature: "transformador",
    advice: "This is not the moment to control more: it is the moment to release what was never yours. Psychotherapy, bodywork, or spiritual practice are natural allies.",
    duration_note: "A 2–3 year process. The transit may have up to 3 exact passes due to Pluto's retrograde motion.",
  },

  "júpiter_oposición_sol": {
    title: "Jupiter opposite natal Sun",
    summary: "Expansion through contrast and relationship. Opportunities may arrive through partners or in contexts opposite to your comfort zone.",
    detailed: "Jupiter opposes the natal Sun, activating the self–other axis. Opportunities come mediated by other people: partners, mentors, or public situations. There is a tendency toward overconfidence; discerning which expansion is genuine versus mere ego inflation is key.",
    life_areas: ["relationships", "partners", "identity", "expansion"],
    nature: "constructivo",
    advice: "Take advantage of opportunities that come through others, but maintain your sense of personal boundaries.",
  },
  "júpiter_cuadratura_sol": {
    title: "Jupiter square natal Sun",
    summary: "Growth with friction: opportunities demand real effort. Avoid excessive optimism or overextension of resources.",
    detailed: "The Jupiter square to the Sun generates enthusiasm and ambition, but also the risk of committing to more than can be sustained. It is a period of lessons about discernment: not every opportunity that appears large truly is.",
    life_areas: ["identity", "ambition", "growth", "resources"],
    nature: "constructivo",
    advice: "Maintain optimism but temper expectations. Real growth requires consolidation.",
  },
  "saturno_trígono_sol": {
    title: "Saturn trine natal Sun",
    summary: "A period of consolidation and recognition. The disciplined work of previous years begins to bear concrete fruit.",
    detailed: "Saturn trine the Sun is one of the most favorable transits for career and personal maturation. Discipline flows without friction and achievements gained now have solid foundations. Authority figures may actively recognize or support you.",
    life_areas: ["career", "achievement", "discipline", "recognition"],
    nature: "constructivo",
    advice: "Formalize projects, sign contracts, and seek the recognition you deserve. The moment is propitious.",
  },
  "saturno_sextil_sol": {
    title: "Saturn sextile natal Sun",
    summary: "A window of opportunity to consolidate professional achievements with moderate effort and strategic planning.",
    detailed: "The Saturn sextile to the Sun creates a subtle window of support for discipline, planning, and concrete work. Responsibilities feel manageable and life structures can be adjusted with less resistance than in other periods.",
    life_areas: ["work", "planning", "structure", "purpose"],
    nature: "constructivo",
    advice: "Organize, plan, and work with consistency. This period favors sustained effort.",
  },
  "neptuno_trígono_sol": {
    title: "Neptune trine natal Sun",
    summary: "A period of spiritual sensitivity, creative inspiration, and openness to the subtle. Identity expands beyond the ordinary ego.",
    detailed: "Neptune trine the Sun gently dissolves the boundaries of the ego, opening to mystical, artistic, or spiritual experience. Creativity flows naturally and compassion expands. Without the tension of difficult aspects, this transit can bring clarifying visions about life purpose.",
    life_areas: ["spirituality", "creativity", "purpose", "inspiration"],
    nature: "constructivo",
    advice: "Cultivate contemplative, artistic, or service-oriented practices. What opens now can guide future years.",
  },
  "neptuno_oposición_sol": {
    title: "Neptune opposite natal Sun",
    summary: "A period of identity confusion and the search for deeper purpose. What you thought you knew about yourself may dissolve.",
    detailed: "Neptune opposes the natal Sun, challenging the clarity of identity. You may feel lost, directionless, or susceptible to others' projections. However, beneath the confusion lies an invitation to find a more spiritual, less ego-centered sense of identity.",
    life_areas: ["identity", "purpose", "illusions", "spirituality"],
    nature: "transformador",
    advice: "Do not make important identity decisions during the peak. Let the confusion lead you to deeper questions.",
  },
  "plutón_oposición_sol": {
    title: "Pluto opposite natal Sun",
    summary: "A crisis of power and identity. Confrontations with the external world force a deep transformation of the sense of self.",
    detailed: "Pluto opposes the natal Sun, confronting you with external forces that challenge your will, power, or sense of control. You may experience confrontations with authority figures, power struggles in relationships, or circumstances that compel you to reinvent yourself profoundly.",
    life_areas: ["power", "identity", "confrontations", "transformation"],
    nature: "transformador",
    advice: "Do not fight the changes coming from outside. Identify which part of your identity can transform, not which part can resist.",
  },
  "júpiter_conjunción_luna": {
    title: "Jupiter conjunct natal Moon",
    summary: "Emotional expansion and family openness. A period of generosity, warmth, and opportunities through home and family.",
    detailed: "Jupiter amplifies the principles of the Moon: the home expands, emotions are more generous and optimistic, and the relationship with family or nurturing figures can improve noticeably. There is a tendency toward emotional overindulgence, but warmth predominates.",
    life_areas: ["emotions", "family", "home", "well-being"],
    nature: "constructivo",
    advice: "Care for those you love with generosity. It is also a good time to expand the home or start a family.",
  },
  "saturno_conjunción_luna": {
    title: "Saturn conjunct natal Moon",
    summary: "Deep emotional maturation. This period may bring loneliness, intense family responsibilities, or the need to establish emotional boundaries.",
    detailed: "Saturn transits over the natal Moon: emotions cool, become more serious, or meet resistance. Responsibilities involving family, the mother, or the home may arise. Although the period may feel heavy, it is an opportunity for genuine emotional maturation.",
    life_areas: ["emotions", "family", "boundaries", "maturity"],
    nature: "desafiante",
    advice: "Establish healthy emotional boundaries. The coolness you feel is not an absence of love, but a call to maturity.",
  },
  "plutón_trígono_luna": {
    title: "Pluto trine natal Moon",
    summary: "Deep emotional transformation that flows without resistance. Healing of old wounds and renewal of the inner world.",
    detailed: "The Pluto trine to the Moon facilitates emotional transformation without the destructive intensity of tense aspects. Old emotional patterns can dissolve naturally, making space for a more authentic emotional depth. The relationship with family or the past can heal.",
    life_areas: ["emotions", "healing", "transformation", "family"],
    nature: "constructivo",
    advice: "Work consciously with your inner world: therapy, introspection, or bodywork can be especially fruitful.",
  },
  "urano_cuadratura_luna": {
    title: "Uranus square natal Moon",
    summary: "Emotional instability and rupture with family or domestic patterns. Changes arrive suddenly and unexpectedly in the emotional world.",
    detailed: "Uranus square the Moon disrupts emotional and domestic stability. Family ruptures, unplanned changes of residence, or alterations in vital rhythms (sleep, habits) may occur. The instability is real but temporary; the aim is to free the emotional world from obsolete conditioning.",
    life_areas: ["emotions", "home", "family", "habits"],
    nature: "desafiante",
    advice: "Do not be alarmed by sudden changes. Beneath the instability lies a necessary emotional liberation.",
  },
  "júpiter_conjunción_ascendente": {
    title: "Jupiter conjunct natal Ascendant",
    summary: "A period of expansion of personality and image. Opportunities arrive as new thresholds are crossed; personal visibility increases.",
    detailed: "Jupiter crosses the Ascendant, the most personal point of the chart. Your personal presence expands, your confidence grows, and opportunities open up in your immediate environment. This is one of the best moments to initiate projects, ventures, or meaningful relationships.",
    life_areas: ["identity", "opportunities", "personal image", "beginnings"],
    nature: "constructivo",
    advice: "Present yourself to the world with confidence. The doors that open now deserve to be walked through.",
  },
  "saturno_oposición_ascendente": {
    title: "Saturn opposite Ascendant (conjunct Descendant)",
    summary: "Important relationships enter a period of structural testing. They consolidate or transform radically.",
    detailed: "Saturn on the Descendant (opposite the Ascendant) tests relational commitments: those that are genuine are formalized or strengthened, those that are not show their cracks. Partnership responsibilities, formal commitments, or the conclusion of relationships that had reached their limit may emerge.",
    life_areas: ["relationships", "commitments", "partner", "associates"],
    nature: "desafiante",
    advice: "Evaluate your most important relationships honestly. Not out of fear, but out of maturity and authenticity.",
  },
  "plutón_conjunción_mc": {
    title: "Pluto conjunct natal MC",
    summary: "Radical transformation of career and public image. What you built professionally may collapse in order to be rebuilt with greater authenticity.",
    detailed: "This is one of the most powerful professional transits. Pluto conjunct the MC transforms vocation from the roots: you may experience the end of one career and the birth of another, confrontations with institutional power, or a promotion accompanied by enormous responsibilities.",
    life_areas: ["career", "vocation", "power", "public image"],
    nature: "transformador",
    advice: "Do not cling to the form your career has taken until now. The transformation comes to reveal a more authentic vocation.",
  },
  "neptuno_conjunción_mc": {
    title: "Neptune conjunct natal MC",
    summary: "Vocational purpose dissolves and reorients. A period of professional confusion that may culminate in a more spiritual or creative vocation.",
    detailed: "Neptune on the MC dissolves vocational clarity. There may be confusion about the professional path, idealization of goals, or loss of direction. However, beneath the dissolution emerges the possibility of a vocation more connected to the creative, the spiritual, or genuine service.",
    life_areas: ["career", "vocation", "purpose", "idealism"],
    nature: "transformador",
    advice: "Do not seek forced clarity. Allow the confusion to reveal what genuinely matters to do with your life.",
  },
  "urano_conjunción_mc": {
    title: "Uranus conjunct natal MC",
    summary: "A break with the previous professional trajectory. Sudden career changes open completely unexpected paths.",
    detailed: "Uranus crosses the Midheaven, breaking the continuity of the professional trajectory. What seemed an established path may reverse suddenly: new vocations, industry changes, or revelations about what kind of work truly sets you free may arise.",
    life_areas: ["career", "vocation", "freedom", "innovation"],
    nature: "transformador",
    advice: "Embrace the break with the known. What broke was not the final destination: it was the scaffolding.",
  },
};

// ── Generador de interpretaciones ─────────────────────────────────────────────

function buildKey(tp: string, aspect: string, np: string): string {
  return `${tp.toLowerCase()}_${aspect.toLowerCase().replace(/ /g, "_")}_${np.toLowerCase()}`;
}

function generate(tp: string, aspect: string, np: string, lang: "es" | "en" = "es"): TransitInterpretation {
  const key = buildKey(tp, aspect, np);

  if (lang === "en") {
    const ta = PLANET_ARCHETYPE_EN[tp];
    const na = NATAL_ARCHETYPE_EN[np];
    const asp = ASPECT_TEMPLATE_EN[aspect];

    if (!ta || !na || !asp) throw new Error(`Missing EN template for ${key}`);

    const overrideEN = OVERRIDES_EN[key] ?? {};
    const combinedAreas = Array.from(new Set([...ta.areas.slice(0, 2), ...na.areas.slice(0, 2)]));

    const baseEN: TransitInterpretation = {
      key,
      transit_planet: tp,
      natal_planet: np,
      aspect,
      title: `${tp} ${aspect.toLowerCase()} ${np} natal`,
      summary: `${tp} activates your ${na.role} through ${asp.keyword}. ${asp.dynamic}`,
      detailed: `The ${ta.energy} energy of ${tp} impacts directly on ${na.role}. ${asp.dynamic} This period invites you to work consciously with themes of ${combinedAreas.slice(0, 2).join(" and ")}, with special emphasis on ${na.areas[0]}.`,
      life_areas: combinedAreas,
      nature: asp.nature,
      advice: `Work consciously with themes of ${na.areas[0]} and ${ta.areas[0]} during this period.`,
      duration_note: DURATION_NOTES_EN[tp] ?? "Duration varies depending on the transiting planet.",
    };

    return { ...baseEN, ...overrideEN } as TransitInterpretation;
  }

  // lang === "es" (default)
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

// ── Construir diccionario completo de 270 interpretaciones (ES, para compatibilidad) ──

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
      const interp = generate(tp, aspect, np, "es");
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

// ── Key parsing for EN on-the-fly generation ─────────────────────────────────

// Planet name map: lowercase key → canonical Spanish name used internally
const PLANET_NAME_MAP: Record<string, string> = {
  "júpiter":    "Júpiter",
  "saturno":    "Saturno",
  "urano":      "Urano",
  "neptuno":    "Neptuno",
  "plutón":     "Plutón",
  "marte":      "Marte",
  "sol":        "Sol",
  "luna":       "Luna",
  "mercurio":   "Mercurio",
  "venus":      "Venus",
  "nodo norte": "Nodo Norte",
  "quirón":     "Quirón",
  "ascendente": "Ascendente",
  "mc":         "MC",
};

// Aspect slug → canonical Spanish aspect name
const ASPECT_SLUG_MAP: Record<string, string> = {
  "conjunción":     "Conjunción",
  "oposición":      "Oposición",
  "cuadratura":     "Cuadratura",
  "trígono":        "Trígono",
  "sextil":         "Sextil",
};

/**
 * Parse a key like "júpiter_conjunción_sol" back to [transitPlanet, aspect, natalPlanet].
 * Returns null if parsing fails.
 */
function parseKey(key: string): [string, string, string] | null {
  // Try each transit planet prefix
  for (const tpSlug of Object.keys(PLANET_NAME_MAP)) {
    const prefix = tpSlug + "_";
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);

    // Try each aspect slug
    for (const aspSlug of Object.keys(ASPECT_SLUG_MAP)) {
      const aspPart = aspSlug + "_";
      if (!rest.startsWith(aspPart)) continue;
      const npSlug = rest.slice(aspPart.length);
      const tp = PLANET_NAME_MAP[tpSlug];
      const asp = ASPECT_SLUG_MAP[aspSlug];
      const np = PLANET_NAME_MAP[npSlug] ?? null;
      if (tp && asp && np) return [tp, asp, np];
    }
  }
  return null;
}

// ── API pública ───────────────────────────────────────────────────────────────

export function getInterpretation(key: string, lang: "es" | "en" = "es"): TransitInterpretation | undefined {
  if (lang === "en") {
    const parsed = parseKey(key);
    if (parsed) {
      try {
        return generate(parsed[0], parsed[1], parsed[2], "en");
      } catch {
        // fall through to undefined
      }
    }
    // Try minor-aspect fallback for EN
    for (const [minor, major] of Object.entries(MINOR_ASPECT_FALLBACK)) {
      const minorSlug = minor.toLowerCase().replace(/ /g, "_");
      const majorSlug = major.toLowerCase().replace(/ /g, "_");
      if (key.includes(minorSlug)) {
        const fallbackKey = key.replace(minorSlug, majorSlug);
        const parsedFallback = parseKey(fallbackKey);
        if (parsedFallback) {
          try {
            return generate(parsedFallback[0], parsedFallback[1], parsedFallback[2], "en");
          } catch {
            // fall through
          }
        }
      }
    }
    return undefined;
  }

  // lang === "es" — use cached dict
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
  natalPlanet: string,
  lang: "es" | "en" = "es"
): TransitInterpretation | undefined {
  const resolvedAspect = resolveAspect(aspect);
  if (lang === "en") {
    try {
      return generate(transitPlanet, resolvedAspect, natalPlanet, "en");
    } catch {
      return undefined;
    }
  }
  const key = buildKey(transitPlanet, resolvedAspect, natalPlanet);
  return INTERPRETATIONS[key];
}
