"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChartSummary } from "@/lib/types";

interface Props {
  summary: ChartSummary;
  name: string;
  onClose: () => void;
}

const ELEMENT_COLOR: Record<string, { color: string; bg: string }> = {
  Fuego:  { color: "#EF4444", bg: "#FEF2F2" },
  Tierra: { color: "#10B981", bg: "#F0FDF4" },
  Aire:   { color: "#D97706", bg: "#FFFBEB" },
  Agua:   { color: "#3B82F6", bg: "#EFF6FF" },
};

export default function ChartSummaryModal({ summary, name, onClose }: Props) {
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

  const elInfo = ELEMENT_COLOR[summary.dominant_element] ?? { color: "#6366F1", bg: "#EEF2FF" };

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
        className="relative z-10 w-full sm:w-[560px] h-[92vh] sm:h-screen flex flex-col bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl transition-all duration-300 ease-out overflow-hidden"
        style={{
          transform: visible
            ? "translate(0, 0)"
            : window.innerWidth < 640 ? "translateY(100%)" : "translateX(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex-shrink-0"
             style={{ borderLeftColor: elInfo.color, borderLeftWidth: 3 }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg text-slate-900 leading-tight">
                Resumen Ejecutivo
              </h2>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{name}</p>
              <p className="text-xs font-semibold mt-2" style={{ color: elInfo.color }}>
                {summary.headline}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Elemento + modalidad badges */}
          <div className="flex gap-2 mt-3">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: elInfo.bg, color: elInfo.color }}
            >
              {summary.dominant_element} dominante
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Energía {summary.dominant_modality}
            </span>
            {summary.stelliums.length > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                Stellium en {summary.stelliums[0].sign}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Identidad central */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Identidad central — Sol en {summary.headline.split("·")[0].trim()}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{summary.core_identity}</p>
          </section>

          {/* Naturaleza emocional */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Naturaleza emocional — Luna en {summary.headline.split("·")[2]?.trim()}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{summary.emotional_nature}</p>
          </section>

          {/* Propósito de vida */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Propósito y vocación — MC
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{summary.life_purpose}</p>
          </section>

          {/* Fortalezas */}
          <section>
            <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#10B981" }}>
              Fortalezas principales
            </h3>
            <ul className="space-y-2">
              {summary.key_strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          {/* Desafíos */}
          <section>
            <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#EF4444" }}>
              Desafíos y áreas de crecimiento
            </h3>
            <ul className="space-y-2">
              {summary.key_challenges.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </section>

          {/* Aspectos notables */}
          {summary.notable_aspects.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
                Aspectos más exactos
              </h3>
              <ul className="space-y-1.5">
                {summary.notable_aspects.map((a, i) => (
                  <li key={i} className="text-xs font-mono text-slate-600 bg-slate-50 rounded px-3 py-1.5 border border-slate-100">
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Énfasis de casa */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
              Énfasis de vida
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-700">
                <span className="font-semibold text-blue-600">Casa {summary.house_emphasis.house}</span>
                {" "}({summary.house_emphasis.planet_count} planetas) es tu área de mayor concentración energética:
                {" "}<span className="italic">{summary.house_emphasis.domain}</span>.
              </p>
            </div>
          </section>

          {/* Consejo integrador */}
          <section className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-widest text-blue-600 font-mono mb-2">
              Consejo integrador
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{summary.advice}</p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 font-mono text-center">
            Basado en Steven Forrest · Sue Tompkins · Howard Sasportas · Stephen Arroyo
          </p>
        </div>
      </div>
    </div>
  );
}
