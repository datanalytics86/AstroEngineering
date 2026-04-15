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
  /** If provided, the parent owns the modal — no modal is rendered inside this component. */
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

export default function ForecastDashboard({ timeline, natalPlanets, onMonthClick }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

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
      {/* ── Grid de tarjetas mensuales ── */}
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

              {/* Hint */}
              <p className="text-xs text-slate-400 font-mono mt-auto">▶ ver detalle</p>
            </button>
          );
        })}
      </div>

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

      {/* ── Modal de detalle (slide-in desde la derecha) ── */}
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
