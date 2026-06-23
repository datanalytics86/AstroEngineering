// 7 life topics with taxonomy + mapping from engine life_areas → topic ids

import type { TransitEvent } from "@/lib/types";
import { getInterpretationByComponents } from "@/lib/interpretation-engine";

export type TopicId = "dinero" | "amor" | "carrera" | "hogar" | "mente" | "crecimiento" | "energia";

export interface Topic {
  id: TopicId;
  labelEs: string;
  labelEn: string;
  icon: string;
  color: string; // hex
}

export const TOPICS: Topic[] = [
  { id: "dinero",      labelEs: "Dinero",      labelEn: "Money",       icon: "💰", color: "#16A34A" },
  { id: "amor",        labelEs: "Amor",         labelEn: "Love",        icon: "❤️", color: "#DC2626" },
  { id: "carrera",     labelEs: "Carrera",      labelEn: "Career",      icon: "💼", color: "#D97706" },
  { id: "hogar",       labelEs: "Hogar",        labelEn: "Home",        icon: "🏠", color: "#2563EB" },
  { id: "mente",       labelEs: "Mente",        labelEn: "Mind",        icon: "🧠", color: "#7C3AED" },
  { id: "crecimiento", labelEs: "Crecimiento",  labelEn: "Growth",      icon: "🌱", color: "#059669" },
  { id: "energia",     labelEs: "Energía",      labelEn: "Energy",      icon: "⚡", color: "#EA580C" },
];

// Mapping from life-area strings (both ES and EN variants) to topic IDs
export const AREA_TO_TOPICS: Record<string, TopicId[]> = {
  // dinero
  "dinero":     ["dinero"],
  "money":      ["dinero"],
  "recursos":   ["dinero"],
  "resources":  ["dinero"],
  "finanzas":   ["dinero"],
  "finances":   ["dinero"],

  // amor
  "amor":           ["amor"],
  "love":           ["amor"],
  "relaciones":     ["amor"],
  "relationships":  ["amor"],
  "socios":         ["amor"],
  "partners":       ["amor"],
  "belleza":        ["amor"],
  "beauty":         ["amor"],
  "sexualidad":     ["amor"],
  "sexuality":      ["amor"],
  "pareja":         ["amor"],
  "partner":        ["amor"],
  "compromisos":    ["amor"],
  "commitments":    ["amor"],
  "ilusiones":      ["amor"],
  "illusions":      ["amor"],

  // carrera
  "carrera":        ["carrera"],
  "career":         ["carrera"],
  "vocación":       ["carrera"],
  "vocation":       ["carrera"],
  "reputación":     ["carrera"],
  "reputation":     ["carrera"],
  "logros":         ["carrera"],
  "achievement":    ["carrera"],
  "autoridad":      ["carrera"],
  "authority":      ["carrera"],
  "trabajo":        ["carrera"],
  "work":           ["carrera"],
  "ambición":       ["carrera"],
  "ambition":       ["carrera"],
  "reconocimiento": ["carrera"],
  "recognition":    ["carrera"],
  "visibilidad":    ["carrera"],
  "visibility":     ["carrera"],

  // hogar
  "hogar":          ["hogar"],
  "home":           ["hogar"],
  "familia":        ["hogar"],
  "family":         ["hogar"],
  "emociones":      ["hogar"],
  "emotions":       ["hogar"],
  "subconsciente":  ["hogar"],
  "subconscious":   ["hogar"],
  "instintos":      ["hogar"],
  "instincts":      ["hogar"],
  "hábitos":        ["hogar"],
  "habits":         ["hogar"],

  // mente
  "comunicación":   ["mente"],
  "communication":  ["mente"],
  "aprendizaje":    ["mente"],
  "learning":       ["mente"],
  "contratos":      ["mente"],
  "contracts":      ["mente"],
  "pensamiento":    ["mente"],
  "thinking":       ["mente"],
  "planificación":  ["mente"],
  "planning":       ["mente"],
  "creatividad":    ["mente"],
  "creativity":     ["mente"],
  "imaginación":    ["mente"],
  "imagination":    ["mente"],
  "perspectiva":    ["mente"],
  "perspective":    ["mente"],

  // crecimiento
  "crecimiento":        ["crecimiento"],
  "growth":             ["crecimiento"],
  "expansión":          ["crecimiento"],
  "expansion":          ["crecimiento"],
  "filosofía":          ["crecimiento"],
  "philosophy":         ["crecimiento"],
  "espiritualidad":     ["crecimiento"],
  "spirituality":       ["crecimiento"],
  "fe":                 ["crecimiento"],
  "faith":              ["crecimiento"],
  "propósito":          ["crecimiento"],
  "purpose":            ["crecimiento"],
  "ideales":            ["crecimiento"],
  "ideals":             ["crecimiento"],
  "transformación":     ["crecimiento"],
  "transformation":     ["crecimiento"],
  "poder":              ["crecimiento"],
  "power":              ["crecimiento"],
  "sombra":             ["crecimiento"],
  "shadow":             ["crecimiento"],
  "destino":            ["crecimiento"],
  "destiny":            ["crecimiento"],
  "sanación":           ["crecimiento"],
  "healing":            ["crecimiento"],
  "propósito kármico":  ["crecimiento"],
  "karmic purpose":     ["crecimiento"],
  "compasión":          ["crecimiento"],
  "compassion":         ["crecimiento"],
  "madurez":            ["crecimiento"],
  "maturity":           ["crecimiento"],
  "karma":              ["crecimiento"],

  // energia
  "energía":    ["energia"],
  "energy":     ["energia"],
  "salud":      ["energia"],
  "health":     ["energia"],
  "acción":     ["energia"],
  "action":     ["energia"],
  "coraje":     ["energia"],
  "courage":    ["energia"],
  "conflictos": ["energia"],
  "conflict":   ["energia"],
  "identidad":  ["energia"],
  "identity":   ["energia"],
  "vitalidad":  ["energia"],
  "vitality":   ["energia"],
  "libertad":   ["energia"],
  "freedom":    ["energia"],
  "innovación": ["energia"],
  "innovation": ["energia"],
  "revolución": ["energia"],
  "revolution": ["energia"],
};

/**
 * Returns the topic IDs associated with a transit by looking up the
 * interpretation's life_areas and mapping them to topics.
 */
export function topicsForTransit(transit: TransitEvent, lang: "es" | "en"): TopicId[] {
  const interp = getInterpretationByComponents(
    transit.transit_planet,
    transit.aspect_name,
    transit.natal_planet,
    lang
  );

  if (!interp) return [];

  const topicSet = new Set<TopicId>();
  for (const area of interp.life_areas) {
    const mapped = AREA_TO_TOPICS[area.toLowerCase()];
    if (mapped) {
      for (const t of mapped) {
        topicSet.add(t);
      }
    }
  }

  return Array.from(topicSet);
}

/**
 * Returns true if the transit is associated with the given topic.
 */
export function transitMatchesTopic(
  transit: TransitEvent,
  topicId: TopicId,
  lang: "es" | "en"
): boolean {
  return topicsForTransit(transit, lang).includes(topicId);
}
