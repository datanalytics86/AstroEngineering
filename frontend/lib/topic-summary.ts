import type { TransitEvent } from "@/lib/types";
import type { TopicId } from "@/lib/topics";
import { TOPICS, transitMatchesTopic } from "@/lib/topics";
import { getInterpretationByComponents } from "@/lib/interpretation-engine";

export interface TopicTransitItem {
  transit: TransitEvent;
  title: string;
  summary: string;
  detailed: string;
  advice: string;
  life_areas: string[];
}

export type OutlookLabel = "favorable" | "mixto" | "exigente"; // ES internally

export interface TopicSummaryResult {
  intro: string;
  transits: TopicTransitItem[];
  outlook: OutlookLabel;
  outlookLabel: string; // localized
  isEmpty: boolean;
  emptyMessage: string;
}

// ── Intro texts ───────────────────────────────────────────────────────────────

const INTROS_ES: Record<TopicId, string> = {
  dinero:
    "En la tradición de tránsitos (Robert Hand, Saturno y las casas 2 y 8; Venus en tránsito sobre planetas de recursos), el área financiera refleja el movimiento de Júpiter —que expande lo que toca— y Saturno —que consolida o restringe. Los tránsitos sobre Venus y Júpiter natal revelan ciclos de abundancia, gasto o reestructuración. Cuando Plutón o Urano actúan sobre Venus, los valores y las fuentes de ingreso pueden transformarse profundamente.",
  amor:
    "Para Howard Sasportas ('The Gods of Change'), Venus y Marte son los ejes del deseo y la atracción; sus tránsitos definen los ciclos de apertura y cierre relacional. Júpiter en tránsito sobre Venus natal es uno de los períodos más favorables para el amor y el compromiso. Saturno sobre Venus exige autenticidad; Neptuno puede idealizar o disolver. Los tránsitos al Descendente y la casa 7 marcan fases cruciales de encuentro y separación.",
  carrera:
    "Saturno en tránsito al MC (Medio Cielo) es el hito profesional por excelencia: cada 29 años marca el cénit y el inicio de un nuevo ciclo vocacional (Stephen Arroyo). Júpiter sobre el MC trae reconocimiento y oportunidades; Plutón transforma la carrera desde su raíz. Los planetas en tránsito por la casa 10 y sus aspectos al MC y Saturno natal estructuran los períodos de ascenso, consolidación y renovación profesional.",
  hogar:
    "La Luna natal y la casa 4 son los ejes del hogar, la familia y el pasado emocional en la tradición astrológica (Howard Sasportas). Los tránsitos de Saturno sobre la Luna traen responsabilidades familiares o necesidad de madurar emocionalmente. Júpiter sobre la Luna expande el hogar y nutre las relaciones familiares. Plutón sobre la Luna puede sanar heridas antiguas o precipitar cambios radicales en la estructura familiar.",
  mente:
    "Mercurio natal y la casa 3 rigen la comunicación, el aprendizaje y los contratos. En la tradición de tránsitos (Robert Hand), los planetas lentos sobre Mercurio transforman el modo de pensar y comunicarse: Saturno exige precisión y rigor; Urano trae brillantez e impulsividad; Neptuno disuelve los límites del pensamiento ordinario y abre la intuición. Los tránsitos de Júpiter sobre Mercurio son favorables para estudios, viajes cortos y acuerdos.",
  crecimiento:
    "Júpiter, Neptuno y los nodos lunares son los grandes agentes del crecimiento filosófico y espiritual en la carta (Stephen Arroyo, 'Astrology, Karma & Transformation'). Los ciclos de Júpiter sobre sí mismo y sobre planetas natales marcan aperturas de conciencia y expansión de horizonte. Los tránsitos de Saturno a Júpiter exigen que el crecimiento se ancle en la realidad. Plutón transforma la visión del mundo y Neptuno disuelve las fronteras del ego para acercar al individuo a lo transpersonal.",
  energia:
    "Marte natal y el Sol representan la vitalidad, la iniciativa y el coraje (Robert Hand, 'Planets in Transit'). Los tránsitos de Marte activan períodos de acción directa, aunque breves e intensos. Plutón sobre el Sol transforma la identidad y la fuerza de voluntad; Urano la libera de estructuras antiguas. Saturno sobre el Sol exige disciplina y autenticidad en el ejercicio de la propia energía. Los períodos de mayor vitalidad coinciden frecuentemente con tránsitos de Júpiter y del Sol en progresión.",
};

