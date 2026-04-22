"use client";

import type { TransitExecutiveSummary } from "@/lib/types";

interface Props {
  summary: TransitExecutiveSummary;
  name: string;
  subtitle?: string;
}

const INTENSITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  alta:  { color: "#EF4444", bg: "#FEF2F2", label: "Alta" },
  media: { color: "#F97316", bg: "#FFF7ED", label: "Media" },
  baja:  { color: "#10B981", bg: "#F0FDF4", label: "Baja" },
};

const PLANET_COLOR: Record<string, string> = {
  Plutón: "#7C3AED", Neptuno: "#3B82F6", Urano: "#06B6D4",
  Saturno: "#F59E0B", Júpiter: "#10B981",
  Marte: "#EF4444", Venus: "#EC4899", Mercurio: "#64748B",
};

export default function YearSummaryPanel({ summary, name, subtitle }: Props) {
  const dominantPlanet = summary.major_cycles[0]?.planet ?? "Saturno";
  const accentColor    = PLANET_COLOR[dominantPlanet] ?? "#6366F1";

  return (
    <div className="rounded-2xl border border-slate-200 shadow-card bg-white overflow-hidden flex flex-col"
      style={{ maxHeight: "calc(100vh - 5rem)" }}>

      {/* ── Header ── */}
      <div
        className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0"
        style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ color: accentColor }} className="text-base">✦</span>
          <h2 className="font-semibold text-sm text-slate-900 uppercase tracking-widest font-mono">
            Resumen ejecutivo
          </h2>
        </div>
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>
        )}
        <p className="text-sm mt-2 font-semibold leading-tight" style={{ color: accentColor }}>
          {summary.year_theme}
        </p>
        {summary.peak_month_label && (
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Mes cumbre · {summary.peak_month_label}
          </p>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">

        {/* Year overview */}
        <section>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-1.5">
            Panorama del año
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {summary.year_description}
          </p>
        </section>

        {/* Major cycles */}
        {summary.major_cycles.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Ciclos mayores
            </p>
            <div className="space-y-2">
              {summary.major_cycles.slice(0, 4).map((cycle, i) => {
                const color = PLANET_COLOR[cycle.planet] ?? "#94A3B8";
                return (
                  <div
                    key={i}
                    className="rounded-lg border overflow-hidden"
                    style={{ borderColor: `${color}35` }}
                  >
                    <div
                      className="px-3 py-2.5"
                      style={{ borderLeftWidth: 3, borderLeftColor: color }}
                    >
                      <p className="text-xs font-semibold text-slate-800 leading-tight mb-1">
                        {cycle.headline}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1.5">
                        <span className="truncate">{cycle.enters}</span>
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="truncate">{cycle.leaves}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {cycle.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quarterly narrative */}
        <section>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
            Por trimestre
          </p>
          <div className="space-y-2">
            {summary.quarters.map((q) => {
              const style = INTENSITY_STYLE[q.intensity] ?? INTENSITY_STYLE.media;
              return (
                <div key={q.quarter} className="rounded-lg border border-slate-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-slate-700">{q.quarter}</span>
                    <span className="text-xs font-mono text-slate-400 truncate flex-1">{q.months}</span>
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                      style={{ color: style.color, backgroundColor: style.bg }}
                    >
                      {style.label}
                    </span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                      {q.narrative}
                    </p>
                    {q.key_transit !== "—" && (
                      <p className="text-xs font-mono mt-1" style={{ color: accentColor }}>
                        {q.key_transit}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Opportunities */}
        {summary.opportunities.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#10B981" }}>
              Oportunidades
            </p>
            <ul className="space-y-1.5">
              {summary.opportunities.map((o, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Challenges */}
        {summary.challenges.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#EF4444" }}>
              Tensiones y crecimiento
            </p>
            <ul className="space-y-1.5">
              {summary.challenges.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Integrating advice */}
        <section className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs uppercase tracking-widest text-blue-600 font-mono mb-1.5">
            Consejo integrador
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {summary.integrating_advice}
          </p>
        </section>

      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-2.5 border-t border-slate-100 flex-shrink-0">
        <p className="text-xs text-slate-300 font-mono text-center">
          Forrest · Tompkins · Sasportas · Arroyo
        </p>
      </div>
    </div>
  );
}
