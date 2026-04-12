"use client";

import type { MonthlyForecast } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  timeline: MonthlyForecast[];
}

function intensityLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 7) return { label: "intenso",  color: "#EF4444", bg: "#FEF2F2" };
  if (score >= 4) return { label: "moderado", color: "#F97316", bg: "#FFF7ED" };
  return               { label: "estable",   color: "#10B981", bg: "#F0FDF4" };
}

export default function ForecastDashboard({ timeline }: Props) {
  return (
    <div className="space-y-6">
      {/* Monthly grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {timeline.map((month) => {
          const date = new Date(`${month.month}-01`);
          const monthLabel = format(date, "MMM yyyy", { locale: es });
          const { label, color, bg } = intensityLabel(month.intensity_score);
          const topTransits = month.transits_active.slice(0, 2);

          return (
            <div
              key={month.month}
              className="rounded-xl border p-3 flex flex-col gap-2"
              style={{ backgroundColor: bg, borderColor: `${color}33` }}
            >
              {/* Mes + dot */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 capitalize font-mono">
                  {monthLabel}
                </span>
                <span
                  className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{ color, backgroundColor: `${color}18` }}
                >
                  {label}
                </span>
              </div>

              {/* Barra de intensidad */}
              <div className="w-full bg-white/60 rounded-full h-1">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, month.intensity_score * 10)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              {/* Tema dominante */}
              {month.dominant_theme && (
                <p className="text-xs text-slate-500 italic capitalize leading-tight truncate">
                  {month.dominant_theme}
                </p>
              )}

              {/* Top 2 tránsitos */}
              {topTransits.length > 0 && (
                <ul className="space-y-1">
                  {topTransits.map((t, i) => (
                    <li key={i} className="text-xs font-mono text-slate-600 truncate">
                      {t.transit_planet} {t.aspect_name.slice(0, 3)} {t.natal_planet}
                    </li>
                  ))}
                  {month.transits_active.length > 2 && (
                    <li className="text-xs text-slate-400">
                      +{month.transits_active.length - 2} más
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Estable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          Moderado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Intenso
        </span>
      </div>
    </div>
  );
}
