"use client";

import type { SolarReturnSummary } from "@/lib/solar-return-summary";

interface Props {
  summary: SolarReturnSummary;
  name: string;
  year: number;
  ascSign: string;
}

const ELEMENT_COLOR: Record<string, string> = {
  fuego:  "#DC2626",
  tierra: "#16A34A",
  aire:   "#D97706",
  agua:   "#2563EB",
};

const ELEMENT_LABEL: Record<string, string> = {
  fuego: "Fuego", tierra: "Tierra", aire: "Aire", agua: "Agua",
};

const NATURE_STYLE = {
  armonioso: { color: "#059669", bg: "#F0FDF4", label: "Armónico" },
  tenso:     { color: "#DC2626", bg: "#FEF2F2", label: "Tenso" },
  neutro:    { color: "#475569", bg: "#F8FAFC", label: "Neutro" },
};

export default function SolarReturnSummaryPanel({ summary, name, year, ascSign }: Props) {
  const accentColor = ELEMENT_COLOR[summary.dominant_element] ?? "#D97706";
  const totalPlanets = Object.values(summary.element_counts).reduce((a, b) => a + b, 0);

  return (
    <div
      className="rounded-2xl border border-slate-200 shadow-card bg-white overflow-hidden flex flex-col"
      style={{ maxHeight: "calc(100vh - 5rem)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-5 pt-5 pb-4 border-b border-slate-100 flex-shrink-0"
        style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ color: accentColor }} className="text-base">☉</span>
          <h2 className="font-semibold text-sm text-slate-900 uppercase tracking-widest font-mono">
            Resumen Solar {year}
          </h2>
        </div>
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          ASC Retorno · <span style={{ color: accentColor }}>{ascSign}</span>
        </p>
        <p className="text-sm mt-2 font-semibold leading-tight" style={{ color: accentColor }}>
          {summary.year_theme}
        </p>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">

        {/* ASC interpretation */}
        <section>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-1.5">
            Ascendente del Retorno
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {summary.asc_interpretation}
          </p>
        </section>

        {/* MC interpretation */}
        <section>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-1.5">
            MC · Dirección del año
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {summary.mc_interpretation}
          </p>
        </section>

        {/* Angular planets */}
        {summary.angular_planets.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Planetas angulares
            </p>
            <div className="space-y-2">
              {summary.angular_planets.map((ap) => (
                <div
                  key={ap.planet}
                  className="rounded-lg border border-amber-100 bg-amber-50 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-amber-100">
                    <span className="text-base">{ap.symbol}</span>
                    <span className="text-xs font-semibold text-slate-800">{ap.planet}</span>
                    <span className="text-xs font-mono text-amber-600 ml-auto">Casa {ap.house}</span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ap.interpretation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stelliums */}
        {summary.stelliums.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Stellium
            </p>
            {summary.stelliums.map((s) => (
              <div key={s.house} className="rounded-lg border border-violet-100 bg-violet-50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm font-mono font-bold text-violet-700">Casa {s.house}</span>
                  <span className="text-lg">{s.symbols.join(" ")}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Concentración de {s.planets.length} planetas en {s.focus}. Este es el área
                  de mayor énfasis y actividad durante el año.
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Key aspects */}
        {summary.key_aspects.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Aspectos clave (orbe {"<"} 2.5°)
            </p>
            <div className="space-y-1.5">
              {summary.key_aspects.map((a, i) => {
                const style = NATURE_STYLE[a.nature];
                return (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-700 font-mono flex-1 truncate">{a.description}</span>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded-full text-xs font-semibold font-mono"
                      style={{ color: style.color, backgroundColor: style.bg }}
                    >
                      {a.orb.toFixed(2)}°
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Element distribution */}
        <section>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
            Distribución elemental
          </p>
          <div className="space-y-1.5">
            {Object.entries(summary.element_counts)
              .sort((a, b) => b[1] - a[1])
              .map(([el, count]) => (
                <div key={el} className="flex items-center gap-2">
                  <span className="text-xs w-12 font-mono" style={{ color: ELEMENT_COLOR[el] }}>
                    {ELEMENT_LABEL[el]}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${totalPlanets > 0 ? (count / totalPlanets) * 100 : 0}%`,
                        backgroundColor: ELEMENT_COLOR[el],
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono w-4">{count}</span>
                </div>
              ))}
          </div>
        </section>

        {/* Opportunities */}
        {summary.opportunities.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#059669" }}>
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
            <p className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#DC2626" }}>
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

        {/* Advice */}
        <section className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-xs uppercase tracking-widest text-amber-600 font-mono mb-1.5">
            Consejo del año
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {summary.advice}
          </p>
        </section>

      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-2.5 border-t border-slate-100 flex-shrink-0">
        <p className="text-xs text-slate-300 font-mono text-center">
          Forrest · Tyl · Sasportas · Rodden
        </p>
      </div>
    </div>
  );
}
