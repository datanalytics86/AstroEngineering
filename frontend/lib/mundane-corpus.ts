/**
 * Corpus interpretativo bilingüe (ES/EN) para el módulo de astrología mundial.
 *
 * IMPORTANTE — INTEGRIDAD:
 * Esto es analogía cíclica interpretativa, NO predicción factual. La atribución
 * bibliográfica (Cassanya, Barbault, Tarnas) es temática/metodológica: NO contiene
 * citas textuales ni números de página. Sigue el patrón de interpretation-engine.ts:
 * datos keyed + getters con `lang`.
 *
 * Las claves de `EVENT_NARRATIVES` coinciden con los `id` de HISTORICAL_EVENTS en
 * backend/astro/mundane.py. `getConfigNarrative` usa la firma astrológica y cae en
 * un generador compositivo cuando no hay texto curado.
 */

export type Lang = "es" | "en";

interface Bilingual {
  es: string;
  en: string;
}

interface EventEntry {
  title: Bilingual;
  description: Bilingual;
  source: Bilingual;
}

interface ConfigEntry {
  title: Bilingual;
  theme: Bilingual;
  synthesis: Bilingual;
  source: Bilingual;
}

// ── Etiquetas de temas (slugs → bilingüe) ──────────────────────────────────────
export const THEME_LABELS: Record<string, Bilingual> = {
  fin_de_ciclo: { es: "Fin de ciclo", en: "End of a cycle" },
  cambio_de_era: { es: "Cambio de era", en: "Change of era" },
  colapso_de_estructuras: { es: "Colapso de estructuras", en: "Collapse of structures" },
  disolucion_de_estructuras: { es: "Disolución de estructuras", en: "Dissolution of structures" },
  disolucion_de_fronteras: { es: "Disolución de fronteras", en: "Dissolution of borders" },
  fin_de_ciclo_ideologico: { es: "Fin de ciclo ideológico", en: "End of an ideological cycle" },
  utopias_colectivas: { es: "Utopías colectivas", en: "Collective utopias" },
  revolucion_ideologica: { es: "Revolución ideológica", en: "Ideological revolution" },
  reunificacion: { es: "Reunificación", en: "Reunification" },
  nacimiento_de_naciones: { es: "Nacimiento de naciones", en: "Birth of nations" },
  ideales_de_libertad: { es: "Ideales de libertad", en: "Ideals of freedom" },
  ruptura_con_el_pasado: { es: "Ruptura con el pasado", en: "Break with the past" },
  poder_colectivo: { es: "Poder colectivo", en: "Collective power" },
  conflicto_global: { es: "Conflicto global", en: "Global conflict" },
  innovacion_tecnologica: { es: "Innovación tecnológica", en: "Technological innovation" },
  ruptura_de_alianzas: { es: "Ruptura de alianzas", en: "Breaking of alliances" },
  disrupcion_irreversible: { es: "Disrupción irreversible", en: "Irreversible disruption" },
  nueva_era: { es: "Nueva era", en: "New era" },
  fractura_nacional: { es: "Fractura nacional", en: "National fracture" },
  idealismo_en_conflicto: { es: "Idealismo en conflicto", en: "Idealism in conflict" },
  redefinicion_de_identidad: { es: "Redefinición de identidad", en: "Redefinition of identity" },
  nacionalismo_emergente: { es: "Nacionalismo emergente", en: "Emerging nationalism" },
  reestructuracion_social: { es: "Reestructuración social", en: "Social restructuring" },
  nuevo_ciclo_de_20_anos: { es: "Nuevo ciclo de 20 años", en: "New 20-year cycle" },
  crisis_economica: { es: "Crisis económica", en: "Economic crisis" },
  ruptura_brusca: { es: "Ruptura brusca", en: "Abrupt rupture" },
  crisis_de_poder: { es: "Crisis de poder", en: "Crisis of power" },
  tension_extrema: { es: "Tensión extrema", en: "Extreme tension" },
  umbral_de_colapso: { es: "Umbral de colapso", en: "Threshold of collapse" },
  exceso_y_correccion: { es: "Exceso y corrección", en: "Excess and correction" },
  guerra_fria: { es: "Guerra fría", en: "Cold war" },
  terrorismo: { es: "Terrorismo", en: "Terrorism" },
  resistencia_civil: { es: "Resistencia civil", en: "Civil resistance" },
  integracion_regional: { es: "Integración regional", en: "Regional integration" },
  liberacion_de_la_informacion: { es: "Liberación de la información", en: "Liberation of information" },
  ocupacion_militar: { es: "Ocupación militar", en: "Military occupation" },
  expansion_territorial: { es: "Expansión territorial", en: "Territorial expansion" },
  caida_de_regimen: { es: "Caída de régimen", en: "Fall of a regime" },
  avance_cientifico: { es: "Avance científico", en: "Scientific breakthrough" },
  pandemia: { es: "Pandemia", en: "Pandemic" },
  fin_de_conflicto: { es: "Fin de conflicto", en: "End of a conflict" },
  accidente_industrial: { es: "Accidente industrial", en: "Industrial accident" },
  carrera_espacial: { es: "Carrera espacial", en: "Space race" },
};

export function getThemeLabel(slug: string, lang: Lang): string {
  return THEME_LABELS[slug]?.[lang] ?? slug.replace(/_/g, " ");
}

// ── Fuentes bibliográficas ─────────────────────────────────────────────────────
const SRC_CASSANYA: Bilingual = {
  es: "Tradición mundialista — V. Cassanya, «Crónica Astrológica del Siglo XX»",
  en: "Mundane tradition — V. Cassanya, \"Crónica Astrológica del Siglo XX\"",
};
const SRC_BARBAULT: Bilingual = {
  es: "Ciclos planetarios — André Barbault (índice cíclico)",
  en: "Planetary cycles — André Barbault (cyclic index)",
};
const SRC_TARNAS: Bilingual = {
  es: "Correlaciones históricas — Richard Tarnas, «Cosmos and Psyche»",
  en: "Historical correlations — Richard Tarnas, \"Cosmos and Psyche\"",
};
const SRC_BAIGENT: Bilingual = {
  es: "Método mundialista de referencia — Baigent, Campion & Harvey, «Mundane Astrology»",
  en: "Reference mundane method — Baigent, Campion & Harvey, \"Mundane Astrology\"",
};
const SRC_CAMPION: Bilingual = {
  es: "Horóscopos históricos de naciones — Nicholas Campion, «The Book of World Horoscopes»",
  en: "Historical horoscopes of nations — Nicholas Campion, \"The Book of World Horoscopes\"",
};

