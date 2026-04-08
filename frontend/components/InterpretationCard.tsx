"use client";

import type { TransitEvent } from "@/lib/types";
import { getInterpretation } from "@/lib/interpretation-engine";
import { ASPECT_COLORS, IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  transit: TransitEvent;
  defaultOpen?: boolean;
}

export default function InterpretationCard({ transit, defaultOpen = false }: Props) {
  const key = `${transit.transit_planet.toLowerCase()}_${transit.aspect_name.toLowerCase().replace(/ /g, "_")}_${transit.natal_planet.toLowerCase()}`;
  const interp = getInterpretation(key);

  const aspectColor = ASPECT_COLORS[transit.nature] ?? "#9CA3AF";
  const importColor = IMPORTANCE_COLORS[transit.importance] ?? "#9CA3AF";

  function formatDate(str: string): string {
    try {
      return format(new Date(str), "d MMM yyyy", { locale: es });
    } catch {
      return str;
    }
  }

  return (
    <div className="bg-space-card border border-space-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-space-border">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: aspectColor }} className="text-lg font-mono">
              {transit.transit_planet}
            </span>
            <span className="text-gray-500 text-sm">{transit.aspect_name}</span>
            <span className="text-gray-300 text-sm">{transit.natal_planet} natal</span>
          </div>
          {interp && (
            <p className="text-xs text-gray-400">{interp.summary}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="text-xs font-mono uppercase tracking-wider border rounded px-2 py-0.5"
            style={{ color: importColor, borderColor: importColor }}
          >
            {transit.importance}
          </span>
          <span className="text-xs text-gray-600 font-mono">
            score {transit.score}
          </span>
        </div>
      </div>

      {/* Fechas */}
      <div className="px-5 py-3 grid grid-cols-3 gap-2 text-xs font-mono border-b border-space-border">
        <div>
          <span className="text-gray-600 block">Entra orbe</span>
          <span className="text-gray-300">{formatDate(transit.enters_orb)}</span>
        </div>
        <div className="text-center">
          <span className="text-gray-600 block">Exacto</span>
          <span className="text-gold">{transit.exact_date ? formatDate(transit.exact_date.slice(0, 10)) : "—"}</span>
        </div>
        <div className="text-right">
          <span className="text-gray-600 block">Sale orbe</span>
          <span className="text-gray-300">{formatDate(transit.leaves_orb)}</span>
        </div>
      </div>

      {/* Interpretación */}
      {interp ? (
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-300 leading-relaxed">{interp.detailed}</p>
          <div className="flex flex-wrap gap-2">
            {interp.life_areas.map((area) => (
              <span key={area} className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full border border-gold/20">
                {area}
              </span>
            ))}
          </div>
          <div className="bg-space-bg border border-space-border rounded-lg p-3 text-xs text-gray-400">
            <span className="text-gold font-mono">Consejo: </span>{interp.advice}
          </div>
          {interp.duration_note && (
            <p className="text-xs text-gray-600 italic">{interp.duration_note}</p>
          )}
        </div>
      ) : (
        <div className="px-5 py-4">
          <p className="text-sm text-gray-500">
            Tránsito de {transit.transit_planet} en {transit.aspect_name} con {transit.natal_planet} natal.
            Orbe: {transit.orb.toFixed(2)}°.
          </p>
        </div>
      )}
    </div>
  );
}
