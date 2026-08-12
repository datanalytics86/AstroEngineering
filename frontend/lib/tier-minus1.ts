/**
 * Tier -1 Free PDF Preview — motor de contenido.
 *
 * Tono: coaching premium. Empático, directo, cero misticismo barato.
 * Segunda persona. Frases cortas. Verbos concretos.
 * El lector debe sentir “esto soy yo” y querer mandárselo a alguien.
 *
 * Nunca aparecen planetas, signos, casas, orbes, aspectos ni tránsitos.
 * El scoring es el de topic-summary.ts; aquí solo se traduce a humano.
 */

import type {
  ChartResponse,
  HumanBadge,
  PlanetPosition,
  StrengthLevel,
  TierMinus1Content,
  TierMinus1Section,
  TopicId,
} from "./types";
import { scoreAllTopics } from "./topic-summary";

type Lang = "es" | "en";

const PREVIEW_URL = "https://astro-engineering.vercel.app";

// ── Badges ────────────────────────────────────────────────────────────────────

export function strengthToBadge(level: StrengthLevel): HumanBadge {
  if (level === "alta") return "potencial_fuerte";
  if (level === "desafio") return "area_practica";
  return "equilibrado";
}

const BADGE_LABEL: Record<HumanBadge, { es: string; en: string }> = {
  potencial_fuerte: { es: "Potencial fuerte", en: "Strong potential" },
  equilibrado: { es: "Equilibrado", en: "Balanced" },
  area_practica: { es: "Área de práctica", en: "Practice area" },
};

const TOPIC_TITLE: Record<TopicId, { es: string; en: string }> = {
  amor: { es: "Amor & Relaciones", en: "Love & Relationships" },
  dinero: { es: "Dinero & Recursos", en: "Money & Resources" },
  trabajo: { es: "Trabajo & Vocación", en: "Work & Vocation" },
  salud: { es: "Salud & Energía", en: "Health & Energy" },
  familia: { es: "Familia & Hogar", en: "Family & Home" },
  crecimiento: { es: "Crecimiento Personal", en: "Personal Growth" },
};

// ── Voces humanas (ancladas al signo, sin nombrarlo) ──────────────────────────

interface SignVoice {
  style: string;
  need: string;
  fuel: string;
  shadow: string;
}

const VOICE: Record<string, { es: SignVoice; en: SignVoice }> = {
  Aries: {
    es: {
      style: "directa y sin rodeos",
      need: "honestidad y movimiento",
      fuel: "empezar antes de que el miedo hable",
      shadow: "apurar o imponer el ritmo",
    },
    en: {
      style: "direct and without theater",
      need: "honesty and movement",
      fuel: "starting before fear gets a vote",
      shadow: "rushing or setting the pace for everyone",
    },
  },
  Tauro: {
    es: {
      style: "pausada, sensorial y constante",
      need: "estabilidad y placer real",
      fuel: "construir algo que se pueda tocar",
      shadow: "quedarte demasiado tiempo en lo conocido",
    },
    en: {
      style: "slow, sensory, and steady",
      need: "stability and real pleasure",
      fuel: "building something you can touch",
      shadow: "staying too long in what you already know",
    },
  },
  Géminis: {
    es: {
      style: "curiosa, ágil y conversada",
      need: "variedad y diálogo",
      fuel: "aprender y conectar ideas",
      shadow: "dispersarte antes de profundizar",
    },
    en: {
      style: "curious, quick, and conversational",
      need: "variety and dialogue",
      fuel: "learning and connecting ideas",
      shadow: "scattering before you go deep",
    },
  },
  Cáncer: {
    es: {
      style: "protectora e intuitiva",
      need: "seguridad emocional",
      fuel: "cuidar lo que quieres que dure",
      shadow: "guardar de más o aferrarte",
    },
    en: {
      style: "protective and intuitive",
      need: "emotional safety",
      fuel: "tending what you want to last",
      shadow: "over-holding or clinging",
    },
  },
  Leo: {
    es: {
      style: "cálida, visible y generosa",
      need: "reconocimiento sincero",
      fuel: "crear y que te vean de verdad",
      shadow: "medir tu valor por el aplauso",
    },
    en: {
      style: "warm, visible, and generous",
      need: "sincere recognition",
      fuel: "creating and being truly seen",
      shadow: "measuring your worth by applause",
    },
  },
  Virgo: {
    es: {
      style: "precisa, útil y atenta al detalle",
      need: "orden y sentido práctico",
      fuel: "mejorar lo que ya existe",
      shadow: "exigirte una perfección que no existe",
    },
    en: {
      style: "precise, useful, and detail-aware",
      need: "order and practical sense",
      fuel: "improving what already exists",
      shadow: "demanding a perfection that does not exist",
    },
  },
  Libra: {
    es: {
      style: "diplomática y con ojo para el equilibrio",
      need: "belleza y justicia en el trato",
      fuel: "crear armonía entre personas",
      shadow: "evitar la decisión difícil",
    },
    en: {
      style: "diplomatic, with an eye for balance",
      need: "beauty and fairness in how you are treated",
      fuel: "creating harmony between people",
      shadow: "avoiding the hard decision",
    },
  },
  Escorpio: {
    es: {
      style: "intensa, leal y de pocas máscaras",
      need: "confianza real, no cosmética",
      fuel: "ir al fondo de las cosas",
      shadow: "controlar para no lastimarte",
    },
    en: {
      style: "intense, loyal, and unmasked",
      need: "real trust, not cosmetic closeness",
      fuel: "going to the bottom of things",
      shadow: "controlling so you will not get hurt",
    },
  },
  Sagitario: {
    es: {
      style: "amplia, honesta y con ganas de horizonte",
      need: "libertad y sentido",
      fuel: "entender el para qué",
      shadow: "prometer más de lo que sostienes",
    },
    en: {
      style: "broad, honest, and hungry for horizon",
      need: "freedom and meaning",
      fuel: "understanding the why",
      shadow: "promising more than you can hold",
    },
  },
  Capricornio: {
    es: {
      style: "seria, paciente y de largo aliento",
      need: "respeto y resultados",
      fuel: "dejar una obra que se sostenga",
      shadow: "confundir valer con producir",
    },
    en: {
      style: "serious, patient, and long-game",
      need: "respect and results",
      fuel: "leaving work that stands",
      shadow: "confusing worth with output",
    },
  },
  Acuario: {
    es: {
      style: "independiente, lúcida y un poco a destiempo",
      need: "espacio para ser distinto",
      fuel: "mejorar el sistema, no solo tu caso",
      shadow: "desconectar cuando más te necesitan",
    },
    en: {
      style: "independent, lucid, a little off-tempo",
      need: "room to be different",
      fuel: "improving the system, not only your case",
      shadow: "checking out when you are most needed",
    },
  },
  Piscis: {
    es: {
      style: "empática, imaginativa y permeable",
      need: "belleza y un lugar donde soltar",
      fuel: "sentir y crear desde lo invisible",
      shadow: "diluirte en el otro o en la fantasía",
    },
    en: {
      style: "empathetic, imaginative, and permeable",
      need: "beauty and a place to let go",
      fuel: "feeling and creating from the unseen",
      shadow: "dissolving into the other, or into fantasy",
    },
  },
};

