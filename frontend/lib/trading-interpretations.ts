/**
 * Interpretaciones de tránsitos para AstroTrading.
 *
 * Tradición astro-financiera: Bill Meridian "Planetary Stock Trading",
 * Raymond Merriman "The Ultimate Book on Stock Market Timing",
 * W.D. Gann (market cycle studies), Grace Morris.
 *
 * ⚠️ Solo entretenimiento. No constituye asesoría financiera.
 */

export interface TradingInterpretation {
  key: string;
  transit_planet: string;
  natal_planet: string;
  aspect: string;
  title: string;
  signal: "LONG" | "SHORT" | "NEUTRAL";
  market_meaning: string;
  summary: string;
}

const interps: TradingInterpretation[] = [
  // ── JÚPITER ──────────────────────────────────────────────────────────────────
  {
    key: "jupiter_conjuncion_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Conjunción",
    title: "Júpiter conjunción Sol natal",
    signal: "LONG",
    market_meaning: "Expansión de la tendencia principal",
    summary: "Período de optimismo, expansión y confianza en el activo. Meridian asocia este tránsito con fases alcistas sostenidas y mayor participación institucional. El mercado tiende a sobrepasar niveles de resistencia previos.",
  },
  {
    key: "jupiter_trigono_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Trígono",
    title: "Júpiter trígono Sol natal",
    signal: "LONG",
    market_meaning: "Tendencia alcista fluida",
    summary: "El flujo alcista avanza sin fricciones mayores. Merriman lo describe como un período de 'expansión armoniosa' donde las correcciones son compras y el momentum es sostenido.",
  },
  {
    key: "jupiter_sextil_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Sextil",
    title: "Júpiter sextil Sol natal",
    signal: "LONG",
    market_meaning: "Oportunidades alcistas moderadas",
    summary: "Apertura de oportunidades de crecimiento moderado. Buen entorno para acumular en correcciones; el momentum alcista está presente aunque menos potente que en tríngono o conjunción.",
  },
  {
    key: "jupiter_cuadratura_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Júpiter cuadratura Sol natal",
    signal: "NEUTRAL",
    market_meaning: "Exceso y sobreextensión",
    summary: "El optimismo puede llevar a excesos y valuaciones estiradas. Gann advertía sobre los ciclos de 'expansión excesiva' como señal de techo próximo. Cuidado con compras en euforia.",
  },
  {
    key: "jupiter_oposicion_sol",
    transit_planet: "Júpiter", natal_planet: "Sol", aspect: "Oposición",
    title: "Júpiter oposición Sol natal",
    signal: "NEUTRAL",
    market_meaning: "Punto de inflexión cíclica",
    summary: "Punto de madurez del ciclo expansivo. Meridian lo asocia con máximos de mediano plazo seguidos de consolidación. El mercado puede registrar un techo temporal antes de retestear.",
  },
  {
    key: "jupiter_conjuncion_saturn",
    transit_planet: "Júpiter", natal_planet: "Saturno", aspect: "Conjunción",
    title: "Júpiter conjunción Saturno natal",
    signal: "LONG",
    market_meaning: "Consolidación con base sólida",
    summary: "El crecimiento (Júpiter) encuentra estructura (Saturno). Período favorable para activos con fundamentos sólidos; el mercado puede experimentar expansión disciplinada y sostenible.",
  },
  {
    key: "jupiter_conjuncion_venus",
    transit_planet: "Júpiter", natal_planet: "Venus", aspect: "Conjunción",
    title: "Júpiter conjunción Venus natal",
    signal: "LONG",
    market_meaning: "Valuación expandida, flujo de dinero fuerte",
    summary: "Doble benéfico — expansión de valor y flujo de capitales. Morris asocia este tránsito con entradas masivas al activo, expansión de múltiplos y sentimiento muy favorable.",
  },
  {
    key: "jupiter_trigono_jupiter",
    transit_planet: "Júpiter", natal_planet: "Júpiter", aspect: "Trígono",
    title: "Júpiter trígono Júpiter natal",
    signal: "LONG",
    market_meaning: "Ciclo de crecimiento macroeconómico favorable",
    summary: "Alineación del ciclo de 12 años de Júpiter. Merriman lo marca como uno de los tránsitos más confiables para tendencias alcistas de mediano plazo en índices bursátiles.",
  },

  // ── SATURNO ───────────────────────────────────────────────────────────────────
  {
    key: "saturno_conjuncion_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Conjunción",
    title: "Saturno conjunción Sol natal",
    signal: "SHORT",
    market_meaning: "Restricción, contracción y presión bajista",
    summary: "Período de prueba y contracción. Meridian lo clasifica como uno de los tránsitos más bajistas para un activo: caída de confianza, recorte de posiciones, posibles noticias negativas sobre fundamentals.",
  },
  {
    key: "saturno_oposicion_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Oposición",
    title: "Saturno oposición Sol natal",
    signal: "SHORT",
    market_meaning: "Máxima presión bajista del ciclo saturnino",
    summary: "El ciclo más difícil para el activo. Gann describía estas oposiciones como períodos de 'máxima resistencia externa'. Altas probabilidades de corrección significativa o fase bajista prolongada.",
  },
  {
    key: "saturno_cuadratura_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Saturno cuadratura Sol natal",
    signal: "SHORT",
    market_meaning: "Corrección estructural",
    summary: "Presión correctiva de mediano plazo. El mercado enfrenta obstáculos de liquidez, regulatorios o macroeconómicos. Merriman lo usa como señal de alerta para reducir exposición.",
  },
  {
    key: "saturno_trigono_sol",
    transit_planet: "Saturno", natal_planet: "Sol", aspect: "Trígono",
    title: "Saturno trígono Sol natal",
    signal: "LONG",
    market_meaning: "Consolidación sana, base de soporte",
    summary: "La disciplina de Saturno en armonía con la tendencia central. El mercado construye bases sólidas; los precios se consolidan en niveles de soporte antes de retomar la tendencia.",
  },
  {
    key: "saturno_conjuncion_jupiter",
    transit_planet: "Saturno", natal_planet: "Júpiter", aspect: "Conjunción",
    title: "Saturno conjunción Júpiter natal",
    signal: "SHORT",
    market_meaning: "Freno al crecimiento previo",
    summary: "La contracción de Saturno sobre el principio de crecimiento del activo. Meridian lo asocia con techos de ciclo expansivo y períodos de deflación del optimismo previo.",
  },

  // ── PLUTÓN ────────────────────────────────────────────────────────────────────
  {
    key: "pluton_conjuncion_sol",
    transit_planet: "Plutón", natal_planet: "Sol", aspect: "Conjunción",
    title: "Plutón conjunción Sol natal",
    signal: "NEUTRAL",
    market_meaning: "Transformación radical — alta incertidumbre",
    summary: "Plutón sobre el Sol natal marca un ciclo generacional de restructuración total. El activo puede experimentar caídas severas seguidas de renacimiento o cambio de tendencia principal. Merriman: 'el mercado ya no será el mismo después de este tránsito'.",
  },
  {
    key: "pluton_cuadratura_sol",
    transit_planet: "Plutón", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Plutón cuadratura Sol natal",
    signal: "SHORT",
    market_meaning: "Crisis estructural profunda",
    summary: "Fuerza de transformación bajo tensión. Asociado en la historia de los mercados con crashes, restructuraciones y cambios de régimen. Gann relacionaba estos ciclos con las grandes crisis del siglo.",
  },
  {
    key: "pluton_trigono_sol",
    transit_planet: "Plutón", natal_planet: "Sol", aspect: "Trígono",
    title: "Plutón trígono Sol natal",
    signal: "LONG",
    market_meaning: "Transformación estructural positiva",
    summary: "El poder transformador de Plutón fluye de manera constructiva. Período de consolidación de poder del activo, cambios estructurales que fortalecen la posición a largo plazo.",
  },

  // ── MARTE ─────────────────────────────────────────────────────────────────────
  {
    key: "marte_conjuncion_sol",
    transit_planet: "Marte", natal_planet: "Sol", aspect: "Conjunción",
    title: "Marte conjunción Sol natal",
    signal: "NEUTRAL",
    market_meaning: "Alta energía y volatilidad intradía",
    summary: "Marte trae actividad y volumen intenso. Puede iniciar un movimiento fuerte en cualquier dirección — no proporciona sesgo claro pero sí indica alta volatilidad. Ideal para estrategias de breakout.",
  },
  {
    key: "marte_cuadratura_sol",
    transit_planet: "Marte", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Marte cuadratura Sol natal",
    signal: "SHORT",
    market_meaning: "Ventas agresivas, presión bajista de corto plazo",
    summary: "Período de ventas aceleradas y pánico de corto plazo. Morris lo asocia con noticias negativas que detonan liquidaciones masivas. El momentum bajista puede ser intenso pero breve.",
  },
  {
    key: "marte_trigono_sol",
    transit_planet: "Marte", natal_planet: "Sol", aspect: "Trígono",
    title: "Marte trígono Sol natal",
    signal: "LONG",
    market_meaning: "Momentum alcista de corto plazo",
    summary: "Energía y volumen que empujan el precio al alza. Período de compras agresivas y momentum positivo. Suele marcar arranques de tendencia o breakouts de resistencias.",
  },

  // ── URANO ─────────────────────────────────────────────────────────────────────
  {
    key: "urano_conjuncion_sol",
    transit_planet: "Urano", natal_planet: "Sol", aspect: "Conjunción",
    title: "Urano conjunción Sol natal",
    signal: "NEUTRAL",
    market_meaning: "Ruptura inesperada — máxima volatilidad",
    summary: "Urano sobre el Sol natal marca eventos disruptivos e inesperados. El activo puede experimentar movimientos bruscos en cualquier dirección. Merriman lo describe como el indicador #1 de sorpresas de mercado.",
  },
  {
    key: "urano_cuadratura_sol",
    transit_planet: "Urano", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Urano cuadratura Sol natal",
    signal: "NEUTRAL",
    market_meaning: "Inestabilidad y disrupciones estructurales",
    summary: "Volatilidad extrema con posibilidad de flash crashes o rallies violentos. Período de alta incertidumbre regulatoria o tecnológica que afecta al activo.",
  },

  // ── NEPTUNO ───────────────────────────────────────────────────────────────────
  {
    key: "neptuno_conjuncion_sol",
    transit_planet: "Neptuno", natal_planet: "Sol", aspect: "Conjunción",
    title: "Neptuno conjunción Sol natal",
    signal: "NEUTRAL",
    market_meaning: "Confusión, burbujas especulativas",
    summary: "Período de narrativas engañosas y burbujas especulativas. Meridian advierte sobre mercados 'desconectados de fundamentals'. Difícil evaluar el valor real; alto riesgo de trampa alcista o bajista.",
  },
  {
    key: "neptuno_cuadratura_sol",
    transit_planet: "Neptuno", natal_planet: "Sol", aspect: "Cuadratura",
    title: "Neptuno cuadratura Sol natal",
    signal: "SHORT",
    market_meaning: "Disolución de valor, pérdida de confianza",
    summary: "Erosión gradual de la confianza y los fundamentals. Gann relacionaba Neptuno tenso con fraudes, escándalos o pérdida de liquidez que deprimen el activo silenciosamente.",
  },
];

export function getTradingInterpretation(
  transitPlanet: string,
  aspect: string,
  natalPlanet: string,
): TradingInterpretation | undefined {
  return interps.find(
    (i) =>
      i.transit_planet === transitPlanet &&
      i.aspect === aspect &&
      i.natal_planet === natalPlanet,
  );
}
