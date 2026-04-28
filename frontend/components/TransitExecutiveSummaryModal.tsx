"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { TransitExecutiveSummary } from "@/lib/types";

interface Props {
  summary: TransitExecutiveSummary;
  name: string;
  onClose: () => void;
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

export default function TransitExecutiveSummaryModal({ summary, name, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const dominantPlanet = summary.major_cycles[0]?.planet ?? "Saturno";
  const accentColor    = PLANET_COLOR[dominantPlanet] ?? "#6366F1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full sm:w-[620px] h-[92vh] sm:h-screen flex flex-col bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl transition-all duration-300 ease-out overflow-hidden"
        style={{
          transform: visible
            ? "translate(0, 0)"
            : typeof window !== "undefined" && window.innerWidth < 640
              ? "translateY(100%)"
              : "translateX(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 pt-6 pb-5 border-b border-slate-100 flex-shrink-0"
          style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg" style={{ color: accentColor }}>✦</span>
                <h2 className="font-semibold text-lg text-slate-900 leading-tight">
                  Resumen Ejecutivo · 12 meses
                </h2>
              </div>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{name}</p>
              <p className="text-sm font-semibold mt-2" style={{ color: accentColor }}>
                {summary.year_theme}
              </p>
              {summary.peak_month_label && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Mes cumbre: {summary.peak_month_label}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* Descripción del año */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Panorama del año
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{summary.year_description}</p>
          </section>

          {/* Ciclos mayores */}
          {summary.major_cycles.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
                Ciclos planetarios mayores
              </h3>
              <div className="space-y-3">
                {summary.major_cycles.map((cycle, i) => {
                  const color = PLANET_COLOR[cycle.planet] ?? "#94A3B8";
                  return (
                    <div
                      key={i}
                      className="rounded-xl border overflow-hidden"
                      style={{ borderColor: `${color}40` }}
                    >
                      <div
                        className="px-4 py-3"
                        style={{ borderLeftWidth: 3, borderLeftColor: color }}
                      >
                        <p className="text-sm font-semibold text-slate-800 mb-0.5">{cycle.headline}</p>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
                          <span>{cycle.enters}</span>
                          <div className="flex-1 h-px bg-slate-200" />
                          <span>{cycle.leaves}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{cycle.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Narrativa trimestral */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
              Narrativa trimestral
            </h3>
            <div className="space-y-3">
              {summary.quarters.map((q) => {
                const style = INTENSITY_STYLE[q.intensity] ?? INTENSITY_STYLE.media;
                return (
                  <div key={q.quarter} className="rounded-xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-slate-700">{q.quarter}</span>
                      <span className="text-xs font-mono text-slate-500">{q.months}</span>
                      <span
                        className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
                        style={{ color: style.color, backgroundColor: style.bg }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-slate-600 leading-relaxed">{q.narrative}</p>
                      {q.key_transit !== "—" && (
                        <p className="text-xs font-mono text-blue-500 mt-1.5">
                          Tránsito clave: {q.key_transit}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Oportunidades */}
          {summary.opportunities.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#10B981" }}>
                Oportunidades del año
              </h3>
              <ul className="space-y-2">
                {summary.opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Desafíos */}
          {summary.challenges.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#EF4444" }}>
                Áreas de tensión y crecimiento
              </h3>
              <ul className="space-y-2">
                {summary.challenges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Consejo integrador */}
          <section className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-widest text-blue-600 font-mono mb-2">
              Consejo integrador — Arroyo
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{summary.integrating_advice}</p>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 font-mono text-center">
            Basado en Steven Forrest · Sue Tompkins · Howard Sasportas · Stephen Arroyo
          </p>
        </div>
      </div>
    </div>
  );
}