const FALLBACK_VOICE: { es: SignVoice; en: SignVoice } = {
  es: {
    style: "propia y difícil de copiar",
    need: "ser tomado en serio",
    fuel: "hacer las cosas a tu manera",
    shadow: "dudar de tu propio ritmo",
  },
  en: {
    style: "your own, and hard to copy",
    need: "being taken seriously",
    fuel: "doing things your way",
    shadow: "doubting your own pace",
  },
};

// Dónde se juega el tema (casa → zona de vida, sin decir “casa”).
const LIFE_ZONE: Record<number, { es: string; en: string }> = {
  1: { es: "cómo apareces y cómo empiezas", en: "how you show up and how you begin" },
  2: { es: "lo que valoras y cómo te sostienes", en: "what you value and how you support yourself" },
  3: { es: "cómo hablas, aprendes y te mueves cerca", en: "how you speak, learn, and move nearby" },
  4: { es: "tu nido, tus raíces y la vida privada", en: "your nest, your roots, and private life" },
  5: { es: "el juego, el romance y lo que creas por gusto", en: "play, romance, and what you make for joy" },
  6: { es: "tus rutinas, tu oficio diario y tu cuerpo", en: "your routines, daily craft, and body" },
  7: { es: "los vínculos de a dos y las alianzas", en: "one-to-one bonds and alliances" },
  8: { es: "lo compartido, lo íntimo y lo que te transforma", en: "what is shared, intimate, and transforming" },
  9: { es: "el horizonte: ideas grandes, viajes, sentido", en: "the horizon: big ideas, travel, meaning" },
  10: { es: "tu vocación y tu nombre en el mundo", en: "your vocation and your name in the world" },
  11: { es: "tus círculos y el futuro que imaginas", en: "your circles and the future you imagine" },
  12: { es: "tu vida interior y lo que no se ve", en: "your inner life and what stays unseen" },
};

// ── Headlines emocionales por tema × voz ──────────────────────────────────────

const LOVE_HEAD: Record<string, { es: string; en: string }> = {
  Aries: {
    es: "Amas en directo: poco teatro, mucha verdad",
    en: "You love straight-on: little theater, a lot of truth",
  },
  Tauro: {
    es: "El cariño, para ti, se construye con las manos",
    en: "Affection, for you, is built with the hands",
  },
  Géminis: {
    es: "Te vinculas hablando: la química empieza en la conversación",
    en: "You bond by talking: chemistry starts in conversation",
  },
  Cáncer: {
    es: "Amas como se cuida un hogar: de cerca y de verdad",
    en: "You love the way a home is kept: close, and for real",
  },
  Leo: {
    es: "Necesitas que te elijan a plena luz, no a medias",
    en: "You need to be chosen in full light, not halfway",
  },
  Virgo: {
    es: "Tu amor se nota en los detalles que nadie más ve",
    en: "Your love shows in the details no one else notices",
  },
  Libra: {
    es: "Buscas una belleza de a dos: equilibrio, no fusión",
    en: "You want a beauty of two: balance, not fusion",
  },
  Escorpio: {
    es: "No amas liviano: si entras, entras del todo",
    en: "You do not love lightly: if you enter, you enter all the way",
  },
  Sagitario: {
    es: "El amor te late cuando hay horizonte compartido",
    en: "Love wakes up when there is a shared horizon",
  },
  Capricornio: {
    es: "Te tomas el vínculo en serio: es un proyecto, no un rato",
    en: "You take the bond seriously: it is a project, not a moment",
  },
  Acuario: {
    es: "Quieres cercanía sin jaula",
    en: "You want closeness without a cage",
  },
  Piscis: {
    es: "Amas como quien se moja: con todo el cuerpo emocional",
    en: "You love the way you get wet: with the whole emotional body",
  },
};