export const BIBLIOGRAPHY: Bilingual[] = [
  SRC_CASSANYA, SRC_BARBAULT, SRC_TARNAS, SRC_BAIGENT, SRC_CAMPION,
];

// ── Narrativa de eventos históricos (keyed por id de backend) ──────────────────
const EVENT_NARRATIVES: Record<string, EventEntry> = {
  constantinopla_1453: {
    title: { es: "Caída de Constantinopla", en: "Fall of Constantinople" },
    description: {
      es: "El fin del Imperio Bizantino y el cierre simbólico de la Edad Media. Un umbral entre eras bajo la contracción saturnina y la ruptura uraniana.",
      en: "The end of the Byzantine Empire and the symbolic close of the Middle Ages. A threshold between eras under Saturnine contraction and Uranian rupture.",
    },
    source: SRC_TARNAS,
  },
  revolucion_rusa_1917: {
    title: { es: "Revolución Rusa", en: "Russian Revolution" },
    description: {
      es: "El derrumbe del orden zarista y el ascenso de una utopía colectiva. La conjunción Saturno-Neptuno disuelve estructuras y funde ideología con Estado.",
      en: "The collapse of the tsarist order and the rise of a collective utopia. The Saturn-Neptune conjunction dissolves structures and fuses ideology with the State.",
    },
    source: SRC_CASSANYA,
  },
  muro_berlin_1989: {
    title: { es: "Caída del Muro de Berlín", en: "Fall of the Berlin Wall" },
    description: {
      es: "La disolución de una frontera y del bloque soviético. Saturno-Neptuno vuelve a marcar el fin de un ciclo ideológico y la reunificación.",
      en: "The dissolution of a border and of the Soviet bloc. Saturn-Neptune again marks the end of an ideological cycle and reunification.",
    },
    source: SRC_CASSANYA,
  },
  constitucion_eeuu_1787: {
    title: { es: "Constitución de EE.UU.", en: "U.S. Constitution" },
    description: {
      es: "La firma del texto fundacional que redefine cómo se reparte el poder en la nueva nación. Plutón en Acuario: los principios colectivos se convierten en estructura de gobierno.",
      en: "The signing of the founding text that redefines how power is distributed in the new nation. Pluto in Aquarius: collective principles become structures of government.",
    },
    source: SRC_CAMPION,
  },
  revolucion_francesa_1789: {
    title: { es: "Revolución Francesa", en: "French Revolution" },
    description: {
      es: "El fin del Antiguo Régimen y la irrupción del poder colectivo. Plutón en Acuario transforma de raíz la relación entre pueblo y autoridad.",
      en: "The end of the Ancien Régime and the eruption of collective power. Pluto in Aquarius radically transforms the relation between people and authority.",
    },
    source: SRC_TARNAS,
  },
  batalla_midway_1942: {
    title: { es: "Batalla de Midway", en: "Battle of Midway" },
    description: {
      es: "El punto de inflexión del frente del Pacífico en plena Segunda Guerra Mundial. Urano recién ingresado en Géminis dispara la guerra de la información y las comunicaciones, mientras Saturno y Urano se conjuntan reforzando la tensión de un mundo en conflicto.",
      en: "The turning point of the Pacific front in the midst of World War II. Uranus, freshly in Gemini, ignites the war of information and communications, while Saturn and Uranus conjoin, reinforcing the tension of a world in conflict.",
    },
    source: SRC_CASSANYA,
  },
  bomba_atomica_1945: {
    title: { es: "Era atómica", en: "Atomic age" },
    description: {
      es: "Una disrupción tecnológica irreversible que redefine el poder mundial. Urano en Géminis: el intelecto humano cruza un umbral sin retorno.",
      en: "An irreversible technological disruption that redefines world power. Uranus in Gemini: the human intellect crosses a point of no return.",
    },
    source: SRC_CASSANYA,
  },
  guerra_civil_eeuu_1861: {
    title: { es: "Guerra Civil de EE.UU.", en: "U.S. Civil War" },
    description: {
      es: "Una fractura nacional y una identidad en disputa. Neptuno en Aries enciende ideales enfrentados y una redefinición del país.",
      en: "A national fracture and an identity in dispute. Neptune in Aries ignites clashing ideals and a redefinition of the country.",
    },
    source: SRC_TARNAS,
  },
  unificacion_alemania_1871: {
    title: { es: "Unificación de Alemania", en: "Unification of Germany" },
    description: {
      es: "El nacionalismo emergente cristaliza un nuevo Estado. Neptuno en Aries funde un ideal colectivo con la voluntad de forjar una nación.",
      en: "Emerging nationalism crystallizes a new State. Neptune in Aries fuses a collective ideal with the will to forge a nation.",
    },
    source: SRC_TARNAS,
  },
  gran_conjuncion_2020: {
    title: { es: "Gran Conjunción de 2020", en: "Great Conjunction of 2020" },
    description: {
      es: "El inicio de un ciclo Júpiter-Saturno de ~20 años en signo de aire: una reestructuración social hacia lo tecnológico y lo colectivo.",
      en: "The start of a ~20-year Jupiter-Saturn cycle in an air sign: a social restructuring toward the technological and the collective.",
    },
    source: SRC_BARBAULT,
  },
  crisis_1929: {
    title: { es: "Crac de 1929", en: "Crash of 1929" },
    description: {
      es: "El colapso económico global. El trígono Saturno-Neptuno, de fondo esa semana, no evitó que estructuras que parecían sólidas se derrumbaran bajo su propio exceso.",
      en: "The global economic collapse. The background Saturn-Neptune trine that week did not stop structures that seemed solid from crumbling under their own excess.",
    },
    source: SRC_CASSANYA,
  },
  crisis_misiles_cuba_1962: {
    title: { es: "Crisis de los misiles de Cuba", en: "Cuban Missile Crisis" },
    description: {
      es: "El mundo al borde del colapso nuclear. La conjunción Urano-Plutón lleva la ruptura y el poder profundo a su umbral máximo de tensión.",
      en: "The world on the brink of nuclear collapse. The Uranus-Pluto conjunction brings rupture and deep power to their maximum threshold of tension.",
    },
    source: SRC_BARBAULT,
  },
  caida_urss_1991: {
    title: { es: "Disolución de la URSS", en: "Dissolution of the USSR" },
    description: {
      es: "El fin de un ciclo ideológico y de un imperio. Urano ingresa en Capricornio y reestructura el orden geopolítico.",
      en: "The end of an ideological cycle and of an empire. Uranus enters Capricorn and restructures the geopolitical order.",
    },
    source: SRC_CASSANYA,
  },
  crisis_financiera_2008: {
    title: { es: "Crisis financiera de 2008 (Lehman Brothers)", en: "2008 Financial Crisis (Lehman Brothers)" },
    description: {
      es: "El colapso de Lehman Brothers dispara el pánico financiero global. La oposición Saturno-Urano enfrenta la estructura contra la ruptura: el sistema no soporta el desequilibrio.",
      en: "The collapse of Lehman Brothers triggers global financial panic. The Saturn-Uranus opposition pits structure against rupture: the system cannot bear the imbalance.",
    },
    source: SRC_BARBAULT,
  },
  gran_recesion_2007: {
    title: { es: "Inicio de la Gran Recesión", en: "Onset of the Great Recession" },
    description: {
      es: "El comité que data oficialmente los ciclos económicos de EE.UU. situó aquí el inicio de la recesión que estallaría un año después. La conjunción Júpiter-Plutón funde expansión crediticia con poder financiero concentrado, justo antes de la corrección.",
      en: "The committee that officially dates U.S. business cycles placed here the start of the recession that would erupt a year later. The Jupiter-Pluto conjunction fuses credit expansion with concentrated financial power, right before the correction.",
    },
    source: SRC_BARBAULT,
  },
  primavera_arabe_2011: {
    title: { es: "Primavera Árabe", en: "Arab Spring" },
    description: {
      es: "Una ola de revueltas populares que arranca a fines de 2010. La cuadratura Urano-Plutón, ya aplicativa, detona la ruptura con el pasado y el poder colectivo.",
      en: "A wave of popular uprisings that begins in late 2010. The applying Uranus-Pluto square detonates the break with the past and collective power.",
    },
    source: SRC_TARNAS,
  },
  pandemia_2020: {
    title: { es: "Pandemia de 2020", en: "2020 Pandemic" },
    description: {
      es: "Una crisis sistémica global. La conjunción Saturno-Plutón marca el fin de un ciclo y una reestructuración forzada.",
      en: "A systemic global crisis. The Saturn-Pluto conjunction marks the end of a cycle and a forced restructuring.",
    },
    source: SRC_BARBAULT,
  },
  imprenta_gutenberg_1454: {
    title: { es: "Difusión de la imprenta de Gutenberg", en: "Spread of the Gutenberg press" },
    description: {
      es: "La misma cuadratura Saturno-Urano de la caída de Constantinopla acompaña la consolidación de la imprenta de tipos móviles: una estructura de siglos (la copia manuscrita) se rompe frente a una tecnología disruptiva.",
      en: "The same Saturn-Uranus square as the fall of Constantinople accompanies the consolidation of the movable-type press: a centuries-old structure (the hand-copied manuscript) breaks against a disruptive technology.",
    },
    source: SRC_TARNAS,
  },
  lunes_negro_1987: {
    title: { es: "Lunes Negro (1987)", en: "Black Monday (1987)" },
    description: {
      es: "El mayor desplome bursátil porcentual de un solo día hasta entonces. La conjunción Saturno-Urano concentra estructura y ruptura en el mismo punto del cielo, y los mercados lo sienten de golpe.",
      en: "The largest single-day percentage stock market drop up to that point. The Saturn-Uranus conjunction concentrates structure and rupture at the same point in the sky, and markets feel it all at once.",
    },
    source: SRC_CASSANYA,
  },
  asalto_capitolio_2021: {
    title: { es: "Asalto al Capitolio de EE.UU.", en: "U.S. Capitol riot" },
    description: {
      es: "Una institución centenaria puesta a prueba por la ruptura. La cuadratura Saturno-Urano enfrenta la estructura de gobierno con el impulso de romper sus formas.",
      en: "A centuries-old institution put to the test by rupture. The Saturn-Uranus square pits the structure of government against the impulse to break its forms.",
    },
    source: SRC_CASSANYA,
  },
  gripe_1918: {
    title: { es: "Pandemia de gripe de 1918", en: "1918 flu pandemic" },
    description: {
      es: "Una de las pandemias más letales de la historia moderna, en pleno cierre de la Primera Guerra Mundial. La oposición Saturno-Urano confronta el límite biológico (Saturno) con lo súbito e imprevisible (Urano).",
      en: "One of the deadliest pandemics in modern history, as World War I was closing. The Saturn-Uranus opposition confronts the biological limit (Saturn) with the sudden and unforeseeable (Uranus).",
    },
    source: SRC_CASSANYA,
  },
  muerte_stalin_1953: {
    title: { es: "Muerte de Stalin", en: "Death of Stalin" },
    description: {
      es: "El fin abrupto de una era de poder personalista. La conjunción Saturno-Neptuno diluye una estructura de autoridad que parecía inamovible.",
      en: "The abrupt end of an era of personalist power. The Saturn-Neptune conjunction dissolves a structure of authority that seemed immovable.",
    },
    source: SRC_BARBAULT,
  },
  guerra_civil_espanola_1936: {
    title: { es: "Inicio de la Guerra Civil Española", en: "Start of the Spanish Civil War" },
    description: {
      es: "Una nación se fractura entre dos idealismos irreconciliables. La oposición Saturno-Neptuno confronta la estructura establecida con la disolución de un ideal colectivo.",
      en: "A nation fractures between two irreconcilable idealisms. The Saturn-Neptune opposition confronts the established structure with the dissolution of a collective ideal.",
    },
    source: SRC_TARNAS,
  },
  wwi_1914: {
    title: { es: "Estallido de la Primera Guerra Mundial", en: "Outbreak of World War I" },
    description: {
      es: "El primer gran conflicto industrial a escala continental. La conjunción Saturno-Plutón concentra el poder estatal en su forma más dura: la guerra total.",
      en: "The first great industrial-scale conflict on a continental level. The Saturn-Pluto conjunction concentrates state power in its harshest form: total war.",
    },
    source: SRC_BARBAULT,
  },
  doctrina_truman_1947: {
    title: { es: "Doctrina Truman", en: "Truman Doctrine" },
    description: {
      es: "El compromiso formal de EE.UU. de contener el avance soviético abre la Guerra Fría. La conjunción Saturno-Plutón funde estructura de bloques con poder geopolítico concentrado.",
      en: "The United States' formal commitment to contain Soviet expansion opens the Cold War. The Saturn-Pluto conjunction fuses bloc structures with concentrated geopolitical power.",
    },
    source: SRC_BARBAULT,
  },
  guerra_malvinas_1982: {
    title: { es: "Guerra de las Malvinas", en: "Falklands War" },
    description: {
      es: "Un conflicto territorial que reafirma soberanías en disputa. La conjunción Saturno-Plutón concentra la tensión de poder entre dos naciones.",
      en: "A territorial conflict that reasserts disputed sovereignties. The Saturn-Pluto conjunction concentrates the power tension between two nations.",
    },
    source: SRC_CAMPION,
  },
  atentados_11s_2001: {
    title: { es: "Atentados del 11 de septiembre", en: "September 11 attacks" },
    description: {
      es: "Un golpe asimétrico que redefine la seguridad global. La oposición Saturno-Plutón confronta el poder establecido con una amenaza oculta y letal.",
      en: "An asymmetric strike that redefines global security. The Saturn-Pluto opposition confronts established power with a hidden, lethal threat.",
    },
    source: SRC_BARBAULT,
  },
  reforma_protestante_1517: {
    title: { es: "Reforma protestante", en: "Protestant Reformation" },
    description: {
      es: "Las tesis de Lutero rompen la autoridad religiosa unificada de Europa. La conjunción Saturno-Plutón concentra el poder eclesiástico justo antes de su fractura.",
      en: "Luther's theses break Europe's unified religious authority. The Saturn-Pluto conjunction concentrates ecclesiastical power right before its fracture.",
    },
    source: SRC_TARNAS,
  },
  crisis_petroleo_1973: {
    title: { es: "Crisis del petróleo de 1973", en: "1973 oil crisis" },
    description: {
      es: "Un embargo que reordena la dependencia energética global. La cuadratura Saturno-Plutón tensiona estructura económica y poder concentrado de los productores.",
      en: "An embargo that reorders global energy dependence. The Saturn-Pluto square strains economic structure against the concentrated power of producers.",
    },
    source: SRC_BARBAULT,
  },
  rebelion_taiping_1851: {
    title: { es: "Rebelión Taiping (levantamiento de Jintian)", en: "Taiping Rebellion (Jintian Uprising)" },
    description: {
      es: "Uno de los levantamientos más sangrientos del siglo XIX contra el orden imperial chino. La conjunción Urano-Plutón concentra ruptura y poder profundo en un mismo punto del cielo.",
      en: "One of the bloodiest uprisings of the 19th century against China's imperial order. The Uranus-Pluto conjunction concentrates rupture and deep power at the same point in the sky.",
    },
    source: SRC_TARNAS,
  },
  disturbios_watts_1965: {
    title: { es: "Disturbios de Watts", en: "Watts riots" },
    description: {
      es: "Una revuelta urbana que expone tensiones raciales profundas en plena era de derechos civiles. La conjunción Urano-Plutón concentra la ruptura social y el poder colectivo reprimido.",
      en: "An urban uprising that exposes deep racial tensions amid the civil rights era. The Uranus-Pluto conjunction concentrates social rupture and repressed collective power.",
    },
    source: SRC_TARNAS,
  },
  reino_del_terror_1793: {
    title: { es: "El Terror (Revolución Francesa)", en: "The Terror (French Revolution)" },
    description: {
      es: "La fase más radical y sangrienta de la Revolución Francesa. La oposición Urano-Plutón confronta la ruptura revolucionaria con el poder concentrado que intenta controlarla.",
      en: "The most radical and bloody phase of the French Revolution. The Uranus-Pluto opposition confronts revolutionary rupture with the concentrated power trying to control it.",
    },
    source: SRC_TARNAS,
  },
  independencia_peru_1821: {
    title: { es: "Independencia del Perú", en: "Independence of Peru" },
    description: {
      es: "El nacimiento de una nueva nación sudamericana en plena ola independentista continental. La conjunción Urano-Neptuno funde la ruptura política con el ideal colectivo de libertad.",
      en: "The birth of a new South American nation amid a continental wave of independence. The Uranus-Neptune conjunction fuses political rupture with the collective ideal of freedom.",
    },
    source: SRC_CAMPION,
  },
  independencia_grecia_1821: {
    title: { es: "Inicio de la independencia griega", en: "Start of Greek independence" },
    description: {
      es: "El alzamiento que da origen al Estado griego moderno, casi exactamente en la misma conjunción Urano-Neptuno que la independencia del Perú: dos rupturas nacionales, un mismo eco cíclico.",
      en: "The uprising that gives rise to the modern Greek state, at almost exactly the same Uranus-Neptune conjunction as Peru's independence: two national ruptures, one cyclical echo.",
    },
    source: SRC_CAMPION,
  },
  tratado_maastricht_1993: {
    title: { es: "Tratado de Maastricht (fundación de la UE)", en: "Maastricht Treaty (founding of the EU)" },
    description: {
      es: "La fundación de la Unión Europea sobre las cenizas de la Guerra Fría. La conjunción Urano-Neptuno funde ruptura de fronteras con un ideal colectivo supranacional.",
      en: "The founding of the European Union on the ashes of the Cold War. The Uranus-Neptune conjunction fuses the breaking of borders with a supranational collective ideal.",
    },
    source: SRC_BAIGENT,
  },
  www_dominio_publico_1993: {
    title: { es: "La World Wide Web pasa a dominio público", en: "The World Wide Web enters the public domain" },
    description: {
      es: "El CERN libera la tecnología que reorganizará la comunicación humana. La misma conjunción Urano-Neptuno de Maastricht funde ruptura tecnológica con un ideal de acceso colectivo.",
      en: "CERN releases the technology that will reorganize human communication. The same Uranus-Neptune conjunction as Maastricht fuses technological rupture with an ideal of collective access.",
    },
    source: SRC_TARNAS,
  },
  muro_berlin_construccion_1961: {
    title: { es: "Construcción del Muro de Berlín", en: "Construction of the Berlin Wall" },
    description: {
      es: "Una ciudad partida en dos como símbolo físico de la Guerra Fría. La conjunción Júpiter-Saturno abre un nuevo ciclo social de veinte años bajo el signo de la división.",
      en: "A city split in two as the physical symbol of the Cold War. The Jupiter-Saturn conjunction opens a new twenty-year social cycle under the sign of division.",
    },
    source: SRC_BARBAULT,
  },
  investidura_reagan_1981: {
    title: { es: "Investidura de Reagan", en: "Reagan's inauguration" },
    description: {
      es: "El giro hacia el neoliberalismo y la desregulación en la mayor economía del mundo. La conjunción Júpiter-Saturno en signo de aire inaugura un nuevo ciclo social de veinte años.",
      en: "The turn toward neoliberalism and deregulation in the world's largest economy. The Jupiter-Saturn conjunction in an air sign inaugurates a new twenty-year social cycle.",
    },
    source: SRC_BARBAULT,
  },
  pico_puntocom_2000: {
    title: { es: "Cima del ciclo bursátil de las puntocom", en: "Peak of the dot-com stock cycle" },
    description: {
      es: "El auge y posterior corrección de las empresas de internet marcó el cambio de milenio. La conjunción Júpiter-Saturno en signo de tierra cierra un ciclo de expansión especulativa.",
      en: "The rise and subsequent correction of internet companies marked the turn of the millennium. The Jupiter-Saturn conjunction in an earth sign closes a cycle of speculative expansion.",
    },
    source: SRC_BARBAULT,
  },
  blitz_londres_1940: {
    title: { es: "El Blitz sobre Londres", en: "The Blitz over London" },
    description: {
      es: "El bombardeo sostenido de una capital europea en plena Segunda Guerra Mundial. La conjunción Júpiter-Saturno concentra expansión bélica y estructura de resistencia civil.",
      en: "The sustained bombing of a European capital amid World War II. The Jupiter-Saturn conjunction concentrates wartime expansion and the structure of civil resistance.",
    },
    source: SRC_CASSANYA,
  },
  llegada_colon_1492: {
    title: { es: "Llegada de Colón a América", en: "Columbus's arrival in America" },
    description: {
      es: "El primer contacto europeo sostenido con el continente americano, con consecuencias civilizatorias irreversibles. La oposición Júpiter-Saturno confronta la expansión exploratoria con los límites del mundo conocido.",
      en: "The first sustained European contact with the American continent, with irreversible civilizational consequences. The Jupiter-Saturn opposition confronts exploratory expansion with the limits of the known world.",
    },
    source: SRC_CAMPION,
  },
  llegada_luna_1969: {
    title: { es: "Llegada del hombre a la Luna", en: "Moon landing" },
    description: {
      es: "El hito técnico que simboliza el optimismo tecnológico del siglo XX. La conjunción Júpiter-Urano, exacta ese mismo día, funde expansión de posibilidades con ruptura tecnológica.",
      en: "The technical milestone that symbolizes 20th-century technological optimism. The Jupiter-Uranus conjunction, exact that very day, fuses expanding possibility with technological rupture.",
    },
    source: SRC_TARNAS,
  },
  vuelo_lindbergh_1927: {
    title: { es: "Vuelo transatlántico de Lindbergh", en: "Lindbergh's transatlantic flight" },
    description: {
      es: "El primer cruce del Atlántico en solitario sin escalas, un hito de la aviación temprana. La conjunción Júpiter-Urano funde expansión de posibilidades con innovación disruptiva.",
      en: "The first solo nonstop crossing of the Atlantic, a milestone of early aviation. The Jupiter-Uranus conjunction fuses expanding possibility with disruptive innovation.",
    },
    source: SRC_CASSANYA,
  },
  clonacion_dolly_1997: {
    title: { es: "Anuncio de la clonación de la oveja Dolly", en: "Announcement of Dolly the sheep's cloning" },
    description: {
      es: "El anuncio del primer mamífero clonado a partir de una célula adulta redefine los límites de la biología. La conjunción Júpiter-Urano en signo de aire funde expansión científica con ruptura tecnológica.",
      en: "The announcement of the first mammal cloned from an adult cell redefines the limits of biology. The Jupiter-Uranus conjunction in an air sign fuses scientific expansion with technological rupture.",
    },
    source: SRC_TARNAS,
  },
  crisis_bancaria_europea_1931: {
    title: { es: "Colapso del Creditanstalt", en: "Collapse of the Creditanstalt" },
    description: {
      es: "La caída del mayor banco austríaco propaga el pánico financiero por toda Europa, agravando la Gran Depresión. La conjunción Júpiter-Plutón funde expansión crediticia excesiva con poder financiero concentrado.",
      en: "The fall of Austria's largest bank spreads financial panic across Europe, deepening the Great Depression. The Jupiter-Pluto conjunction fuses excessive credit expansion with concentrated financial power.",
    },
    source: SRC_BARBAULT,
  },
  caida_saigon_1975: {
    title: { es: "Caída de Saigón", en: "Fall of Saigon" },
    description: {
      es: "El fin de la guerra de Vietnam y la reunificación forzada del país. El trígono Júpiter-Neptuno acompaña el cierre de un ideal en conflicto durante casi dos décadas.",
      en: "The end of the Vietnam War and the country's forced reunification. The Jupiter-Neptune trine accompanies the closing of an ideal in conflict for nearly two decades.",
    },
    source: SRC_CAMPION,
  },
  sputnik_1957: {
    title: { es: "Lanzamiento del Sputnik", en: "Launch of Sputnik" },
    description: {
      es: "El primer satélite artificial abre la carrera espacial y redefine el prestigio tecnológico entre bloques. El sextil Neptuno-Plutón facilita la fusión entre ideal colectivo y poder transformador.",
      en: "The first artificial satellite opens the space race and redefines technological prestige between blocs. The Neptune-Pluto sextile facilitates the fusion of collective ideal and transformative power.",
    },
    source: SRC_BARBAULT,
  },
  chernobyl_1986: {
    title: { es: "Desastre de Chernóbil", en: "Chernobyl disaster" },
    description: {
      es: "El mayor accidente nuclear civil de la historia expone los límites de las estructuras soviéticas. El sextil Neptuno-Plutón conecta la disolución de un ideal tecnológico con un poder que se vuelve incontrolable.",
      en: "The worst civil nuclear accident in history exposes the limits of Soviet structures. The Neptune-Pluto sextile connects the dissolution of a technological ideal with a power that turns uncontrollable.",
    },
    source: SRC_CASSANYA,
  },
  lexington_concord_1775: {
    title: { es: "Batallas de Lexington y Concord", en: "Battles of Lexington and Concord" },
    description: {
      es: "Los primeros enfrentamientos armados de la Revolución Americana. Urano recién ingresado en Géminis marca el comienzo de una guerra de comunicados, panfletos y redes de milicias.",
      en: "The first armed clashes of the American Revolution. Uranus, freshly entered into Gemini, marks the start of a war fought through dispatches, pamphlets, and militia networks.",
    },
    source: SRC_CAMPION,
  },
  anschluss_1938: {
    title: { es: "Anschluss (anexión de Austria)", en: "Anschluss (annexation of Austria)" },
    description: {
      es: "La anexión de Austria por la Alemania nazi sin resistencia armada. Saturno recién ingresado en Aries endurece fronteras y reafirma un nacionalismo expansivo.",
      en: "The annexation of Austria by Nazi Germany without armed resistance. Saturn, freshly entered into Aries, hardens borders and reasserts an expansive nationalism.",
    },
    source: SRC_CASSANYA,
  },
  guerra_seis_dias_1967: {
    title: { es: "Guerra de los Seis Días", en: "Six-Day War" },
    description: {
      es: "Un conflicto breve y decisivo que redibuja fronteras en Medio Oriente. Saturno en Aries —el mismo ingreso de signo que el Anschluss, 29 años antes— endurece la afirmación territorial.",
      en: "A brief, decisive conflict that redraws borders in the Middle East. Saturn in Aries —the same sign ingress as the Anschluss, 29 years earlier— hardens territorial assertion.",
    },
    source: SRC_CASSANYA,
  },
  caida_kabul_1996: {
    title: { es: "Toma de Kabul por los talibanes", en: "Taliban capture of Kabul" },
    description: {
      es: "La caída de la capital afgana marca el fin de un régimen y el inicio de otro. Saturno en Aries repite, casi tres décadas después, el patrón de fronteras que se redefinen por la fuerza.",
      en: "The fall of the Afghan capital marks the end of one regime and the start of another. Saturn in Aries repeats, nearly three decades later, the pattern of borders redefined by force.",
    },
    source: SRC_CASSANYA,
  },
};

