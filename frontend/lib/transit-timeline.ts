/**
 * Constantes y helpers compartidos entre `components/TransitYearTimeline.tsx`
 * (la cronología SVG) y `app/transitos/[id]/page.tsx` (chips de zoom, panel de
 * detalle): símbolos de planeta/aspecto, orden lento→rápido de la fila "Todos",
 * el sentinel de zoom sobre retrogradaciones y los constructores de la key de
 * selección/interpretación. Viven en `lib/` (y no en el componente) porque los
 * consume tanto la página como el componente de gráfico.
 */

import type { TransitEvent, RetroPeriod } from "./types";

// Chip especial: zoom sobre TODAS las bandas retrógradas (no un planeta).
export const RETRO_FILTER = "__retro__";

// Orden lento → rápido (Sasportas, Forrest): los planetas lentos marcan los temas.
export const ROW_ORDER = ["Plutón", "Neptuno", "Urano", "Saturno", "Júpiter", "Marte"];

export const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  "Júpiter": "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", "Quirón": "⚷", Ascendente: "ASC", MC: "MC",
};

export const ASPECT_SYMBOLS: Record<string, string> = {
  "Conjunción": "☌", "Oposición": "☍", "Cuadratura": "□",
  "Trígono": "△", "Sextil": "⚹", "Quincuncio": "⚻",
  "Sesquicuadratura": "⚼", "Semi-sextil": "⚺",
};

const RETRO_KEY_PREFIX = "retro_";

// Key de selección de un evento en la cronología: "{transitante}_{aspecto}_{natal}_{enters_orb}".
// Incluye `enters_orb` porque `consolidate_transits()` en el backend puede producir
// dos eventos con el mismo (transitante, aspecto, natal) cuando el hueco entre
// pasadas retrógradas supera `max_gap` (ver backend/astro/transits.py) — sin la
// fecha de inicio ambos compartirían key y la selección/lookup sería ambigua.
export function transitEventKey(
  t: Pick<TransitEvent, "transit_planet" | "aspect_name" | "natal_planet" | "enters_orb">
): string {
  return `${t.transit_planet}_${t.aspect_name}_${t.natal_planet}_${t.enters_orb}`;
}

// Key de selección de una banda retrógrada: "retro_{planeta}_{fecha de estación}".
export function retroPeriodKey(p: Pick<RetroPeriod, "planet" | "start_date">): string {
  return `${RETRO_KEY_PREFIX}${p.planet}_${p.start_date}`;
}

// Predicado compartido para distinguir una key de banda retrógrada de una key de
// evento de tránsito, sin que los consumidores tengan que conocer el prefijo.
export function isRetroKey(key: string): boolean {
  return key.startsWith(RETRO_KEY_PREFIX);
}
