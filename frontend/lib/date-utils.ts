/**
 * Utilidades de fecha compartidas entre los módulos de geopolítica y
 * tránsitos, ambos trabajando con fechas "YYYY-MM-DD" que deben leerse
 * como fecha LOCAL (no UTC medianoche) para no desfasar el día en
 * zonas horarias al oeste de UTC.
 */

// Parsea "YYYY-MM-DD" como fecha LOCAL. `new Date("2026-02-20")` se interpreta
// como medianoche UTC y, en zonas al oeste de UTC, se muestra el día anterior.
// Al descomponer los campos evitamos el desfase de zona horaria.
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
