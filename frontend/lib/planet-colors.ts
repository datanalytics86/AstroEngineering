/**
 * Paleta de cuerpos y aspectos — util neutro.
 * El core (tránsitos) no debe importar componentes de mundana.
 */

export const BODY_COLORS: Record<string, string> = {
  Plutón: "#7C3AED",
  Neptuno: "#3B82F6",
  Urano: "#06B6D4",
  Saturno: "#F59E0B",
  Júpiter: "#10B981",
  Marte: "#EF4444",
  Sol: "#F97316",
  Luna: "#64748B",
  Mercurio: "#6366F1",
  Venus: "#EC4899",
};

export const ASPECT_LINE_COLOR: Record<string, string> = {
  Conjunción: "#334155",
  Oposición: "#DC2626",
  Cuadratura: "#EA580C",
  Trígono: "#2563EB",
  Sextil: "#16A34A",
};

export const ASPECT_SYMBOL: Record<string, string> = {
  Conjunción: "☌",
  Oposición: "☍",
  Cuadratura: "□",
  Trígono: "△",
  Sextil: "⚹",
};

/** Acento de ingresos de signo (módulo mundano archivado). */
export const INGRESS_COLOR = "#4F46E5";
