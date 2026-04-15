"use client";

import { useMemo, useState } from "react";
import type { MonthlyForecast, PlanetPosition, TransitEvent } from "@/lib/types";
import { getInterpretationByComponents } from "@/lib/interpretation-engine";
import { ASPECT_COLORS, IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  timeline: MonthlyForecast[];
  natalPlanets?: PlanetPosition[];
}

// ── Intensidad ────────────────────────────────────────────────────────────────
function intensityInfo(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 8.0) return { label: "intenso",  color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" };
  if (score >= 5.0) return { label: "moderado", color: "#F97316", bg: "#FFF7ED", border: "#FED7AA" };
  return               { label: "estable",  color: "#10B981", bg: "#F0FDF4", border: "#A7F3D0" };
}

// ── Símbolos ──────────────────────────────────────────────────────────────────
const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", Quirón: "⚷",
};

const ASPECT_SYMBOLS: Record<string, string> = {
  Conjunción: "☌", Oposición: "☍", Cuadratura: "□",
  Trígono: "△", Sextil: "⚹", Quincuncio: "⚻",
  Sesquicuadratura: "⚼", "Semi-sextil": "⚺",
};

// ── Dominio de casas (Sasportas) ──────────────────────────────────────────────
const HOUSE_DOMAIN: Record<number, string> = {
  1: "identidad personal",      2: "recursos y valores",
  3: "comunicación",            4: "hogar y familia",
  5: "creatividad y romance",   6: "trabajo y salud",
  7: "relaciones y sociedad",   8: "transformación y recursos compartidos",
  9: "filosofía y viajes",     10: "vocación y reputación",
  11: "comunidad e ideales",   12: "mundo interior",
};

// ── Planetas lentos (tránsitos > 60 días merecen nota) ───────────────────────
const SLOW_PLANETS = new Set(["Saturno", "Urano", "Neptuno", "Plutón"]);

function durationDays(t: TransitEvent): number {
  try {
    const a = new Date(t.enters_orb).getTime();
    const b = new Date(t.leaves_orb).getTime();
    return Math.round((b - a) / 86_400_000);
  } catch { return 0; }
}

