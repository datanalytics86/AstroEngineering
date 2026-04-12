"use client";

import type { TransitEvent } from "@/lib/types";
import { getInterpretation } from "@/lib/interpretation-engine";
import { ASPECT_COLORS, IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  transit: TransitEvent;
}

export default function InterpretationCard({ transit }: Props) {
  const key = `${transit.transit_planet.toLowerCase()}_${transit.aspect_name.toLowerCase().replace(/ /g, "_")}_${transit.natal_planet.toLowerCase()}`;
  const interp = getInterpretation(key);

  const aspectColor = ASPECT_COLORS[transit.nature] ?? "#94A3B8";
  const importColor = IMPORTANCE_COLORS[transit.importance] ?? "#94A3B8";

  function formatDate(str: string): string {
    try {
      return format(new Date(str), "d MMM yyyy", { locale: es });
    } catch {
      return str;
    }
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-3 border-b border-border"
        style={{ borderLeftColor: aspectColor, borderLeftWidth: 3 }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: aspectColor }} className="text-base font-semibold font-mono">
              {transit.transit_planet}
            </span>
            <span className="text-slate-400 text-sm">{transit.aspect_name}</span>
            <span className="text-slate-700 text-sm">{transit.natal_planet} natal</span>
          </div>
          {interp && (
            <p className="text-xs text-slate-500">{interp.summary}</p>
          )}
        </div>
        <span
          className="text-xs font-mono uppercase tracking-wider border rounded px-2 py-0.5 shrink-0"
          style={{ color: importColor, borderColor: `${importColor}55`, backgroundColor: `${importColor}0f` }}
        >
          {transit.importance}
        </span>
      </div>

      {/* Fechas */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2 text-xs font-mono border-b border-border bg-slate-50">
        <div>
          <span className="text-slate-400 block">Entra orbe</span>
          <span className="text-slate-700">{formatDate(transit.enters_orb)}</span>
        </div>
        <div className="text-center">
          <span className="text-slate-400 block">Exacto</span>
          <span className="text-blue-600 font-semibold">
            {transit.exact_date ? formatDate(transit.exact_date.slice(0, 10)) : "—"}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block">Sale orbe</span>
          <span className="text-slate-700">{formatDate(transit.leaves_orb)}</span>
        </div>
      </div>

      {/* Interpretación */}
      {interp ? (
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">{interp.detailed}</p>
          <div className="flex flex-wrap gap-2">
            {interp.life_areas.map((area) => (
              <span
                key={area}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100"
              >
                {area}
              </span>
            ))}
          </div>
          <div className="bg-slate-50 border border-border rounded-lg p-3 text-xs text-slate-600">
            <span className="text-blue-600 font-semibold font-mono">Consejo: </span>{interp.advice}
          </div>
          {interp.duration_note && (
            <p className="text-xs text-slate-400 italic">{interp.duration_note}</p>
          )}
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="text-sm text-slate-500">
            Tránsito de {transit.transit_planet} en {transit.aspect_name} con {transit.natal_planet} natal.
            Orbe: {transit.orb.toFixed(2)}°.
          </p>
        </div>
      )}
    </div>
  );
}