const INTROS_EN: Record<TopicId, string> = {
  dinero:
    "In the transit tradition (Robert Hand on Saturn and the 2nd and 8th houses; Venus transiting resource planets), the financial area reflects Jupiter's movement — which expands what it touches — and Saturn's — which consolidates or restricts. Transits to natal Venus and Jupiter reveal cycles of abundance, expenditure, or restructuring. When Pluto or Uranus aspect Venus, values and income sources can transform profoundly.",
  amor:
    "For Howard Sasportas ('The Gods of Change'), Venus and Mars are the axes of desire and attraction; their transits define cycles of relational opening and closing. Jupiter transiting natal Venus is one of the most favorable periods for love and commitment. Saturn to Venus demands authenticity; Neptune can idealize or dissolve. Transits to the Descendant and the 7th house mark crucial phases of encounter and separation.",
  carrera:
    "Saturn transiting the MC (Midheaven) is the professional milestone par excellence: every 29 years it marks the zenith and the beginning of a new vocational cycle (Stephen Arroyo). Jupiter over the MC brings recognition and opportunities; Pluto transforms the career from the root. Planets transiting the 10th house and aspecting the MC and natal Saturn structure periods of ascent, consolidation, and professional renewal.",
  hogar:
    "The natal Moon and the 4th house are the axes of home, family, and emotional past in astrological tradition (Howard Sasportas). Saturn transiting the Moon brings family responsibilities or the need for emotional maturation. Jupiter over the Moon expands the home and nurtures family relationships. Pluto over the Moon can heal old wounds or precipitate radical changes in family structure.",
  mente:
    "Natal Mercury and the 3rd house govern communication, learning, and contracts. In the transit tradition (Robert Hand), slow planets over Mercury transform the way one thinks and communicates: Saturn demands precision and rigor; Uranus brings brilliance and impulsiveness; Neptune dissolves the boundaries of ordinary thought and opens intuition. Jupiter transits to Mercury favor study, short travel, and agreements.",
  crecimiento:
    "Jupiter, Neptune, and the lunar nodes are the great agents of philosophical and spiritual growth in the chart (Stephen Arroyo, 'Astrology, Karma & Transformation'). Jupiter's cycles over itself and over natal planets mark openings of consciousness and expansions of horizon. Saturn transits to Jupiter demand that growth be grounded in reality. Pluto transforms the world view and Neptune dissolves the boundaries of the ego, bringing the individual closer to the transpersonal.",
  energia:
    "Natal Mars and the Sun represent vitality, initiative, and courage (Robert Hand, 'Planets in Transit'). Mars transits activate periods of direct action, though brief and intense. Pluto over the Sun transforms identity and willpower; Uranus frees it from old structures. Saturn over the Sun demands discipline and authenticity in the exercise of one's own energy. Periods of greatest vitality frequently coincide with Jupiter transits and progressed Sun movements.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Filter current_transits by topic, sort by score desc, return top 12.
 */
export function selectTopicTransits(
  currentTransits: TransitEvent[],
  topicId: TopicId,
  lang: "es" | "en"
): TopicTransitItem[] {
  const matched = currentTransits
    .filter((t) => transitMatchesTopic(t, topicId, lang))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return matched.map((transit) => {
    const interp = getInterpretationByComponents(
      transit.transit_planet,
      transit.aspect_name,
      transit.natal_planet,
      lang
    );

    return {
      transit,
      title: interp?.title ?? `${transit.transit_planet} ${transit.aspect_name} ${transit.natal_planet}`,
      summary: interp?.summary ?? "",
      detailed: interp?.detailed ?? "",
      advice: interp?.advice ?? "",
      life_areas: interp?.life_areas ?? [],
    };
  });
}

/**
 * Compute outlook from transits weighted by score.
 * - constructivo: +1 per score unit
 * - desafiante:   -1 per score unit
 * - transformador: +0.5 per score unit
 * - expansivo: 0
 */
export function topicOutlook(transits: TopicTransitItem[]): OutlookLabel {
  if (transits.length === 0) return "mixto";

  const interps = transits.map((item) =>
    getInterpretationByComponents(
      item.transit.transit_planet,
      item.transit.aspect_name,
      item.transit.natal_planet,
      "es"
    )
  );

  let totalPositive = 0;
  let totalNegative = 0;

  for (let i = 0; i < transits.length; i++) {
    const interp = interps[i];
    const score = transits[i].transit.score;
    const nature = interp?.nature ?? "expansivo";

    if (nature === "constructivo") {
      totalPositive += score;
    } else if (nature === "desafiante") {
      totalNegative += score;
    } else if (nature === "transformador") {
      totalPositive += score * 0.5;
    }
    // expansivo contributes 0
  }

  if (totalNegative === 0 && totalPositive === 0) return "mixto";
  if (totalNegative === 0) return "favorable";

  const ratio = totalPositive / totalNegative;
  if (ratio > 1.5) return "favorable";
  if (ratio < 0.5) return "exigente";
  return "mixto";
}

/**
 * Generate a full TopicSummaryResult for the given topic.
 */
export function generateTopicSummary(
  currentTransits: TransitEvent[],
  topicId: TopicId,
  _year: number,
  lang: "es" | "en"
): TopicSummaryResult {
  const intro = lang === "en" ? INTROS_EN[topicId] : INTROS_ES[topicId];
  const transits = selectTopicTransits(currentTransits, topicId, lang);
  const isEmpty = transits.length === 0;

  const outlook = topicOutlook(transits);

  const outlookMap: Record<OutlookLabel, { es: string; en: string }> = {
    favorable: { es: "favorable",  en: "favorable" },
    mixto:     { es: "mixto",      en: "mixed" },
    exigente:  { es: "exigente",   en: "demanding" },
  };
  const outlookLabel = outlookMap[outlook][lang];

  const emptyMessage =
    lang === "en"
      ? "No major transits in this area this year: a stable period, ideal for consolidating what has been built."
      : "Sin tránsitos mayores en esta área este año: período estable, ideal para consolidar lo construido.";

  // Ensure the topic exists (type safety)
  const topicExists = TOPICS.find((t) => t.id === topicId);
  if (!topicExists) {
    return {
      intro,
      transits: [],
      outlook: "mixto",
      outlookLabel: outlookMap["mixto"][lang],
      isEmpty: true,
      emptyMessage,
    };
  }

  return {
    intro,
    transits,
    outlook,
    outlookLabel,
    isEmpty,
    emptyMessage,
  };
}
