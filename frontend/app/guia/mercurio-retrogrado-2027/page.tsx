import type { Metadata } from "next";
import Link from "next/link";
import {
  extractMercuryStations,
  fetchCalendarYear,
  mercuryCopy,
  pairRetroPeriods,
} from "@/lib/seo/calendar-guides";

export const dynamic = "force-dynamic";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Mercurio retrógrado 2027",
  description: "Fechas de Mercurio retrógrado en 2027, calculadas con el calendario de efemérides. Clima de revisión, no predicción.",
};

export default async function Mercury2027Page() {
  const months = await fetchCalendarYear(2027);
  const periods = pairRetroPeriods(extractMercuryStations(months));
  const copy = mercuryCopy("es");
  return (
    <article className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <p className="text-xs uppercase tracking-widest text-accent">Guía 2027</p>
      <h1 className="font-display text-3xl text-ink">{copy.title}</h1>
      <p className="text-ink-2 leading-relaxed">{copy.meaning}</p>
      <p className="text-ink-2 leading-relaxed">{copy.advice}</p>
      <section className="space-y-3">
        <h2 className="font-medium text-ink">Fechas 2027</h2>
        {periods.length === 0 ? (
          <p className="text-ink-3 text-sm">
            Las fechas salen del calendario de efemérides. Si el cálculo no está disponible ahora, vuelve en unos
            minutos. No inventamos días.
          </p>
        ) : (
          <ul className="space-y-2 text-ink-2">
            {periods.map((p) => (
              <li key={p.start} className="rounded-lg border border-border bg-card p-3">
                {p.start}
                {p.end ? ` → ${p.end}` : " → (estación directa pendiente)"}
                {p.sign ? ` · ${p.sign}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-sm text-ink-3">
        Lectura analógica de clima. No es predicción de hechos ni consejo médico, psicológico, financiero o legal.
      </p>
      <p>
        <Link href="/nueva" className="text-accent underline">
          Ver mis 6 áreas →
        </Link>
      </p>
    </article>
  );
}