const MONEY_HEAD: Record<string, { es: string; en: string }> = {
  Aries: {
    es: "El dinero te responde cuando te atreves a empezar",
    en: "Money answers you when you dare to start",
  },
  Tauro: {
    es: "Tu abundancia crece lento y se queda",
    en: "Your abundance grows slowly — and stays",
  },
  Géminis: {
    es: "Ganas cuando conectas ideas, personas y oportunidades",
    en: "You earn when you connect ideas, people, and openings",
  },
  Cáncer: {
    es: "Cuidas lo tuyo como se cuida una familia",
    en: "You look after what is yours the way you look after family",
  },
  Leo: {
    es: "El dinero, para ti, también es dignidad visible",
    en: "Money, for you, is also visible dignity",
  },
  Virgo: {
    es: "Tu riqueza está en el oficio: lo bien hecho se cobra",
    en: "Your wealth is in the craft: what is well made gets paid",
  },
  Libra: {
    es: "Prosperas en alianza: el valor se negocia, no se implora",
    en: "You prosper in alliance: value is negotiated, not begged",
  },
  Escorpio: {
    es: "No juegas a lo superficial con lo que es tuyo",
    en: "You do not play surface games with what is yours",
  },
  Sagitario: {
    es: "Creces cuando apuestas por lo que tiene sentido",
    en: "You grow when you bet on what actually means something",
  },
  Capricornio: {
    es: "Construyes patrimonio: paciencia con fecha y plano",
    en: "You build wealth: patience with a date and a plan",
  },
  Acuario: {
    es: "Ganas distinto: tu idea rara es tu ventaja",
    en: "You earn differently: the odd idea is your edge",
  },
  Piscis: {
    es: "El dinero te fluye cuando no traicionas tu sensibilidad",
    en: "Money flows when you do not betray your sensitivity",
  },
};

const WORK_HEAD: Record<string, { es: string; en: string }> = {
  Aries: {
    es: "Te reconocen cuando tomas la iniciativa",
    en: "The world notices you when you take the lead",
  },
  Tauro: {
    es: "Tu sello profesional es constancia que se puede tocar",
    en: "Your professional mark is constancy you can touch",
  },
  Géminis: {
    es: "Tu oficio vive en las palabras, las redes y la agilidad",
    en: "Your craft lives in words, networks, and agility",
  },
  Cáncer: {
    es: "Cuidas un territorio: la gente trabaja mejor cerca de ti",
    en: "You hold a territory: people work better near you",
  },
  Leo: {
    es: "Necesitas un escenario: tu trabajo pide verse",
    en: "You need a stage: your work asks to be seen",
  },
  Virgo: {
    es: "Te contratan por lo que arreglas y por lo que sostienes",
    en: "They hire you for what you fix and what you hold",
  },
  Libra: {
    es: "Tu vocación pasa por el trato: unes, negocias, das forma",
    en: "Your vocation runs through relationship: you join, negotiate, shape",
  },
  Escorpio: {
    es: "Haces el trabajo que otros no se atreven a mirar de frente",
    en: "You do the work others will not look at directly",
  },
  Sagitario: {
    es: "Enseñas, abres camino, das un para qué",
    en: "You teach, open a path, give a why",
  },
  Capricornio: {
    es: "Viniste a construir algo que sobreviva al aplauso",
    en: "You came to build something that outlasts applause",
  },
  Acuario: {
    es: "Tu aporte es el futuro un poco antes de que sea obvio",
    en: "Your contribution is the future, a little before it is obvious",
  },
  Piscis: {
    es: "Trabajas con lo invisible: clima, imagen, cuidado, arte",
    en: "You work with the invisible: climate, image, care, art",
  },
};

const HEALTH_HEAD: Record<string, { es: string; en: string }> = {
  Aries: {
    es: "Tu cuerpo pide fuego — y también un freno",
    en: "Your body wants fire — and also a brake",
  },
  Tauro: {
    es: "Tu energía se construye con ritmo, comida y suelo",
    en: "Your energy is built with rhythm, food, and ground",
  },
  Géminis: {
    es: "Te agotas por la cabeza antes que por las piernas",
    en: "You tire in the mind before you tire in the legs",
  },
  Cáncer: {
    es: "Si el clima emocional está mal, el cuerpo lo cobra",
    en: "If the emotional weather is off, the body sends the bill",
  },
  Leo: {
    es: "Tu vitalidad sube cuando hay gozo, no solo deber",
    en: "Your vitality rises with joy, not duty alone",
  },
  Virgo: {
    es: "El detalle te cuida — hasta que se vuelve un látigo",
    en: "Detail takes care of you — until it becomes a whip",
  },
  Libra: {
    es: "Tu cuerpo busca equilibrio: exceso de un lado, se queja",
    en: "Your body wants balance: too much on one side, it complains",
  },
  Escorpio: {
    es: "Tu energía es de reserva profunda: no la gastes en lo falso",
    en: "Your energy is a deep reserve: do not spend it on what is false",
  },
  Sagitario: {
    es: "Te sana el horizonte: moverte, aprender, salir",
    en: "The horizon heals you: moving, learning, getting out",
  },
  Capricornio: {
    es: "Aguantas de más. El descanso también es oficio",
    en: "You endure too much. Rest is also part of the craft",
  },
  Acuario: {
    es: "Tu sistema pide rareza: un plan que sea tuyo, no de moda",
    en: "Your system wants oddness: a plan that is yours, not trendy",
  },
  Piscis: {
    es: "Eres permeable: el entorno entra. Elige bien dónde estás",
    en: "You are permeable: the room gets in. Choose where you stand",
  },
};

