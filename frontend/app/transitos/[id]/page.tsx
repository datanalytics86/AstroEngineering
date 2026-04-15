"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { TransitResponse, ChartResponse } from "@/lib/types";
import { loadTransits, loadChart } from "@/lib/storage";
import TransitTimeline from "@/components/TransitTimeline";
import ForecastDashboard from "@/components/ForecastDashboard";
import { IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { getInterpretationByComponents } from "@/lib/interpretation-engine";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", Quirón: "⚷",
};

const ASPECT_SYMBOLS: Record<string, string> = {
  Conjunción: "☌", Oposición: "☍", Cuadratura: "□",
  Trígono: "△", Sextil: "⚹", Quincuncio: "⚻",
  Sesquicuadratura: "⚼", "Semi-sextil": "⚺",
};

function tierStyle(nature: string): { gradient: string; color: string } {
  if (nature === "armonioso") return { gradient: "from-emerald-50 to-green-50 border-emerald-200",  color: "#10B981" };
  if (nature === "tenso")     return { gradient: "from-red-50 to-rose-50 border-red-200",           color: "#EF4444" };
  return                             { gradient: "from-violet-50 to-purple-50 border-violet-200",   color: "#7C3AED" };
}

export default function TransitosPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [transits, setTransits] = useState<TransitResponse | null>(null);
  const [chart, setChart]       = useState<ChartResponse | null>(null);

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

  const today   = new Date().toISOString().slice(0, 10);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const endDate = nextYear.toISOString().slice(0, 10);

  // Próximos 6 eventos críticos/altos con fecha exacta
  const keyEvents = transits.current_transits
    .filter((t) => (t.importance === "crítica" || t.importance === "alta") && t.exact_date)
    .sort((a, b) => (a.exact_date ?? "").localeCompare(b.exact_date ?? ""))
    .slice(0, 6);

  // Top 4 tránsitos del año por score — Tier 1
  const tier1 = [...transits.current_transits]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const peakMonth = [...transits.timeline].sort((a, b) => b.intensity_score - a.intensity_score)[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">Tu año astrológico</h1>
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

      {/* Hero stats */}
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
            )}.
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
                    <span className="text-slate-400 mx-1">{ASPECT_SYMBOLS[t.aspect_name] ?? t.aspect_name}</span>
                    <span>{t.natal_planet} natal</span>
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wide shrink-0" style={{ color: importColor }}>
                    {t.importance}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tránsitos Tier 1 — los 4 de mayor peso del año ────────────────────── */}
      {tier1.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg text-slate-800 mb-1">Tránsitos principales del año</h2>
          <p className="text-xs text-slate-400 font-mono mb-4">
            Los 4 tránsitos de mayor impacto según scoring astral (Sasportas · Forrest · Arroyo)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tier1.map((t, i) => {
              const { gradient, color } = tierStyle(t.nature);
              const interp = getInterpretationByComponents(t.transit_planet, t.aspect_name, t.natal_planet);
              const exactStr = t.exact_date
                ? format(new Date(t.exact_date.slice(0, 10)), "d MMM yyyy", { locale: es })
                : null;
              const importColor = IMPORTANCE_COLORS[t.importance] ?? "#94A3B8";
              const planetSym = PLANET_SYMBOLS[t.transit_planet] ?? "";
              const aspectSym = ASPECT_SYMBOLS[t.aspect_name] ?? t.aspect_name;

              return (
                <div
                  key={i}
                  className={`rounded-2xl border bg-gradient-to-br ${gradient} p-5 flex flex-col gap-3`}
                >
                  {/* Planet + aspect */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono leading-none" style={{ color }}>
                        {planetSym}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 font-mono leading-tight">
                          {t.transit_planet}{" "}
                          <span style={{ color }}>{aspectSym}</span>{" "}
                          {t.natal_planet} natal
                        </p>
                        {exactStr && (
                          <p className="text-xs text-slate-500 font-mono mt-0.5">Exacto: {exactStr}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-xs font-mono uppercase tracking-wider border rounded px-2 py-0.5 shrink-0"
                      style={{ color: importColor, borderColor: `${importColor}55`, backgroundColor: `${importColor}10` }}
                    >
                      {t.importance}
                    </span>
                  </div>

                  {/* Interpretation summary */}
                  {interp ? (
                    <p className="text-xs text-slate-700 leading-relaxed">{interp.summary}</p>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {t.transit_planet} {t.aspect_name.toLowerCase()} {t.natal_planet} natal
                      — orbe {t.orb.toFixed(1)}°
                    </p>
                  )}

                  {/* Duration bar */}
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>{t.enters_orb}</span>
                    <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: `${color}40` }} />
                    <span>{t.leaves_orb}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pronóstico mensual — tarjetas clicables */}
      <section>
        <h2 className="font-semibold text-lg text-slate-800 mb-1">Pronóstico mes a mes</h2>
        <p className="text-xs text-slate-400 font-mono mb-4">
          Haz clic en un mes para ver el detalle e interpretación completa
        </p>
        <ForecastDashboard
          timeline={transits.timeline}
          natalPlanets={chart.planets}
        />
      </section>

      {/* Vista temporal Gantt */}
      <section>
        <h2 className="font-semibold text-lg text-slate-800 mb-4">Vista temporal</h2>
        <TransitTimeline
          transits={transits.current_transits}
          startDate={today}
          endDate={endDate}
        />
      </section>

    </div>
  );
}
