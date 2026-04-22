"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MonthlyForecast, PlanetPosition } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MonthDetailModal = dynamic(() => import("./MonthDetailModal"), { ssr: false });

interface Props {
  timeline: MonthlyForecast[];
  natalPlanets?: PlanetPosition[];
  onMonthClick?: (month: MonthlyForecast) => void;
}

function intensityInfo(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 8.0) return { label: "intenso",  color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" };
  if (score >= 5.0) return { label: "moderado", color: "#F97316", bg: "#FFF7ED", border: "#FED7AA" };
  return               { label: "estable",  color: "#10B981", bg: "#F0FDF4", border: "#A7F3D0" };
}

const ASPECT_SYMBOLS: Record<string, string> = {
  Conjunción: "☌", Oposición: "☍", Cuadratura: "□",
  Trígono: "△", Sextil: "⚹", Quincuncio: "⚻",
  Sesquicuadratura: "⚼", "Semi-sextil": "⚺",
};

const THEME_MAP: Record<string, string> = {
  "expansión y oportunidades":           "expansión",
  "transformación y empoderamiento":     "transformación",
  "saturno y disciplina":                "disciplina",
  "desafíos y crecimiento":              "desafíos",
  "renovación y cambio":                 "renovación",
  "estabilidad y consolidación":         "estabilidad",
  "comunicación y aprendizaje":          "comunicación",
  "creatividad e intuición":             "creatividad",
  "amor y relaciones":                   "relaciones",
  "carrera y propósito":                 "carrera",
  "salud y bienestar":                   "bienestar",
  "espiritualidad y profundidad":        "espiritualidad",
  "crisis y regeneración":               "crisis",
  "claridad y estructura":               "claridad",
};

function normalizeTheme(t: string): string {
  const lower = t.toLowerCase();
  return THEME_MAP[lower] ?? t.split(" ").slice(0, 2).join(" ");
}

const THEME_COLOR: Record<string, string> = {
  "expansión":      "#6366F1",
  "transformación": "#8B5CF6",
  "disciplina":     "#64748B",
  "desafíos":       "#EF4444",
  "renovación":     "#06B6D4",
  "estabilidad":    "#10B981",
  "comunicación":   "#F59E0B",
  "creatividad":    "#EC4899",
  "relaciones":     "#F43F5E",
  "carrera":        "#3B82F6",
  "bienestar":      "#22C55E",
  "espiritualidad": "#A855F7",
  "crisis":         "#DC2626",
  "claridad":       "#0EA5E9",
};

function themeColor(norm: string): string {
  return THEME_COLOR[norm] ?? "#6B7280";
}

function monthMatches(month: MonthlyForecast, activeTheme: string): boolean {
  const norm = normalizeTheme(month.dominant_theme ?? "");
  if (norm === activeTheme) return true;
  const areas = (month.life_areas_affected ?? []).map(normalizeTheme);
  return areas.includes(activeTheme);
}