const HOME_HEAD: Record<string, { es: string; en: string }> = {
  Aries: {
    es: "En casa necesitas aire y permiso para ser independiente",
    en: "At home you need air and permission to be independent",
  },
  Tauro: {
    es: "Tu nido tiene que sentirse rico al tacto",
    en: "Your nest has to feel rich to the touch",
  },
  Géminis: {
    es: "Hogar, para ti, es conversación y ventanas abiertas",
    en: "Home, for you, is conversation and open windows",
  },
  Cáncer: {
    es: "El hogar no es un lugar: es el clima que sabes crear",
    en: "Home is not a place: it is the climate you know how to make",
  },
  Leo: {
    es: "Tu casa pide calor, juego y que alguien te celebre",
    en: "Your house wants warmth, play, and someone who celebrates you",
  },
  Virgo: {
    es: "Ordenas el nido para poder respirar",
    en: "You order the nest so you can breathe",
  },
  Libra: {
    es: "Necesitas belleza en casa: lo feo te pone de mal humor",
    en: "You need beauty at home: ugliness puts you in a bad mood",
  },
  Escorpio: {
    es: "Tu vida privada no es un extra: es la trama central",
    en: "Private life is not a side quest: it is the main plot",
  },
  Sagitario: {
    es: "Raíces sí — pero con puerta de salida",
    en: "Roots, yes — with a door that opens out",
  },
  Capricornio: {
    es: "Construyes un hogar como se construye una casa: con tiempo",
    en: "You build a home the way you build a house: with time",
  },
  Acuario: {
    es: "Familia, para ti, también se elige",
    en: "Family, for you, is also chosen",
  },
  Piscis: {
    es: "Necesitas un refugio donde poder desarmarte",
    en: "You need a refuge where you can come apart safely",
  },
};

const GROW_HEAD: Record<string, { es: string; en: string }> = {
  Aries: {
    es: "Tu próximo capítulo pide coraje de principiante",
    en: "Your next chapter asks for beginner’s courage",
  },
  Tauro: {
    es: "Creces cuando das cuerpo a lo que ya sabes",
    en: "You grow when you give body to what you already know",
  },
  Géminis: {
    es: "Tu evolución habla, pregunta, enseña y se actualiza",
    en: "Your evolution talks, asks, teaches, and updates",
  },
  Cáncer: {
    es: "Maduras cuando cuidas sin perderte",
    en: "You mature when you care without disappearing",
  },
  Leo: {
    es: "El siguiente paso es atreverte a ocupar más luz",
    en: "The next step is daring to take up more light",
  },
  Virgo: {
    es: "Creces en lo pequeño bien hecho, no en el discurso grande",
    en: "You grow in the small thing done well, not the big speech",
  },
  Libra: {
    es: "Tu lección es decidir — y quedarte con la decisión",
    en: "Your lesson is to decide — and stay with the decision",
  },
  Escorpio: {
    es: "Te toca soltar una piel. No es pérdida: es muda",
    en: "You are meant to shed a skin. It is not loss: it is molt",
  },
  Sagitario: {
    es: "La vida te empuja más lejos de lo cómodo",
    en: "Life keeps pushing you past what is comfortable",
  },
  Capricornio: {
    es: "Tu crecimiento tiene forma de maestría: oficio + tiempo",
    en: "Your growth looks like mastery: craft plus time",
  },
  Acuario: {
    es: "Te toca ser más tú, aunque eso desordene el grupo",
    en: "You are meant to be more yourself, even if it rearranges the room",
  },
  Piscis: {
    es: "Creces cuando dejas de huir de lo que sientes",
    en: "You grow when you stop fleeing what you feel",
  },
};

