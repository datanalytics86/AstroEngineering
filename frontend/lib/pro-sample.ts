/**
 * Carta ficticia para el PDF / modal de enganche Pro.
 * No llama API. Textos en voz humana + TIER1 de ejemplo.
 */

export interface ProSampleTier1 {
  left: string;
  aspect: string;
  symbol: string;
  right: string;
  orb: string;
  impact: string;
}

export interface ProSampleMonth {
  label: string;
  value: number;
}

export interface ProSampleArea {
  title: string;
  line: string;
}

export interface ProSampleContent {
  lang: "es" | "en";
  name: string;
  meta: string;
  coverKicker: string;
  coverTitle: string;
  coverLead: string;
  whoTitle: string;
  headline: string;
  identity: string;
  emotion: string;
  purpose: string;
  tier1Title: string;
  tier1: ProSampleTier1[];
  yearTitle: string;
  yearReading: string;
  months: ProSampleMonth[];
  areasTitle: string;
  areas: ProSampleArea[];
  note: string;
  ctaKicker: string;
  ctaHeadline: string;
  ctaBody: string;
  ctaButton: string;
  ctaUrl: string;
  footer: string;
}

const SAMPLE_CTA = "https://astro-engineering.vercel.app/nueva?from=pro_sample_pdf";

export function getProSampleContent(lang: "es" | "en" = "es"): ProSampleContent {
  if (lang === "en") {
    return {
      lang,
      name: "Alex Rivera",
      meta: "March 14, 1991 · 08:12 · Valparaíso, Chile",
      coverKicker: "A sample of AstroEngine Pro",
      coverTitle: "This is what Pro looks like",
      coverLead:
        "A clear reading of who you are, the pieces that weigh most, and the pulse of the year. This example is fictional. Your Pro uses your sky.",
      whoTitle: "Who you are",
      headline: "A presence that is direct and without theater, with an inner climate that is protective",
      identity:
        "You recognize yourself when you start before fear gets a vote. That light shows most clearly in your vocation and your name in the world.",
      emotion:
        "Inside, you need emotional safety. There is room to rest when private life is tended — not postponed.",
      purpose:
        "The world tends to recognize a mark that is serious and long-game. Purpose holds when you leave work that stands.",
      tier1Title: "What marks you most",
      tier1: [
        { left: "Sun", aspect: "Trine", symbol: "△", right: "Jupiter", orb: "0.31°", impact: "Your identity and how you grow flow naturally: this is a talent you already have — use it on purpose." },
        { left: "Venus", aspect: "Conjunction", symbol: "☌", right: "Mars", orb: "0.48°", impact: "How you love and how you act travel together and intensify: this is one of your clearest signatures." },
        { left: "Moon", aspect: "Square", symbol: "□", right: "Saturn", orb: "0.72°", impact: "Your emotional world and how you build rub and ask for practice — the friction is the classroom." },
        { left: "Mercury", aspect: "Sextile", symbol: "⚹", right: "Uranus", orb: "0.89°", impact: "How you think and your need for freedom support each other if you take the first step." },
        { left: "Mars", aspect: "Trine", symbol: "△", right: "Pluto", orb: "1.05°", impact: "How you act and your capacity to transform already know how to work together." },
      ],
      yearTitle: "The pulse of the year (example)",
      yearReading:
        "March is the loudest month of the year. Leave margin around March and October. That is a window of pressure and opening — do not fill the calendar to the brim. July is better for integrating.",
      months: [
        { label: "Jan", value: 3.2 }, { label: "Feb", value: 4.1 }, { label: "Mar", value: 8.6 },
        { label: "Apr", value: 5.4 }, { label: "May", value: 4.0 }, { label: "Jun", value: 3.6 },
        { label: "Jul", value: 2.8 }, { label: "Aug", value: 4.7 }, { label: "Sep", value: 5.9 },
        { label: "Oct", value: 7.4 }, { label: "Nov", value: 4.5 }, { label: "Dec", value: 3.1 },
      ],
      areasTitle: "This year, by area",
      areas: [
        { title: "Love", line: "March: how you love asks for practice." },
        { title: "Money", line: "October: how you grow opens a window." },
        { title: "Work", line: "April: your identity opens a window." },
        { title: "Growth", line: "November: your next chapter asks for practice." },
      ],
      note: "This is an example. Your Pro is calculated from your real chart — not from a template.",
      ctaKicker: "Your turn",
      ctaHeadline: "Calculate your real chart",
      ctaBody: "Six free areas in clear language. Pro adds the pulse of your year and the pieces that weigh most.",
      ctaButton: "Calculate my chart →",
      ctaUrl: SAMPLE_CTA,
      footer: "AstroEngine · sample Pro document · not your personal chart",
    };
  }

  return {
    lang,
    name: "Alex Rivera",
    meta: "14 de marzo de 1991 · 08:12 · Valparaíso, Chile",
    coverKicker: "Así se ve AstroEngine Pro",
    coverTitle: "Un ejemplo de la versión completa",
    coverLead:
      "Quién eres en claro, qué pesa en tu mapa y qué meses aprietan. Esto es ficticio. Tu Pro usa tu cielo.",
    whoTitle: "Quién eres",
    headline: "Una presencia directa y sin rodeos, con un clima interno protector",
    identity:
      "Te reconoces cuando empiezas antes de que el miedo hable. Esa luz se nota sobre todo en tu vocación y tu nombre en el mundo.",
    emotion:
      "Por dentro necesitas seguridad emocional. Hay calma para descansar cuando la vida privada se cuida — no se posterga.",
    purpose:
      "El mundo tiende a reconocerte por una marca seria y de largo aliento. El propósito se sostiene cuando dejas una obra que se aguante.",
    tier1Title: "Lo que más te marca",
    tier1: [
      { left: "Sol", aspect: "Trígono", symbol: "△", right: "Júpiter", orb: "0.31°", impact: "Tu identidad y tu forma de crecer fluyen con naturalidad: este es un talento que ya tienes, úsalo a propósito." },
      { left: "Venus", aspect: "Conjunción", symbol: "☌", right: "Marte", orb: "0.48°", impact: "Tu forma de amar y tu forma de actuar van juntas y se intensifican: es una de tus firmas más claras." },
      { left: "Luna", aspect: "Cuadratura", symbol: "□", right: "Saturno", orb: "0.72°", impact: "Tu mundo emocional y tu forma de construir se rozan y piden práctica — la fricción es el aula." },
      { left: "Mercurio", aspect: "Sextil", symbol: "⚹", right: "Urano", orb: "0.89°", impact: "Tu forma de pensar y tu necesidad de libertad se apoyan si das el primer paso." },
      { left: "Marte", aspect: "Trígono", symbol: "△", right: "Plutón", orb: "1.05°", impact: "Tu forma de actuar y tu capacidad de transformarte ya saben trabajar juntas." },
    ],
    yearTitle: "El pulso del año (ejemplo)",
    yearReading:
      "Marzo es el mes más cargado del año. Deja margen alrededor de marzo y octubre. Es una ventana de presión y de apertura: no llenes el calendario hasta el borde. Julio sirve mejor para integrar.",
    months: [
      { label: "Ene", value: 3.2 }, { label: "Feb", value: 4.1 }, { label: "Mar", value: 8.6 },
      { label: "Abr", value: 5.4 }, { label: "May", value: 4.0 }, { label: "Jun", value: 3.6 },
      { label: "Jul", value: 2.8 }, { label: "Ago", value: 4.7 }, { label: "Sep", value: 5.9 },
      { label: "Oct", value: 7.4 }, { label: "Nov", value: 4.5 }, { label: "Dic", value: 3.1 },
    ],
    areasTitle: "Este año, por área",
    areas: [
      { title: "Amor", line: "Marzo: tu forma de amar pide práctica." },
      { title: "Dinero", line: "Octubre: tu forma de crecer abre una ventana." },
      { title: "Trabajo", line: "Abril: tu identidad abre una ventana." },
      { title: "Crecimiento", line: "Noviembre: tu próximo capítulo pide práctica." },
    ],
    note: "Esto es un ejemplo. Tu Pro se calcula con tu carta real — no con una plantilla.",
    ctaKicker: "Tu turno",
    ctaHeadline: "Calcula tu carta real",
    ctaBody: "Seis áreas gratis, en lenguaje claro. Pro añade el pulso de tu año y las piezas que más pesan.",
    ctaButton: "Calcular mi carta →",
    ctaUrl: SAMPLE_CTA,
    footer: "AstroEngine · documento de ejemplo Pro · no es tu carta personal",
  };
}
