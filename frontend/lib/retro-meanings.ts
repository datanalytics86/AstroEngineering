/**
 * Mini-corpus bilingüe (ES/EN) de significados de retrogradación para los
 * planetas "rápidos" (Mercurio, Venus, Marte). Estos tres no se escanean como
 * aspectos en la cronología anual (son demasiado fugaces para una vista de
 * 12 meses), pero sus PERÍODOS retrógrados sí se muestran como bandas —
 * de ahí esta interpretación breve y arquetípica, sin predicciones fatalistas.
 * Sigue el mismo patrón de getter + `lang` que `interpretation-engine.ts`.
 */

export type Lang = "es" | "en";

interface Bilingual {
  es: string;
  en: string;
}

export interface RetroMeaning {
  title: string;
  meaning: string;
  advice: string;
}

interface RetroEntry {
  title: Bilingual;
  meaning: Bilingual;
  advice: Bilingual;
}

const RETRO_MEANINGS: Record<string, RetroEntry> = {
  Mercurio: {
    title: { es: "Mercurio retrógrado", en: "Mercury retrograde" },
    meaning: {
      es: "Mercurio revisa la comunicación, los contratos y los acuerdos cotidianos: mensajes que se malinterpretan, papeles que reaparecen, viejas conversaciones que piden ser retomadas. No es un período para cerrar tratos nuevos a la ligera, sino para revisar, corregir y afinar lo que ya está en marcha.",
      en: "Mercury revisits communication, contracts and everyday agreements: messages get crossed, paperwork resurfaces, old conversations ask to be picked back up. It favors reviewing, correcting and refining what's already underway rather than rushing new deals.",
    },
    advice: {
      es: "Revisa dos veces antes de enviar, firmar o viajar; deja margen extra para imprevistos.",
      en: "Double-check before sending, signing or traveling; leave extra room for delays.",
    },
  },
  Venus: {
    title: { es: "Venus retrógrado", en: "Venus retrograde" },
    meaning: {
      es: "Venus vuelve sobre los vínculos y los valores: relaciones pasadas que reaparecen, preguntas sobre qué (o a quién) realmente valoras, gustos y finanzas que piden una revisión honesta. Es un buen momento para reconectar con lo genuino antes de comprometerte con algo nuevo.",
      en: "Venus revisits bonds and values: past relationships resurface, questions arise about what (or who) you truly value, tastes and finances ask for an honest review. It favors reconnecting with what's genuine before committing to something new.",
    },
    advice: {
      es: "Evita decisiones grandes de pareja, estética o dinero; usa el período para reevaluar, no para inaugurar.",
      en: "Avoid major decisions about relationships, aesthetics or money; use the period to reassess, not to launch something new.",
    },
  },
  Marte: {
    title: { es: "Marte retrógrado", en: "Mars retrograde" },
    meaning: {
      es: "Marte replantea la acción y el impulso: energía que antes fluía hacia afuera ahora se vuelve introspectiva, proyectos que pierden tracción, frustraciones que piden un cambio de estrategia en vez de más fuerza bruta. Es momento de redirigir el esfuerzo, no de forzarlo.",
      en: "Mars rethinks action and drive: energy that once flowed outward turns inward, projects lose traction, frustration calls for a change of strategy rather than more brute force. It's a time to redirect effort, not force it.",
    },
    advice: {
      es: "Pausa antes de reaccionar con enojo o de lanzar una ofensiva; canaliza la energía en revisar el plan.",
      en: "Pause before reacting in anger or launching an offensive; channel the energy into revising the plan instead.",
    },
  },
};

export function getRetroMeaning(planet: string, lang: Lang = "es"): RetroMeaning | undefined {
  const entry = RETRO_MEANINGS[planet];
  if (!entry) return undefined;
  return {
    title: entry.title[lang],
    meaning: entry.meaning[lang],
    advice: entry.advice[lang],
  };
}