export default function ForecastDashboard({ timeline, natalPlanets, onMonthClick }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  const allThemes = useMemo(() => {
    const seen = new Set<string>();
    for (const m of timeline) {
      if (m.dominant_theme) seen.add(normalizeTheme(m.dominant_theme));
      for (const a of m.life_areas_affected ?? []) seen.add(normalizeTheme(a));
    }
    return Array.from(seen).sort();
  }, [timeline]);

  const filteredMonths = useMemo(() => {
    if (!activeTheme) return timeline;
    return timeline.filter((m) => monthMatches(m, activeTheme));
  }, [timeline, activeTheme]);

  const selectedData = useMemo(
    () => (onMonthClick ? null : timeline.find((m) => m.month === selectedMonth) ?? null),
    [timeline, selectedMonth, onMonthClick],
  );

  function handleCardClick(month: MonthlyForecast) {
    if (onMonthClick) {
      onMonthClick(month);
    } else {
      setSelectedMonth(month.month);
    }
  }

  return (
    <>
      {/* ── Filtro por temática ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          onClick={() => setActiveTheme(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold border transition-all
            ${activeTheme === null
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}
        >
          Todos
        </button>
        {allThemes.map((theme) => {
          const color = themeColor(theme);
          const active = activeTheme === theme;
          return (
            <button
              key={theme}
              type="button"
              onClick={() => setActiveTheme(active ? null : theme)}
              className="px-3 py-1.5 rounded-full text-xs font-mono font-semibold border transition-all"
              style={
                active
                  ? { backgroundColor: color, color: "#fff", borderColor: color }
                  : { backgroundColor: "white", color: "#6B7280", borderColor: "#E2E8F0" }
              }
            >
              {theme}
            </button>
          );
        })}
      </div>

      {/* ── Cronología (filtro activo) ── */}
      {activeTheme ? (
        <div className="relative pl-8">
          {/* Línea vertical */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200 rounded-full" />

          {filteredMonths.length === 0 ? (
            <p className="text-sm text-slate-400 font-mono py-8 text-center">
              No hay meses con temática «{activeTheme}» en este período.
            </p>
          ) : (
            <div className="space-y-6">
              {filteredMonths.map((month) => {
                const date       = new Date(`${month.month}-01`);
                const monthLabel = format(date, "MMMM yyyy", { locale: es });
                const { color, bg, border } = intensityInfo(month.intensity_score);
                const normTheme  = normalizeTheme(month.dominant_theme ?? "");
                const tColor     = themeColor(normTheme);
                const topTransit = (month.transits_active ?? [])[0];
                const areas      = (month.life_areas_affected ?? []).map(normalizeTheme);

                return (
                  <div key={month.month} className="relative">
                    {/* Dot en la línea */}
                    <div
                      className="absolute -left-5 top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: tColor }}
                    />

                    <div
                      className="rounded-xl border p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: bg, borderColor: border }}
                      onClick={() => handleCardClick(month)}
                    >
                      {/* Cabecera */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800 capitalize font-mono">
                          {monthLabel}
                        </span>
                        <span
                          className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: tColor, backgroundColor: `${tColor}20` }}
                        >
                          {normTheme}
                        </span>
                      </div>

                      {/* Narrativa */}
                      {month.theme_summary && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {month.theme_summary}
                        </p>
                      )}

                      {/* Tránsito principal */}
                      {topTransit && (
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-slate-700">{topTransit.transit_planet}</span>
                          <span className="text-slate-400">{ASPECT_SYMBOLS[topTransit.aspect_name] ?? topTransit.aspect_name.slice(0,3)}</span>
                          <span className="text-slate-600">{topTransit.natal_planet}</span>
                        </div>
                      )}

                      {/* Life areas */}
                      {areas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {areas.map((a) => (
                            <span
                              key={a}
                              className="text-xs px-2 py-0.5 rounded-full font-mono"
                              style={
                                a === activeTheme
                                  ? { backgroundColor: tColor, color: "#fff" }
                                  : { backgroundColor: "#F1F5F9", color: "#64748B" }
                              }
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer resumen */}
          {filteredMonths.length > 0 && (
            <p className="text-xs text-slate-400 font-mono mt-6 pl-0">
              {filteredMonths.length} de {timeline.length} meses con temática «{activeTheme}»
            </p>
          )}
        </div>
      ) : (
        /* ── Grid normal ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {timeline.map((month) => {
            const date       = new Date(`${month.month}-01`);
            const monthLabel = format(date, "MMM yyyy", { locale: es });
            const { label, color, bg, border } = intensityInfo(month.intensity_score);
            const topTransits = (month.transits_active ?? []).slice(0, 3);
            const isSelected  = selectedMonth === month.month;

            return (
              <button
                key={month.month}
                type="button"
                onClick={() => handleCardClick(month)}
                className={`rounded-xl border p-4 flex flex-col gap-2.5 text-left transition-all duration-200
                  hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400
                  ${isSelected ? "ring-2 ring-blue-500 shadow-md" : ""}`}
                style={{ backgroundColor: isSelected ? bg : "white", borderColor: isSelected ? color : border }}
              >
                {/* Cabecera */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 capitalize font-mono">
                    {monthLabel}
                  </span>
                  <span
                    className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
                    style={{ color, backgroundColor: `${color}20` }}
                  >
                    {label}
                  </span>
                </div>

                {/* Barra de intensidad */}
                <div className="w-full bg-slate-100 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, month.intensity_score * 10)}%`, backgroundColor: color }}
                  />
                </div>

                {/* Tema dominante */}
                <p className="text-xs font-semibold capitalize" style={{ color }}>
                  {month.dominant_theme}
                </p>

                {/* Tránsitos top */}
                {topTransits.length > 0 && (
                  <ul className="space-y-0.5">
                    {topTransits.map((t, i) => (
                      <li key={i} className="flex items-center gap-1 text-xs font-mono text-slate-500 truncate">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-700">{t.transit_planet}</span>
                        <span className="text-slate-400">{ASPECT_SYMBOLS[t.aspect_name] ?? t.aspect_name.slice(0, 3)}</span>
                        <span>{t.natal_planet}</span>
                      </li>
                    ))}
                    {(month.transits_active ?? []).length > 3 && (
                      <li className="text-xs text-slate-400 pl-3">
                        +{(month.transits_active ?? []).length - 3} más
                      </li>
                    )}
                  </ul>
                )}

                <p className="text-xs text-slate-400 font-mono mt-auto">▶ ver detalle</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex gap-5 text-xs font-mono text-slate-400 mt-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Estable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Moderado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Intenso
        </span>
      </div>

      {/* Modal de detalle */}
      {selectedData && (
        <MonthDetailModal
          month={selectedData}
          natalPlanets={natalPlanets}
          onClose={() => setSelectedMonth(null)}
        />
      )}
    </>
  );
}
