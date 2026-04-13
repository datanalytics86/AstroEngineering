"use client";

import type { MonthlyForecast } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  timeline: MonthlyForecast[];
}

function intensityInfo(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 6.5) return { label: "intenso",   color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" };
  if (score >= 3.5) return { label: "moderado",  color: "#F97316", bg: "#FFF7ED", border: "#FED7AA" };
  return               { label: "estable",   color: "#10B981", bg: "#F0FDF4", border: "#A7F3D0" };
}

export default function ForecastDashboard({ timeline }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeline.map((month) => {
          const date = new Date(`${month.month}-01`);
          const monthLabel = format(date, "MMM yyyy", { locale: es });
          const { label, color, bg, border } = intensityInfo(month.intensity_score);
          const topTransits = (month.transits_active ?? []).slice(0, 3);

          return (
            <div
              key={month.month}
              className="rounded-xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-md"
              style={{ backgroundColor: bg, borderColor: border }}
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
              <div className="w-full bg-white/70 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, month.intensity_score * 10)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              {/* Tema dominante */}
              <div>
                <p className="text-xs font-semibold capitalize" style={{ color }}>
                  {month.dominant_theme}
                </p>
                {(month.theme_summary ?? "") !== "" && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    {month.theme_summary}
                  </p>
                )}
              </div>

              {/* Áreas de vida */}
              {(month.life_areas_affected ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(month.life_areas_affected ?? []).slice(0, 3).map((area) => (
                    <span
                      key={area}
                      className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}

              {/* Tránsitos activos */}
              {topTransits.length > 0 && (
                <ul className="space-y-1 border-t pt-2" style={{ borderColor: border }}>
                  {topTransits.map((t, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs font-mono text-slate-600 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-medium text-slate-700">{t.transit_planet}</span>
                      <span className="text-slate-400">{t.aspect_name.slice(0, 3)}</span>
                      <span>{t.natal_planet}</span>
                    </li>
                  ))}
                  {month.transits_active.length > 3 && (
                    <li className="text-xs text-slate-400 pl-3">
                      +{month.transits_active.length - 3} más
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-5 text-xs font-mono text-slate-400">
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
    </div>
  );
}