// ── Sub-tarjeta de tránsito en el panel de detalle ───────────────────────────
function TransitDetailCard({
  transit,
  natalHouseMap,
}: {
  transit: TransitEvent;
  natalHouseMap: Record<string, number>;
}) {
  const interp = getInterpretationByComponents(
    transit.transit_planet,
    transit.aspect_name,
    transit.natal_planet,
  );
  const aspectColor = ASPECT_COLORS[transit.nature] ?? "#94A3B8";
  const importColor = IMPORTANCE_COLORS[transit.importance] ?? "#94A3B8";
  const house       = natalHouseMap[transit.natal_planet];
  const slow        = SLOW_PLANETS.has(transit.transit_planet) && durationDays(transit) > 60;
  const planetSym   = PLANET_SYMBOLS[transit.transit_planet] ?? "";
  const aspectSym   = ASPECT_SYMBOLS[transit.aspect_name] ?? transit.aspect_name;

  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: `${aspectColor}55` }}
    >
      {/* Header de la sub-tarjeta */}
      <div
        className="px-4 py-3 flex items-start justify-between gap-3"
        style={{ borderLeftWidth: 3, borderLeftColor: aspectColor }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-mono text-base" style={{ color: aspectColor }}>{planetSym}</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">
              {transit.transit_planet}
            </span>
            <span className="text-slate-400 font-mono text-sm">{aspectSym}</span>
            <span className="text-slate-700 text-sm font-mono">{transit.natal_planet} natal</span>
            {house && (
              <span className="text-xs text-blue-500 font-mono">· Casa {house}</span>
            )}
          </div>

          {/* Applying / separating */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                transit.applying
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {transit.applying ? "aplicante ↑" : "integración ↓"}
            </span>
            {transit.orb < 0.5 && (
              <span className="text-xs font-mono text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                casi exacto
              </span>
            )}
            {slow && (
              <span className="text-xs font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                tránsito lento
              </span>
            )}
          </div>
        </div>
        <span
          className="text-xs font-mono uppercase tracking-wider border rounded px-2 py-0.5 shrink-0"
          style={{ color: importColor, borderColor: `${importColor}55`, backgroundColor: `${importColor}10` }}
        >
          {transit.importance}
        </span>
      </div>

      {/* Cuerpo de interpretación */}
      <div className="px-4 pb-4 space-y-2.5">
        {/* Contexto de casa (Sasportas) */}
        {house && (
          <p className="text-xs text-blue-600 font-mono">
            {transit.transit_planet} {transit.aspect_name.toLowerCase()} tu {transit.natal_planet} natal
            (Casa {house}) — área: {HOUSE_DOMAIN[house] ?? "vida"}
          </p>
        )}

        {interp ? (
          <>
            <p className="text-sm text-slate-700 leading-relaxed">{interp.detailed}</p>
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600">
              <span className="text-blue-600 font-semibold font-mono">Consejo: </span>
              {interp.advice}
            </div>
            {slow && (
              <p className="text-xs text-slate-400 italic">
                Tránsito lento: puede manifestarse en múltiples fases a lo largo de varios meses.
              </p>
            )}
            {interp.duration_note && (
              <p className="text-xs text-slate-400 italic">{interp.duration_note}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">
            {transit.transit_planet} {transit.aspect_name.toLowerCase()} {transit.natal_planet} natal
            — orbe {transit.orb.toFixed(1)}°
          </p>
        )}

        {/* Duración */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-1">
          <span>{transit.enters_orb}</span>
          <div className="flex-1 h-px bg-slate-200" />
          <span>{transit.leaves_orb}</span>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ForecastDashboard({ timeline, natalPlanets }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Mapa nombre → casa para lookup rápido
  const natalHouseMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    if (natalPlanets) {
      for (const p of natalPlanets) map[p.name] = p.house;
    }
    return map;
  }, [natalPlanets]);

  const selectedData = timeline.find((m) => m.month === selectedMonth) ?? null;

  function toggleMonth(key: string) {
    setSelectedMonth((prev) => (prev === key ? null : key));
  }

  return (
    <div className="space-y-4">

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
              onClick={() => toggleMonth(month.month)}
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
                      <span className="text-slate-400">{ASPECT_SYMBOLS[t.aspect_name] ?? t.aspect_name.slice(0,3)}</span>
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

              {/* Hint de click */}
              <p className="text-xs text-slate-400 font-mono mt-auto">
                {isSelected ? "▲ cerrar detalle" : "▼ ver detalle"}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Panel de detalle inline ── */}
      {selectedData && (
        <div className="rounded-2xl border border-blue-200 bg-white shadow-md overflow-hidden transition-all duration-300">

          {/* Header del panel */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-xl text-slate-900 capitalize">
                    {format(new Date(`${selectedData.month}-01`), "MMMM yyyy", { locale: es })}
                  </h3>
                  {(() => {
                    const { label, color } = intensityInfo(selectedData.intensity_score);
                    return (
                      <span
                        className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ color, backgroundColor: `${color}20` }}
                      >
                        {label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-sm font-semibold text-blue-600 mb-1">{selectedData.dominant_theme}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedData.theme_summary}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors shrink-0 text-base"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tránsitos del mes */}
          <div className="px-6 py-5">
            <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-4">
              Tránsitos activos este mes
            </h4>
            <div className="space-y-4">
              {(selectedData.transits_active ?? []).map((t, i) => (
                <TransitDetailCard
                  key={i}
                  transit={t}
                  natalHouseMap={natalHouseMap}
                />
              ))}
              {(selectedData.transits_active ?? []).length === 0 && (
                <p className="text-sm text-slate-400 italic">Sin tránsitos activos este mes.</p>
              )}
            </div>
          </div>

          {/* Pie del panel */}
          <div className="px-6 pb-5 space-y-4">
            {/* Áreas de vida */}
            {(selectedData.life_areas_affected ?? []).length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
                  Áreas de vida activadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedData.life_areas_affected.map((area) => (
                    <span
                      key={area}
                      className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-mono"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bibliografía */}
            <p className="text-xs text-slate-400 font-mono text-center border-t border-slate-100 pt-4">
              Interpretaciones basadas en Steven Forrest · Sue Tompkins · Howard Sasportas · Stephen Arroyo
            </p>
          </div>
        </div>
      )}

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
