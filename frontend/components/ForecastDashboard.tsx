"use client";

import type { MonthlyForecast } from "@/lib/types";
import { IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  timeline: MonthlyForecast[];
}

function intensityColor(score: number): string {
  if (score >= 7) return "#EF4444";
  if (score >= 4) return "#EAB308";
  return "#22C55E";
}

function intensityEmoji(score: number): string {
  if (score >= 7) return "🔴";
  if (score >= 4) return "🟡";
  return "🟢";
}

export default function ForecastDashboard({ timeline }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-serif text-xl text-gold">Pronóstico Mensual</h2>
        <div className="flex gap-4 text-xs text-gray-600 font-mono ml-auto">
          <span>🟢 Fluido</span>
          <span>🟡 Moderado</span>
          <span>🔴 Intenso</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeline.map((month) => {
          const date = new Date(`${month.month}-01`);
          const monthLabel = format(date, "MMMM yyyy", { locale: es });
          const color = intensityColor(month.intensity_score);

          return (
            <div
              key={month.month}
              className="bg-space-card border border-space-border rounded-xl p-4 flex flex-col gap-3"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              {/* Cabecera del mes */}
              <div className="flex items-center justify-between">
                <span className="font-serif text-base capitalize text-gray-200">
                  {monthLabel}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{intensityEmoji(month.intensity_score)}</span>
                  <span className="font-mono text-sm" style={{ color }}>
                    {month.intensity_score.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Tema dominante */}
              <p className="text-xs text-gray-400 italic capitalize">{month.dominant_theme}</p>

              {/* Barra de intensidad */}
              <div className="w-full bg-space-bg rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, month.intensity_score * 10)}%`, backgroundColor: color }}
                />
              </div>

              {/* Top tránsitos del mes */}
              {month.transits_active.length > 0 ? (
                <ul className="space-y-1.5">
                  {month.transits_active.slice(0, 3).map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-mono">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: IMPORTANCE_COLORS[t.importance] }}
                      />
                      <span className="text-gray-400">
                        {t.transit_planet}{" "}
                        <span className="text-gray-600">{t.aspect_name.slice(0, 4)}</span>{" "}
                        {t.natal_planet}
                      </span>
                    </li>
                  ))}
                  {month.transits_active.length > 3 && (
                    <li className="text-xs text-gray-600 pl-3.5">
                      +{month.transits_active.length - 3} más…
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-gray-600 italic">Sin tránsitos significativos</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
