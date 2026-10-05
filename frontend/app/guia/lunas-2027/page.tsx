import type { Metadata } from "next";
import Link from "next/link";
import { extractLunations, fetchCalendarYear, lunationCopy } from "@/lib/seo/calendar-guides";

export const dynamic = "force-dynamic";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Lunas nuevas y llenas 2027",
  description: "Lunaciones de 2027 desde el calendario de efemérides. Clima simbólico, no predicción.",
};

export default async function Lunas2027Page() {
  const months = await fetchCalendarYear(2027);
  const hits = extractLunations(months);
  return (
    <article className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <p className="text-xs uppercase tracking-widest text-accent">Guía 2027</p>
      <h1 className="font-display text-3xl text-ink">Lunas nuevas y llenas 2027</h1>
      <p className="text-ink-2 leading-relaxed">
        Fechas del calendario de efemérides. Cada fase es un clima simbólico: semilla (nueva) o culminación (llena).
        Tú decides qué haces con ella.
      </p>
      {hits.length === 0 ? (
        <p className="text-ink-3 text-sm">
          Las fechas salen del calendario de efemérides. Si el cálculo no está disponible ahora, vuelve en unos
          minutos. No inventamos días.
        </p>
      ) : (
        <ul className="space-y-3">
          {hits.map((h) => {
            const c = lunationCopy(h.phase, "es");
            return (
              <li key={`${h.date}-${h.phase}`} className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-widest text-accent">
                  {h.date}
                  {h.sign ? ` · ${h.sign}` : ""}
                </p>
                <h2 className="font-medium text-ink mt-1">{c.title}</h2>
                <p className="text-sm text-ink-2 mt-1">{c.text}</p>
              </li>
            );
          })}
        </ul>
      )}
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