export function getEventNarrative(id: string, lang: Lang): {
  title: string;
  description: string;
  source: string;
} {
  const e = EVENT_NARRATIVES[id];
  if (!e) {
    return { title: id.replace(/_/g, " "), description: "", source: "" };
  }
  return { title: e.title[lang], description: e.description[lang], source: e.source[lang] };
}

// ── Narrativa de configuraciones (curada + generador de respaldo) ──────────────

// Significado mundano de cada cuerpo lento (para el generador de respaldo).
const BODY_MEANING: Record<string, Bilingual> = {
  Júpiter: { es: "expansión, ideología, ley y creencias", en: "expansion, ideology, law and beliefs" },
  Saturno: { es: "estructuras, autoridad y límites", en: "structures, authority and limits" },
  Urano: { es: "ruptura, tecnología y libertad", en: "rupture, technology and freedom" },
  Neptuno: { es: "disolución, ideales y utopías", en: "dissolution, ideals and utopias" },
  Plutón: { es: "poder profundo y transformación", en: "deep power and transformation" },
};

const ASPECT_QUALITY: Record<string, Bilingual> = {
  Conjunción: { es: "fusiona", en: "fuses" },
  Oposición: { es: "confronta", en: "confronts" },
  Cuadratura: { es: "tensiona", en: "strains" },
  Trígono: { es: "armoniza", en: "harmonizes" },
  Sextil: { es: "facilita", en: "facilitates" },
};