const KEYWORDS: Record<TopicId, { es: string[]; en: string[] }> = {
  amor: {
    es: ["vínculo", "afecto", "elegir bien"],
    en: ["bond", "affection", "choose well"],
  },
  dinero: {
    es: ["valor", "sostén", "abundancia"],
    en: ["worth", "support", "abundance"],
  },
  trabajo: {
    es: ["oficio", "sello", "impacto"],
    en: ["craft", "signature", "impact"],
  },
  salud: {
    es: ["ritmo", "cuerpo", "recuperación"],
    en: ["rhythm", "body", "recovery"],
  },
  familia: {
    es: ["nido", "raíces", "clima"],
    en: ["nest", "roots", "climate"],
  },
  crecimiento: {
    es: ["sentido", "capítulo", "práctica"],
    en: ["meaning", "chapter", "practice"],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function planetByName(planets: PlanetPosition[], name: string): PlanetPosition | undefined {
  return planets.find((p) => p.name === name);
}

function voiceOf(sign: string | undefined, lang: Lang): SignVoice {
  if (sign && VOICE[sign]) return VOICE[sign][lang];
  return FALLBACK_VOICE[lang];
}

function zoneOf(house: number | undefined, lang: Lang): string {
  if (house && LIFE_ZONE[house]) return lang === "en" ? LIFE_ZONE[house].en : LIFE_ZONE[house].es;
  return lang === "en" ? "everyday life" : "el día a día";
}

function headOf(
  table: Record<string, { es: string; en: string }>,
  sign: string | undefined,
  lang: Lang,
  fallback: string
): string {
  if (sign && table[sign]) return lang === "en" ? table[sign].en : table[sign].es;
  return fallback;
}

function firstNameOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatBirthDate(iso: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const year = m[1];
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (lang === "en") return `${MONTHS_EN[month - 1]} ${day}, ${year}`;
  return `${day} de ${MONTHS_ES[month - 1]} de ${year}`;
}

const JARGON_RE =
  /\b(sol|luna|mercurio|venus|marte|júpiter|jupiter|saturno|urano|neptuno|plut[oó]n|quir[oó]n|nodo norte|nodo sur|sun|moon|mercury|mars|jupiter|saturn|uranus|neptune|pluto|chiron|north node|south node|aries|tauro|taurus|g[eé]minis|gemini|c[aá]ncer|cancer|leo|virgo|libra|escorpio|scorpio|sagitario|sagittarius|capricornio|capricorn|acuario|aquarius|piscis|pisces|casa\s*\d+|house\s*\d+|orbe|orbs?|tr[ií]gono|trine|cuadratura|square|oposici[oó]n|opposition|conjunci[oó]n|conjunction|sextil|sextile|medio cielo|midheaven|ascendente|ascendant|tr[aá]nsitos?|transits?)\b/i;

/** Devuelve los fragmentos con jerga (para tests / guardrail). */
export function findJargon(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(JARGON_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
}

function assertClean(label: string, text: string): void {
  const hits = findJargon(text);
  if (hits.length === 0) return;
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(`[tier-minus1] jerga en ${label}:`, hits.join(", "));
  }
}

// ── Builders ──────────────────────────────────────────────────────────────────

function buildLove(
  chart: ChartResponse,
  lang: Lang,
  badge: HumanBadge
): Pick<TierMinus1Section, "headline" | "paragraphs" | "tips"> {
  const venus = planetByName(chart.planets, "Venus");
  const moon = planetByName(chart.planets, "Luna");
  const v = voiceOf(venus?.sign, lang);
  const m = voiceOf(moon?.sign, lang);
  const zone = zoneOf(venus?.house, lang);
  const headline = headOf(
    LOVE_HEAD,
    venus?.sign,
    lang,
    lang === "en" ? "Your way of loving has a signature no one else has" : "Tu forma de amar tiene una firma que no se copia"
  );

  const p1 =
    lang === "en"
      ? `In love you look for a connection that feels ${v.style}. That story plays out most clearly in ${zone}.`
      : `En el amor buscas una conexión que se sienta ${v.style}. Esa historia se juega sobre todo en ${zone}.`;

  const p2 =
    lang === "en"
      ? `Emotionally you need ${m.need}. When that is missing, the bond feels unsafe even if everything “looks fine”.`
      : `Emocionalmente necesitas ${m.need}. Cuando eso falta, el vínculo se siente inseguro aunque todo “se vea bien”.`;

  const p3 =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? "This area speaks loudly in your life: relationships are a main classroom. Choose people who celebrate your style, not people who want to rewrite it."
        : "Esta área habla alto en tu vida: las relaciones son un aula principal. Elige a quien celebre tu estilo, no a quien quiera reescribirlo."
      : badge === "area_practica"
        ? lang === "en"
          ? "Here talent does not arrive alone — it arrives with practice. Every honest conversation compounds more than one grand gesture."
          : "Aquí el talento no llega solo: llega con práctica. Cada conversación honesta suma más que un gran gesto."
        : lang === "en"
          ? "Practical affection fits you: small, steady gestures beat rare spectacular ones."
          : "Te funciona el afecto práctico: gestos chicos y constantes ganan a las grandes escenas.";

  const tips =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? [
            "Say out loud how you like to be loved — do not assume it is obvious.",
            "Choose depth over a high-intensity weekend.",
          ]
        : [
            "Di en voz alta cómo te gusta que te amen — no asumas que se nota.",
            "Elige profundidad antes que un fin de semana de alta intensidad.",
          ]
      : badge === "area_practica"
        ? lang === "en"
          ? [
              "Name what you need before it turns into a complaint.",
              "When there is friction, stay in the conversation ten minutes longer.",
            ]
          : [
              "Nombra lo que necesitas antes de que se vuelva un reclamo.",
              "Cuando haya fricción, quédate diez minutos más en la conversación.",
            ]
        : lang === "en"
          ? [
              "A weekly ritual for two (walk, cook, talk without a phone) holds more than one trip a year.",
              "Ask: does this bring me closer, or dim me?",
            ]
          : [
              "Un rito semanal a dos (caminar, cocinar, hablar sin teléfono) sostiene más que una escapada al año.",
              "Pregunta: ¿esto me acerca o me apaga?",
            ];

  return { headline, paragraphs: [p1, p2, p3], tips };
}

function buildMoney(
  chart: ChartResponse,
  lang: Lang,
  badge: HumanBadge
): Pick<TierMinus1Section, "headline" | "paragraphs" | "tips"> {
  const jupiter = planetByName(chart.planets, "Júpiter");
  const venus = planetByName(chart.planets, "Venus");
  const key = jupiter ?? venus;
  const v = voiceOf(key?.sign, lang);
  const zone = zoneOf(key?.house ?? 2, lang);
  const headline = headOf(
    MONEY_HEAD,
    key?.sign,
    lang,
    lang === "en" ? "Your relationship with money is a relationship with yourself" : "Tu relación con el dinero es una relación contigo"
  );

  const p1 =
    lang === "en"
      ? `You make and look after resources in a way that is ${v.style}. The engine sits in ${zone}.`
      : `Generas y cuidas recursos de una forma ${v.style}. El motor está en ${zone}.`;

  const p2 =
    lang === "en"
      ? `Growth arrives when you bet on what feels meaningful, not only on what feels safe. Your fuel is ${v.fuel}.`
      : `El crecimiento llega cuando apuestas por lo que tiene sentido, no solo por lo seguro. Tu combustible es ${v.fuel}.`;

  const p3 =
    badge === "area_practica"
      ? lang === "en"
        ? "Treat scarcity stories as data, not destiny. Skill plus clear limits usually out-earn luck alone."
        : "Trata las historias de escasez como datos, no como destino. Oficio más límites claros suelen rendir más que la suerte sola."
      : lang === "en"
        ? "Abundance holds when your values, your effort, and your timing agree. Track what actually works for you — not what works for someone else."
        : "La abundancia se sostiene cuando tus valores, tu esfuerzo y tu timing se ponen de acuerdo. Observa qué te funciona de verdad — no lo que le funciona a otro.";

  const tips =
    badge === "area_practica"
      ? lang === "en"
        ? [
            "Write the scarcity sentence you repeat. Then write one fact that contradicts it.",
            "Put a simple ceiling on spending this week and a simple floor on what you charge.",
          ]
        : [
            "Escribe la frase de escasez que te repites. Luego un dato que la contradiga.",
            "Pon un techo simple de gasto esta semana y un piso simple a lo que cobras.",
          ]
      : lang === "en"
        ? [
            "Once a week, note one thing that brought money or worth — and one that drained it.",
            "Price your work for the result, not for the hours you doubt.",
          ]
        : [
            "Una vez por semana anota una cosa que trajo dinero o valor — y una que lo drenó.",
            "Cobra por el resultado, no por las horas que dudas.",
          ];

  return { headline, paragraphs: [p1, p2, p3], tips };
}

function buildWork(
  chart: ChartResponse,
  lang: Lang,
  badge: HumanBadge
): Pick<TierMinus1Section, "headline" | "paragraphs" | "tips"> {
  const mcSign = chart.midheaven?.sign;
  const sun = planetByName(chart.planets, "Sol");
  const v = voiceOf(mcSign, lang);
  const sunV = voiceOf(sun?.sign, lang);
  const zone = zoneOf(sun?.house ?? 10, lang);
  const headline = headOf(
    WORK_HEAD,
    mcSign,
    lang,
    lang === "en" ? "Your work makes sense when your mark is visible" : "Tu trabajo cobra sentido cuando se ve tu sello"
  );

  const p1 =
    lang === "en"
      ? `Professionally, the world tends to recognize a style that is ${v.style}. That is your public signature.`
      : `En lo profesional, el mundo tiende a reconocerte por una forma ${v.style}. Esa es tu firma pública.`;

  const p2 =
    lang === "en"
      ? `Purpose feeds the work when you give yourself to ${sunV.fuel} — especially in ${zone}. Mastery is earned; it is not handed over.`
      : `El propósito alimenta el trabajo cuando te dedicas a ${sunV.fuel} — sobre todo en ${zone}. La maestría se gana; no se regala.`;

  const p3 =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? "Vocation is a high-volume theme. Protect deep-work blocks and say no to prestige that has no purpose."
        : "La vocación es un tema de alto volumen. Protege bloques de trabajo profundo y di no al prestigio sin propósito."
      : badge === "area_practica"
        ? lang === "en"
          ? "Career friction is fuel. Turn pressure into craft, mentors, and a pace you can keep."
          : "La fricción profesional es combustible. Traduce la presión en oficio, mentores y un ritmo que puedas sostener."
        : lang === "en"
          ? "Steady progress beats dramatic pivots: ship, review, refine."
          : "El progreso constante gana a los giros dramáticos: entrega, revisa, refina.";

  const tips =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? [
            "Block two hours this week that nobody can buy.",
            "Drop one task that looks impressive and does not move your real work.",
          ]
        : [
            "Bloquea dos horas esta semana que nadie pueda comprarte.",
            "Suelta una tarea que se ve bien y no mueve tu trabajo real.",
          ]
      : badge === "area_practica"
        ? lang === "en"
          ? [
              "Name one person who already does this well — and ask one concrete question.",
              "Translate pressure into a 90-minute practice, not a midnight spiral.",
            ]
          : [
              "Nombra a una persona que ya hace esto bien — y hazle una pregunta concreta.",
              "Traduce la presión en 90 minutos de práctica, no en una espiral a medianoche.",
            ]
        : lang === "en"
          ? [
              "Ship one small, finished thing this week.",
              "Prefer roles where your contribution is visible and can be measured.",
            ]
          : [
              "Entrega esta semana una cosa pequeña y terminada.",
              "Prefiere roles donde tu aporte se vea y se pueda medir.",
            ];

  return { headline, paragraphs: [p1, p2, p3], tips };
}

function buildHealth(
  chart: ChartResponse,
  lang: Lang,
  badge: HumanBadge
): Pick<TierMinus1Section, "headline" | "paragraphs" | "tips"> {
  const mars = planetByName(chart.planets, "Marte");
  const sun = planetByName(chart.planets, "Sol");
  const moon = planetByName(chart.planets, "Luna");
  const v = voiceOf(mars?.sign, lang);
  const moonV = voiceOf(moon?.sign, lang);
  const zone = zoneOf(mars?.house ?? 6, lang);
  const headline = headOf(
    HEALTH_HEAD,
    mars?.sign,
    lang,
    lang === "en" ? "Your energy is not infinite: it has a rhythm" : "Tu energía no es infinita: tiene un ritmo"
  );

  const p1 =
    lang === "en"
      ? `Health here is less about perfection and more about a system you can keep. You push in a way that is ${v.style} — and the risk is ${v.shadow}. That shows up in ${zone}.`
      : `La salud aquí es menos perfección y más un sistema que puedas sostener. Te impulsas de una forma ${v.style} — y el riesgo es ${v.shadow}. Eso se nota en ${zone}.`;

  const p2 =
    lang === "en"
      ? `Will (you want ${voiceOf(sun?.sign, lang).need}) and rest (you recover through ${moonV.need}) have to speak to each other. When they do not, the body keeps score.`
      : `La voluntad (necesitas ${voiceOf(sun?.sign, lang).need}) y el descanso (recuperas a través de ${moonV.need}) tienen que hablarse. Cuando no lo hacen, el cuerpo lleva la cuenta.`;

  const p3 =
    badge === "area_practica"
      ? lang === "en"
        ? "This map flags stress sensitivity. Sleep, food timing, and honest limits are tools — not prizes you earn after collapsing."
        : "Este mapa marca sensibilidad al estrés. Sueño, horarios de comida y límites honestos son herramientas — no premios que te ganas después de quebrarte."
      : lang === "en"
        ? "Protect the routines that already work. Small daily deposits compound into durable vitality. Movement that matches your temperament beats a fashionable plan you drop in two weeks."
        : "Protege las rutinas que ya te funcionan. Pequeños depósitos diarios se componen en vitalidad que dura. El movimiento que encaja con tu temperamento gana a un plan de moda que abandonas en dos semanas.";

  const tips =
    badge === "area_practica"
      ? lang === "en"
        ? [
            "Put recovery on the calendar as if it were a meeting you cannot move.",
            "Pick one limit this week and keep it even when you feel useful.",
          ]
        : [
            "Agenda la recuperación como una reunión que no se mueve.",
            "Elige un límite esta semana y cúmplelo aunque te sientas útil.",
          ]
      : lang === "en"
        ? [
            "Keep the one daily habit that already gives you energy — do not replace it with a new ideology.",
            "Move in a way you would still choose in three months.",
          ]
        : [
            "Mantén el hábito diario que ya te da energía — no lo cambies por una ideología nueva.",
            "Muévete de un modo que seguirías eligiendo en tres meses.",
          ];

  return { headline, paragraphs: [p1, p2, p3], tips };
}

function buildFamily(
  chart: ChartResponse,
  lang: Lang,
  badge: HumanBadge
): Pick<TierMinus1Section, "headline" | "paragraphs" | "tips"> {
  const moon = planetByName(chart.planets, "Luna");
  const v = voiceOf(moon?.sign, lang);
  const zone = zoneOf(moon?.house ?? 4, lang);
  const inHome = chart.planets.filter((p) => p.house === 4).length;
  const headline = headOf(
    HOME_HEAD,
    moon?.sign,
    lang,
    lang === "en" ? "Home is the climate you choose to hold" : "Tu hogar es el clima que eliges sostener"
  );

  const p1 =
    lang === "en"
      ? `Family and home orbit a need that is ${v.style}. You feel safe enough to rest when you have ${v.need} — especially in ${zone}.`
      : `Familia y hogar orbitan una necesidad ${v.style}. Hay calma para descansar cuando existe ${v.need} — sobre todo en ${zone}.`;

  const p2 =
    inHome >= 2
      ? lang === "en"
        ? "Private life is not a side quest in your story. It is a core plotline. The climate at home multiplies — or drains — every other area."
        : "La vida privada no es un extra en tu historia. Es trama central. El clima de casa multiplica — o drena — todo lo demás."
      : lang === "en"
        ? "Even when home looks quiet from the outside, roots still set the stage: the house you keep, the people you call yours, the safety you offer yourself."
        : "Aunque el hogar se vea quieto desde fuera, las raíces siguen montando el escenario: la casa que sostienes, a quién llamas tuyo, la seguridad que te das.";

  const p3 =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? "Private life carries high voltage here. Invest in rooms and people that feel like an exhale."
        : "La vida privada lleva alto voltaje aquí. Invierte en espacios y personas que se sientan como un suspiro."
      : lang === "en"
        ? "You repair old family patterns by modeling the climate you needed — not by winning old arguments."
        : "Reparas patrones familiares modelando el clima que necesitaste — no ganando viejas discusiones.";

  const tips =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? [
            "Protect one corner of the house that is only for rest.",
            "Tell one person what ‘home’ actually feels like for you.",
          ]
        : [
            "Protege un rincón de la casa que sea solo para descansar.",
            "Dile a una persona qué se siente ‘hogar’ de verdad para ti.",
          ]
      : lang === "en"
        ? [
            "This week, practice the tone you needed — once, on purpose.",
            "Treat home care as strategy, not as a luxury you postpone.",
          ]
        : [
            "Esta semana, practica una vez — a propósito — el tono que necesitaste.",
            "Trata el cuidado del hogar como estrategia, no como un lujo que postergas.",
          ];

  return { headline, paragraphs: [p1, p2, p3], tips };
}

function buildGrowth(
  chart: ChartResponse,
  lang: Lang,
  badge: HumanBadge
): Pick<TierMinus1Section, "headline" | "paragraphs" | "tips"> {
  const nn = planetByName(chart.planets, "Nodo Norte");
  const jupiter = planetByName(chart.planets, "Júpiter");
  const key = nn ?? jupiter;
  const v = voiceOf(key?.sign, lang);
  const j = voiceOf(jupiter?.sign, lang);
  const zone = zoneOf(key?.house ?? 9, lang);
  const headline = headOf(
    GROW_HEAD,
    key?.sign,
    lang,
    lang === "en" ? "Life keeps inviting you into a chapter you do not master yet" : "La vida te invita a un capítulo que todavía no dominas"
  );

  const p1 =
    lang === "en"
      ? `Personal growth is not abstract here. The next chapter has a flavor that is ${v.style}, and it keeps offering itself in ${zone}.`
      : `El crecimiento personal no es abstracto. El próximo capítulo tiene una forma ${v.style}, y se te sigue ofreciendo en ${zone}.`;

  const p2 =
    lang === "en"
      ? `You expand when you give yourself to ${j.fuel}. Curiosity, teaching, travel, or a living belief open doors — if you stay honest about excess and about ${j.shadow}.`
      : `Te expandes cuando te dedicas a ${j.fuel}. La curiosidad, enseñar, viajar o una creencia viva abren puertas — si miras de frente el exceso y ${j.shadow}.`;

  const p3 =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? "Your map is hungry for meaning. Feed it with study, travel, practice, or service. Stagnation is the real enemy — not difficulty."
        : "Tu mapa tiene hambre de sentido. Aliméntalo con estudio, viaje, práctica o servicio. El estancamiento es el verdadero enemigo — no la dificultad."
      : lang === "en"
        ? "Grow in seasons: stretch, integrate, rest. Integration is as serious as the peak experience."
        : "Crece por temporadas: estira, integra, descansa. La integración es tan seria como la experiencia cumbre.";

  const tips =
    badge === "potencial_fuerte"
      ? lang === "en"
        ? [
            "Pick one practice for 30 days — not five ideas for a weekend.",
            "Say yes to one invitation that scares you a little and has a why.",
          ]
        : [
            "Elige una práctica por 30 días — no cinco ideas para un fin de semana.",
            "Di que sí a una invitación que te asuste un poco y tenga un para qué.",
          ]
      : lang === "en"
        ? [
            "After every stretch, schedule an equal stretch of integration.",
            "Write one sentence: what is this season teaching, in plain words?",
          ]
        : [
            "Después de cada estirón, agenda un tramo igual de integración.",
            "Escribe una frase: ¿qué te está enseñando esta temporada, en palabras simples?",
          ];

  return { headline, paragraphs: [p1, p2, p3], tips };
}

const BUILDERS: Record<
  TopicId,
  (
    chart: ChartResponse,
    lang: Lang,
    badge: HumanBadge
  ) => Pick<TierMinus1Section, "headline" | "paragraphs" | "tips">
> = {
  amor: buildLove,
  dinero: buildMoney,
  trabajo: buildWork,
  salud: buildHealth,
  familia: buildFamily,
  crecimiento: buildGrowth,
};

// ── Cover + CTA ───────────────────────────────────────────────────────────────

function coverCopy(lang: Lang) {
  return lang === "en"
    ? {
        kicker: "A personal document",
        title: "Your life map",
        lead: "Six areas of your life, in clear language. Made to keep — and to share.",
      }
    : {
        kicker: "Documento personal",
        title: "Tu mapa de vida",
        lead: "Seis áreas de tu vida, en lenguaje claro. Hecho para guardarlo — y para compartirlo.",
      };
}

function ctaCopy(firstName: string, lang: Lang) {
  const who = firstName || (lang === "en" ? "you" : "ti");
  return lang === "en"
    ? {
        kicker: "When you want to go further",
        headline: "This is only the first look",
        body: `${who === "you" ? "This" : `${who}, this`} preview is the door, not the house. The full version goes into your current moment: the pulse of the next twelve months and the pieces that weigh most on your map. No rush. When you want to go further, it is one tap away.`,
        button: "Unlock the full version · $2.99",
        footer: "AstroEngine · personal preview · not a technical report",
      }
    : {
        kicker: "Cuando quieras ir más lejos",
        headline: "Esto es solo el primer vistazo",
        body: `${firstName ? `${firstName}, este` : "Este"} preview es la puerta, no la casa. La versión completa entra en tu momento actual: el pulso de los próximos doce meses y las piezas que más pesan en tu mapa. Sin prisa. Cuando quieras ir más lejos, está a un toque.`,
        button: "Desbloquear la versión completa · $2.99",
        footer: "AstroEngine · preview personal · no es un informe técnico",
      };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateTierMinus1Content(
  chart: ChartResponse,
  name: string,
  lang: Lang = "es",
  place?: string
): TierMinus1Content {
  const displayName = (name || chart.name || "").trim() || (lang === "en" ? "Your map" : "Tu mapa");
  const firstName = firstNameOf(displayName);
  const scores = scoreAllTopics(chart);
  const cover = coverCopy(lang);
  const cta = ctaCopy(firstName, lang);

  const sections: TierMinus1Section[] = scores.map((s) => {
    const badge = strengthToBadge(s.strength);
    const body = BUILDERS[s.id](chart, lang, badge);
    const title = lang === "en" ? TOPIC_TITLE[s.id].en : TOPIC_TITLE[s.id].es;
    const section: TierMinus1Section = {
      id: s.id,
      title,
      headline: body.headline,
      paragraphs: body.paragraphs.slice(0, 3),
      tips: body.tips.slice(0, 2),
      badge,
      badgeLabel: lang === "en" ? BADGE_LABEL[badge].en : BADGE_LABEL[badge].es,
      keywords: lang === "en" ? KEYWORDS[s.id].en : KEYWORDS[s.id].es,
    };
    assertClean(`${s.id}.headline`, section.headline);
    section.paragraphs.forEach((p, i) => assertClean(`${s.id}.p${i}`, p));
    section.tips.forEach((t, i) => assertClean(`${s.id}.tip${i}`, t));
    return section;
  });

  const content: TierMinus1Content = {
    name: displayName,
    firstName,
    lang,
    coverKicker: cover.kicker,
    coverTitle: cover.title,
    coverLead: cover.lead,
    birthDateLabel: formatBirthDate(chart.birth_date, lang),
    birthTimeLabel: chart.birth_time || "",
    birthPlace: (place || "").trim(),
    sections,
    ctaKicker: cta.kicker,
    ctaHeadline: cta.headline,
    ctaBody: cta.body,
    ctaButton: cta.button,
    ctaUrl: PREVIEW_URL,
    footer: cta.footer,
  };

  assertClean("cta", `${content.ctaHeadline} ${content.ctaBody} ${content.coverLead}`);
  return content;
}
