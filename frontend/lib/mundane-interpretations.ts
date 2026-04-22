/**
 * Mundane astrology interpretations.
 *
 * Sources:
 *   - Campion, N. (1984/1995). Mundane Astrology / World Horoscopes.
 *   - Baigent, Campion & Harvey (1984). Mundane Astrology.
 *   - Tarnas, R. (2006). Cosmos and Psyche.
 *   - Barbault, A. (2011). Planetary Cycles.
 *   - Ebertin, R. (1940). Combination of Stellar Influences.
 */

export interface MundaneInterpretation {
  key: string;
  transit_planet: string;
  natal_planet: string;
  aspect: string;
  title: string;
  summary: string;
  domains: string[];         // geopolitical domains affected
  historical_examples?: string;
}

const interps: MundaneInterpretation[] = [
  // ── PLUTÓN ──────────────────────────────────────────────────────────────────
  {
    key: "pluton_conjuncion_sol",
    transit_planet: "Plutón", natal_planet: "Sol", aspect: "Conjunción",
    title: "Plutón conjunción Sol natal",
    summary: "Período de profunda transformación del liderazgo nacional y la identidad colectiva. Crisis de poder, renovación radical de las instituciones centrales. Tarnas lo describe como 'el principio de muerte y regeneración aplicado al propósito vital de la nación'.",
    domains: ["liderazgo", "gobierno central", "identidad nacional"],
    historical_examples: "Asociado históricamente con cambios de régimen y renovaciones constitucionales profundas.",
  },
  {
    key: "pluton_cuadratura_sol",
    transit_planet: "Plutón", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Plutón cuadratura Sol natal",
    summary: "Tensión entre el poder establecido y fuerzas de cambio. Conflictos de autoridad, luchas por el control del Estado. Campion advierte sobre presiones externas que fuerzan reestructuraciones.",
    domains: ["liderazgo", "instituciones del Estado", "geopolítica"],
  },
  {
    key: "pluton_oposicion_sol",
    transit_planet: "Plutón", natal_planet: "Sol", aspect: "Oposición",
    title: "Plutón oposición Sol natal",
    summary: "Polarización entre la identidad nacional y fuerzas transformadoras externas. Desafíos a la soberanía, crisis de legitimidad del gobierno.",
    domains: ["soberanía", "política exterior", "liderazgo"],
  },
  {
    key: "pluton_trigono_sol",
    transit_planet: "Plutón", natal_planet: "Sol", aspect: "Trígono",
    title: "Plutón trígono Sol natal",
    summary: "Transformación profunda pero fluida. La nación gana poder e influencia de manera estructural. Reformas que fortalecen la identidad colectiva. Barbault lo asocia con períodos de ascenso geopolítico.",
    domains: ["poder nacional", "reformas estructurales", "geopolítica"],
  },
  {
    key: "pluton_conjuncion_luna",
    transit_planet: "Plutón", natal_planet: "Luna", aspect: "Conjunción",
    title: "Plutón conjunción Luna natal",
    summary: "Transformación de la psique colectiva y el tejido social. Movimientos populares de gran intensidad, cambios demográficos y culturales profundos. Ebertin: 'desintegración y reconstrucción de la vida emocional colectiva'.",
    domains: ["sociedad civil", "cultura popular", "movimientos sociales"],
  },
  {
    key: "pluton_cuadratura_luna",
    transit_planet: "Plutón", natal_planet: "Luna", aspect: "Cuadratura",
    title: "Plutón cuadratura Luna natal",
    summary: "Tensión social intensa, descontento popular. Crisis en sectores vulnerables de la población. Posible agitación social y protesta masiva.",
    domains: ["sociedad", "bienestar social", "crisis humanitaria"],
  },
  // ── NEPTUNO ─────────────────────────────────────────────────────────────────
  {
    key: "neptuno_conjuncion_sol",
    transit_planet: "Neptuno", natal_planet: "Sol", aspect: "Conjunción",
    title: "Neptuno conjunción Sol natal",
    summary: "Período de confusión en el liderazgo, idealismos colectivos y posibles ilusiones nacionales. También abre creatividad cultural y movimientos espirituales. Campion lo asocia con líderes carismáticos y movimientos ideológicos.",
    domains: ["liderazgo", "ideología nacional", "cultura"],
  },
  {
    key: "neptuno_cuadratura_sol",
    transit_planet: "Neptuno", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Neptuno cuadratura Sol natal",
    summary: "Desorientación en la dirección nacional. Escándalos, engaños o ilusiones en las estructuras de poder. Posible devaluación simbólica o debilitamiento de la autoridad central.",
    domains: ["gobierno", "credibilidad institucional"],
  },
  {
    key: "neptuno_trigono_luna",
    transit_planet: "Neptuno", natal_planet: "Luna", aspect: "Trígono",
    title: "Neptuno trígono Luna natal",
    summary: "Florecimiento artístico y espiritual en la cultura popular. Empatía social elevada, movimientos humanitarios. La nación muestra su dimensión más compasiva.",
    domains: ["cultura", "arte", "movimientos sociales"],
  },
  // ── URANO ───────────────────────────────────────────────────────────────────
  {
    key: "urano_conjuncion_sol",
    transit_planet: "Urano", natal_planet: "Sol", aspect: "Conjunción",
    title: "Urano conjunción Sol natal",
    summary: "Año de rupturas revolucionarias en el liderazgo e identidad nacional. Cambios repentinos e imprevistos en la estructura del poder. Tarnas: 'la irrupción de lo nuevo, lo libre y lo impredecible'.",
    domains: ["liderazgo", "innovación", "cambio político"],
    historical_examples: "Frecuentemente coincide con elecciones históricas o revoluciones institucionales.",
  },
  {
    key: "urano_oposicion_sol",
    transit_planet: "Urano", natal_planet: "Sol", aspect: "Oposición",
    title: "Urano oposición Sol natal",
    summary: "Polarización entre tradición e innovación. Fuerzas disruptivas desafían la identidad establecida. Posibles levantamientos o movimientos independentistas.",
    domains: ["identidad nacional", "fragmentación política"],
  },
  {
    key: "urano_cuadratura_sol",
    transit_planet: "Urano", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Urano cuadratura Sol natal",
    summary: "Crisis de identidad y liderazgo. Cambios bruscos en la dirección del país, tensión entre el orden establecido y presiones reformistas.",
    domains: ["crisis política", "reforma institucional"],
  },
  {
    key: "urano_trigono_sol",
    transit_planet: "Urano", natal_planet: "Sol", aspect: "Trígono",
    title: "Urano trígono Sol natal",
    summary: "Renovación fluida y progresiva. Innovaciones tecnológicas o sociales que fortalecen la identidad nacional sin trauma.",
    domains: ["innovación", "modernización", "tecnología"],
  },
  // ── SATURNO ─────────────────────────────────────────────────────────────────
  {
    key: "saturno_conjuncion_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Conjunción",
    title: "Saturno conjunción Sol natal",
    summary: "Período de prueba, consolidación y responsabilidad. Las instituciones del Estado se someten a revisión rigurosa. Campion lo asocia con líderes que enfrentan grandes cargas históricas.",
    domains: ["gobierno", "instituciones", "economía"],
  },
  {
    key: "saturno_oposicion_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Oposición",
    title: "Saturno oposición Sol natal",
    summary: "Punto culminante de un ciclo de 29 años. Presiones externas y restricciones sobre el liderazgo. Posibles crisis económicas o diplomáticas.",
    domains: ["economía", "relaciones exteriores", "liderazgo"],
  },
  {
    key: "saturno_cuadratura_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Saturno cuadratura Sol natal",
    summary: "Obstáculos estructurales que frenan el desarrollo nacional. Período de austeridad, restricciones o crisis de gobernanza.",
    domains: ["economía", "gobernanza"],
  },
  {
    key: "saturno_trigono_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Trígono",
    title: "Saturno trígono Sol natal",
    summary: "Consolidación estable de logros. Reforma gradual y ordenada de las estructuras estatales. Período de credibilidad y seriedad institucional.",
    domains: ["estabilidad", "reformas", "economía"],
  },
  // ── JÚPITER ─────────────────────────────────────────────────────────────────
  {
    key: "jupitir_conjuncion_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Conjunción",
    title: "Júpiter conjunción Sol natal",
    summary: "Año de expansión y optimismo nacional. Crecimiento económico, influencia internacional creciente. Momento favorable para grandes acuerdos o tratados.",
    domains: ["economía", "diplomacia", "expansión"],
  },
  {
    key: "jupitir_oposicion_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Oposición",
    title: "Júpiter oposición Sol natal",
    summary: "Sobreexpansión y exceso. Oportunidades que pueden llevar a compromisos excesivos. Cuidado con el optimismo exagerado en política exterior.",
    domains: ["política exterior", "economía"],
  },
  {
    key: "jupitir_trigono_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Trígono",
    title: "Júpiter trígono Sol natal",
    summary: "Período de prosperidad y expansión fluida. Crecimiento económico sostenido, reputación internacional positiva.",
    domains: ["economía", "bienestar social", "diplomacia"],
  },
];

/** Lookup by key, returns undefined if not found */
export function getMundaneInterpretation(
  transitPlanet: string,
  aspect: string,
  natalPlanet: string,
): MundaneInterpretation | undefined {
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "_");

  const key = `${normalize(transitPlanet)}_${normalize(aspect)}_${normalize(natalPlanet)}`;
  return interps.find((i) => i.key === key);
}

/** Lookup by transit planet — returns all entries for that planet */
export function getMundaneByPlanet(transitPlanet: string): MundaneInterpretation[] {
  return interps.filter((i) => i.transit_planet === transitPlanet);
}

export default interps;