// Claves de firma con texto curado. Formato de clave:
//   aspecto:  "A+B:Aspecto" (par ordenado alfabéticamente)
//   ingreso:  "Cuerpo>Signo"
const CONFIG_NARRATIVES: Record<string, ConfigEntry> = {
  "Neptuno+Saturno:Conjunción": {
    title: { es: "Saturno–Neptuno en conjunción", en: "Saturn–Neptune conjunction" },
    theme: { es: "Disolución de estructuras", en: "Dissolution of structures" },
    synthesis: {
      es: "La estructura (Saturno) se encuentra con la disolución (Neptuno): regímenes que se agotan, fronteras que se difuminan y utopías que ganan o pierden solidez. Históricamente coincide con fines de ciclo ideológico.",
      en: "Structure (Saturn) meets dissolution (Neptune): regimes that exhaust themselves, borders that blur, and utopias that gain or lose solidity. Historically it coincides with the end of ideological cycles.",
    },
    source: SRC_BARBAULT,
  },
  "Neptuno>Aries": {
    title: { es: "Neptuno ingresa en Aries", en: "Neptune enters Aries" },
    theme: { es: "Nuevos ideales pioneros", en: "New pioneering ideals" },
    synthesis: {
      es: "Un ideal colectivo (Neptuno) se viste de iniciativa y nacionalismo (Aries). Épocas anteriores trajeron fracturas nacionales y la forja de nuevas naciones.",
      en: "A collective ideal (Neptune) takes on initiative and nationalism (Aries). Prior eras brought national fractures and the forging of new nations.",
    },
    source: SRC_TARNAS,
  },
  "Urano>Géminis": {
    title: { es: "Urano ingresa en Géminis", en: "Uranus enters Gemini" },
    theme: { es: "Revolución de la información", en: "Revolution of information" },
    synthesis: {
      es: "La ruptura tecnológica (Urano) actúa sobre la comunicación y el transporte (Géminis). El precedente de mediados del siglo XX fue la era atómica y la computación.",
      en: "Technological rupture (Uranus) acts on communication and transport (Gemini). The mid-20th-century precedent was the atomic and computing age.",
    },
    source: SRC_CASSANYA,
  },
  "Saturno>Aries": {
    title: { es: "Saturno ingresa en Aries", en: "Saturn enters Aries" },
    theme: { es: "Estructuras que se afirman por la fuerza", en: "Structures asserted by force" },
    synthesis: {
      es: "La estructura y la autoridad (Saturno) se visten de iniciativa e impulso (Aries): fronteras que se endurecen, regímenes que se afirman, decisiones tomadas por la fuerza de los hechos. Es el ingreso de signo con más precedentes históricos de este corpus.",
      en: "Structure and authority (Saturn) take on initiative and drive (Aries): borders that harden, regimes that assert themselves, decisions made by force of circumstance. This is the sign ingress with the most historical precedents in this corpus.",
    },
    source: SRC_BAIGENT,
  },
  "Saturno+Urano:Sextil": {
    title: { es: "Saturno–Urano en sextil", en: "Saturn–Uranus sextile" },
    theme: { es: "Reforma gradual, no colapso", en: "Gradual reform, not collapse" },
    synthesis: {
      es: "Estructura (Saturno) y ruptura (Urano) cooperan en vez de chocar: es la misma pareja que en conjunción, cuadratura u oposición marcó Constantinopla, el Crac de 1929 o el asalto al Capitolio, pero aquí en su fase más amable — reforma institucional sin ruptura brusca.",
      en: "Structure (Saturn) and rupture (Uranus) cooperate rather than clash: it is the same pair that in conjunction, square or opposition marked Constantinople, the Crash of 1929 or the Capitol riot, but here in its gentlest phase — institutional reform without abrupt rupture.",
    },
    source: SRC_BARBAULT,
  },
  "Plutón+Saturno:Sextil": {
    title: { es: "Saturno–Plutón en sextil", en: "Saturn–Pluto sextile" },
    theme: { es: "Poder que se reorganiza sin crisis abierta", en: "Power reorganizing without open crisis" },
    synthesis: {
      es: "El mismo ciclo que en conjunción u oposición coincidió con guerras y crisis de poder (1914, 1947, 2001) aquí fluye: estructura y transformación profunda cooperan para reorganizar instituciones sin una ruptura violenta.",
      en: "The same cycle that in conjunction or opposition coincided with wars and crises of power (1914, 1947, 2001) here flows smoothly: structure and deep transformation cooperate to reorganize institutions without violent rupture.",
    },
    source: SRC_BAIGENT,
  },
  "Plutón+Urano:Trígono": {
    title: { es: "Urano–Plutón en trígono", en: "Uranus–Pluto trine" },
    theme: { es: "Transformación que fluye sin estallido", en: "Transformation flowing without eruption" },
    synthesis: {
      es: "La pareja que en conjunción u oposición detonó revoluciones (1793, 1851, 1962, 2011) aquí armoniza: ruptura y poder profundo colaboran, permitiendo cambios estructurales sin el mismo grado de violencia social.",
      en: "The pair that in conjunction or opposition detonated revolutions (1793, 1851, 1962, 2011) here harmonizes: rupture and deep power collaborate, allowing structural change without the same degree of social violence.",
    },
    source: SRC_TARNAS,
  },
  "Neptuno+Urano:Sextil": {
    title: { es: "Urano–Neptuno en sextil", en: "Uranus–Neptune sextile" },
    theme: { es: "Reordenamiento civilizatorio lento", en: "Slow civilizational reordering" },
    synthesis: {
      es: "El ciclo de ~172 años que en conjunción coincidió con independencias americanas y griegas o con la fundación de la UE aquí se manifiesta como una corriente de fondo: ruptura tecnológica e ideales colectivos avanzan sin un evento único que los cristalice.",
      en: "The ~172-year cycle that in conjunction coincided with American and Greek independence or the founding of the EU here manifests as a background current: technological rupture and collective ideals advance without a single crystallizing event.",
    },
    source: SRC_CAMPION,
  },
  "Neptuno+Plutón:Sextil": {
    title: { es: "Neptuno–Plutón en sextil", en: "Neptune–Pluto sextile" },
    theme: { es: "Ideales y poder profundo en cooperación silenciosa", en: "Ideals and deep power in quiet cooperation" },
    synthesis: {
      es: "El ciclo más lento del sistema (Neptuno-Plutón se mueve en siglos) avanza en fondo: disolución de ideales y transformación profunda cooperan de forma casi imperceptible, como telón de fondo de las demás configuraciones del período.",
      en: "The slowest cycle in the system (Neptune-Pluto moves across centuries) advances in the background: the dissolution of ideals and deep transformation cooperate almost imperceptibly, as a backdrop to the period's other configurations.",
    },
    source: SRC_BARBAULT,
  },
  "Júpiter+Saturno:Trígono": {
    title: { es: "Júpiter–Saturno en trígono", en: "Jupiter–Saturn trine" },
    theme: { es: "Expansión y estructura en equilibrio", en: "Expansion and structure in balance" },
    synthesis: {
      es: "El mismo ciclo social de veinte años que en conjunción marcó 1961, 1981, 2000 o 2020 aquí fluye en armonía: expansión (Júpiter) y estructura (Saturno) cooperan, favoreciendo el crecimiento sostenido sobre el quiebre.",
      en: "The same twenty-year social cycle that in conjunction marked 1961, 1981, 2000 or 2020 here flows in harmony: expansion (Jupiter) and structure (Saturn) cooperate, favoring sustained growth over rupture.",
    },
    source: SRC_BARBAULT,
  },
  "Júpiter+Urano:Sextil": {
    title: { es: "Júpiter–Urano en sextil", en: "Jupiter–Uranus sextile" },
    theme: { es: "Oportunidades de innovación", en: "Opportunities for innovation" },
    synthesis: {
      es: "La pareja que en conjunción coincidió con la llegada a la Luna, el vuelo de Lindbergh o la clonación de Dolly aquí facilita: expansión y ruptura tecnológica cooperan, abriendo ventanas de innovación sin el mismo grado de disrupción.",
      en: "The pair that in conjunction coincided with the Moon landing, Lindbergh's flight or Dolly's cloning here facilitates: expansion and technological rupture cooperate, opening windows of innovation without the same degree of disruption.",
    },
    source: SRC_CASSANYA,
  },
  "Júpiter+Urano:Cuadratura": {
    title: { es: "Júpiter–Urano en cuadratura", en: "Jupiter–Uranus square" },
    theme: { es: "Sobresaltos de expansión disruptiva", en: "Jolts of disruptive expansion" },
    synthesis: {
      es: "Expansión (Júpiter) y ruptura (Urano) se tensionan: crecimiento que se acelera de forma desigual, oportunidades que llegan acompañadas de sobresaltos e imprevistos.",
      en: "Expansion (Jupiter) and rupture (Uranus) strain against each other: growth accelerating unevenly, opportunities arriving alongside jolts and the unforeseen.",
    },
    source: SRC_CAMPION,
  },
  "Júpiter+Plutón:Oposición": {
    title: { es: "Júpiter–Plutón en oposición", en: "Jupiter–Pluto opposition" },
    theme: { es: "Expansión frente a poder concentrado", en: "Expansion versus concentrated power" },
    synthesis: {
      es: "El ciclo que en conjunción coincidió con el Creditanstalt de 1931 o la Gran Recesión de 2007 aquí confronta: la expansión de recursos o creencias (Júpiter) se enfrenta al poder profundo y concentrado (Plutón).",
      en: "The cycle that in conjunction coincided with the 1931 Creditanstalt collapse or the 2007 Great Recession here confronts: the expansion of resources or beliefs (Jupiter) faces off against deep, concentrated power (Pluto).",
    },
    source: SRC_TARNAS,
  },
  "Júpiter+Neptuno:Trígono": {
    title: { es: "Júpiter–Neptuno en trígono", en: "Jupiter–Neptune trine" },
    theme: { es: "Ideales que fluyen sin resistencia", en: "Ideals flowing without resistance" },
    synthesis: {
      es: "El mismo aspecto que acompañó la caída de Saigón en 1975 aquí fluye: expansión de creencias (Júpiter) y disolución de ideales (Neptuno) armonizan, favoreciendo cierres de ciclo sin choque abierto.",
      en: "The same aspect that accompanied the fall of Saigon in 1975 here flows smoothly: the expansion of beliefs (Jupiter) and the dissolution of ideals (Neptune) harmonize, favoring the closing of cycles without open clash.",
    },
    source: SRC_CAMPION,
  },
  "Júpiter>Leo": {
    title: { es: "Júpiter ingresa en Leo", en: "Jupiter enters Leo" },
    theme: { es: "Expansión con foco en el liderazgo", en: "Expansion centered on leadership" },
    synthesis: {
      es: "La expansión y la buena fortuna (Júpiter) se visten de brillo, liderazgo y protagonismo (Leo). Un año propicio para figuras públicas, industrias culturales y afirmaciones de identidad colectiva.",
      en: "Expansion and good fortune (Jupiter) take on shine, leadership and prominence (Leo). A year favorable to public figures, cultural industries and assertions of collective identity.",
    },
    source: SRC_BAIGENT,
  },
  "Júpiter>Virgo": {
    title: { es: "Júpiter ingresa en Virgo", en: "Jupiter enters Virgo" },
    theme: { es: "Expansión a través del detalle y el servicio", en: "Expansion through detail and service" },
    synthesis: {
      es: "La expansión y la buena fortuna (Júpiter) se atemperan con el análisis, la salud y el trabajo metódico (Virgo). Un año que favorece la consolidación práctica sobre el gesto grandilocuente.",
      en: "Expansion and good fortune (Jupiter) are tempered by analysis, health and methodical work (Virgo). A year that favors practical consolidation over the grand gesture.",
    },
    source: SRC_BAIGENT,
  },
};

