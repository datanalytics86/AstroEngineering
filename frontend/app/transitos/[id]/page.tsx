"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { TransitResponse, ChartResponse } from "@/lib/types";
import { loadTransits, loadChart } from "@/lib/storage";
import TransitTimeline from "@/components/TransitTimeline";
import ForecastDashboard from "@/components/ForecastDashboard";
import InterpretationCard from "@/components/InterpretationCard";
import { IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TransitosPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [transits, setTransits] = useState<TransitResponse | null>(null);
  const [chart, setChart] = useState<ChartResponse | null>(null);

  useEffect(() => {
    if (!id) { router.push("/"); return; }
    const t = loadTransits(id);
    const c = loadChart(id);
    if (!t || !c) { router.push("/"); return; }
    setTransits(t);
    setChart(c.chart);
  }, [id, router]);

  if (!transits || !chart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">Cargando tránsitos…</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const endDate = nextYear.toISOString().slice(0, 10);

  // Upcoming key events (critical + high, sorted by exact date)
  const keyEvents = transits.current_transits
    .filter((t) => (t.importance === "crítica" || t.importance === "alta") && t.exact_date)
    .sort((a, b) => (a.exact_date ?? "").localeCompare(b.exact_date ?? ""))
    .slice(0, 6);

  // Most significant transits for list
  const significantTransits = transits.current_transits
    .filter((t) => t.importance !== "baja")
    .sort((a, b) => b.score - a.score);

  // Dominant theme for the year
  const peakMonth = [...transits.timeline].sort((a, b) => b.intensity_score - a.intensity_score)[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">
            Tu año astrológico
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-1">
            {chart.name} · {today} → {endDate}
          </p>
        </div>
        <button
          onClick={() => router.push(`/carta/${id}`)}
          className="border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors font-mono"
        >
          ← Carta Natal
        </button>
      </div>

      {/* Hero narrative card */}
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Tránsitos activos",  value: transits.current_transits.length },
            { label: "Alta importancia",   value: transits.current_transits.filter(t => t.importance === "crítica" || t.importance === "alta").length },
            { label: "Fechas exactas",     value: transits.exact_aspects_calendar.length },
            { label: "Meses analizados",   value: transits.timeline.length },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-blue-600 font-mono">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        {peakMonth && (
          <p className="text-sm text-slate-600 leading-relaxed">
            El mes de mayor intensidad será{" "}
            <span className="font-semibold text-slate-800">
              {format(new Date(`${peakMonth.month}-01`), "MMMM yyyy", { locale: es })}
            </span>
            {peakMonth.dominant_theme && (
              <>, con énfasis en <span className="italic">{peakMonth.dominant_theme}</span></>
            )}
            .
          </p>
        )}
      </div>

      {/* Próximos eventos clave */}
      {keyEvents.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg text-slate-800 mb-4">Próximos eventos clave</h2>
          <div className="space-y-2">
            {keyEvents.map((t, i) => {
              const importColor = IMPORTANCE_COLORS[t.importance] ?? "#94A3B8";
              const exactStr = t.exact_date
                ? format(new Date(t.exact_date.slice(0, 10)), "d MMM yyyy", { locale: es })
                : "";
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-3 shadow-card"
                >
                  <div
                    className="text-xs font-mono font-semibold w-20 shrink-0 text-center py-0.5 rounded"
                    style={{ color: importColor, backgroundColor: `${importColor}15` }}
                  >
                    {exactStr}
                  </div>
                  <div className="flex-1 text-sm text-slate-700 font-mono">
                    <span className="font-semibold">{t.transit_planet}</span>
                    <span className="text-slate-400 mx-1">{t.aspect_name}</span>
                    <span>{t.natal_planet} natal</span>
                  </div>
                  <span
                    className="text-xs font-mono uppercase tracking-wide shrink-0"
                    style={{ color: importColor }}
                  >
                    {t.importance}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pronóstico mensual */}
      <section>
        <h2 className="font-semibold text-lg text-slate-800 mb-4">Pronóstico mes a mes</h2>
        <ForecastDashboard timeline={transits.timeline} />
      </section>

      {/* Gantt timeline */}
      <section>
        <h2 className="font-semibold text-lg text-slate-800 mb-4">Vista temporal</h2>
        <TransitTimeline
          transits={transits.current_transits}
          startDate={today}
          endDate={endDate}
        />
      </section>

      {/* Lista detallada */}
      {significantTransits.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg text-slate-800 mb-4">
            Tránsitos destacados
            <span className="ml-2 text-sm font-normal text-slate-400">
              ({significantTransits.length})
            </span>
          </h2>
          <div className="space-y-4">
            {significantTransits.map((t, i) => (
              <InterpretationCard key={i} transit={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