function signatureKey(config: { signature: Record<string, unknown> }): string | null {
  const sig = config.signature;
  if (Array.isArray(sig.pair) && typeof sig.aspect === "string") {
    const pair = [...(sig.pair as string[])].sort();
    return `${pair[0]}+${pair[1]}:${sig.aspect}`;
  }
  if (typeof sig.body === "string" && typeof sig.ingress === "string") {
    return `${sig.body}>${sig.ingress}`;
  }
  return null;
}

export function getConfigNarrative(
  config: {
    kind: "aspect" | "ingress";
    bodies: string[];
    aspect: string | null;
    sign: string | null;
    signature: Record<string, unknown>;
  },
  lang: Lang,
): { title: string; theme: string; synthesis: string; source: string } {
  const key = signatureKey(config);
  if (key && CONFIG_NARRATIVES[key]) {
    const c = CONFIG_NARRATIVES[key];
    return { title: c.title[lang], theme: c.theme[lang], synthesis: c.synthesis[lang], source: c.source[lang] };
  }

  // ── Generador de respaldo compositivo ──
  if (config.kind === "aspect" && config.aspect && config.bodies.length === 2) {
    const [a, b] = config.bodies;
    const qual = ASPECT_QUALITY[config.aspect]?.[lang] ?? config.aspect.toLowerCase();
    const ma = BODY_MEANING[a]?.[lang] ?? a;
    const mb = BODY_MEANING[b]?.[lang] ?? b;
    const title = lang === "es"
      ? `${a}–${b} en ${config.aspect.toLowerCase()}`
      : `${a}–${b} ${config.aspect.toLowerCase()}`;
    const synthesis = lang === "es"
      ? `El ciclo ${a}–${b} ${qual} ${ma} con ${mb}. Un compás de fondo en el clima geopolítico del período.`
      : `The ${a}–${b} cycle ${qual} ${ma} with ${mb}. A background beat in the period's geopolitical climate.`;
    return {
      title,
      theme: lang === "es" ? "Ciclo planetario" : "Planetary cycle",
      synthesis,
      source: SRC_BARBAULT[lang],
    };
  }

  if (config.kind === "ingress" && config.sign && config.bodies.length === 1) {
    const body = config.bodies[0];
    const m = BODY_MEANING[body]?.[lang] ?? body;
    const title = lang === "es"
      ? `${body} ingresa en ${config.sign}`
      : `${body} enters ${config.sign}`;
    const synthesis = lang === "es"
      ? `${body} —${m}— estrena el terreno de ${config.sign}, tiñiendo de un nuevo color los asuntos colectivos durante años.`
      : `${body} —${m}— opens the ground of ${config.sign}, coloring collective affairs anew for years.`;
    return { title, theme: lang === "es" ? "Ingreso de signo" : "Sign ingress", synthesis, source: SRC_BAIGENT[lang] };
  }

  return { title: config.bodies.join("–"), theme: "", synthesis: "", source: "" };
}
