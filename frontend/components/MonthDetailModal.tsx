"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { MonthlyForecast, PlanetPosition, TransitEvent } from "@/lib/types";
import { getInterpretationByComponents } from "@/lib/interpretation-engine";
import { ASPECT_COLORS, IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Intensidad ────────────────────────────────────────────────────────────────
function intensityInfo(score: number): { label: string; color: string } {
  if (score >= 8.0) return { label: "intenso",  color: "#EF4444" };
  if (score >= 5.0) return { label: "moderado", color: "#F97316" };
  return               { label: "estable",  color: "#10B981" };
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

const HOUSE_DOMAIN: Record<number, string> = {
  1: "identidad personal",      2: "recursos y valores",
  3: "comunicación",            4: "hogar y familia",
  5: "creatividad y romance",   6: "trabajo y salud",
  7: "relaciones y sociedad",   8: "transformación y recursos compartidos",
  9: "filosofía y viajes",     10: "vocación y reputación",
  11: "comunidad e ideales",   12: "mundo interior",
};

const SLOW_PLANETS = new Set(["Saturno", "Urano", "Neptuno", "Plutón"]);

function durationDays(t: TransitEvent): number {
  try {
    const a = new Date(t.enters_orb).getTime();
    const b = new Date(t.leaves_orb).getTime();
    return Math.round((b - a) / 86_400_000);
  } catch { return 0; }
}

// ── Sub-tarjeta de tránsito ───────────────────────────────────────────────────
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
      {/* Header */}
      <div
        className="px-4 py-3 flex items-start justify-between gap-3"
        style={{ borderLeftWidth: 3, borderLeftColor: aspectColor }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-mono text-base" style={{ color: aspectColor }}>{planetSym}</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">{transit.transit_planet}</span>
            <span className="text-slate-400 font-mono text-sm">{aspectSym}</span>
            <span className="text-slate-700 text-sm font-mono">{transit.natal_planet} natal</span>
            {house && (
              <span className="text-xs text-blue-500 font-mono">· Casa {house}</span>
            )}
          </div>
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

      {/* Cuerpo */}
      <div className="px-4 pb-4 space-y-2.5">
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
interface Props {
  month: MonthlyForecast;
  natalPlanets?: PlanetPosition[];
  onClose: () => void;
}

export default function MonthDetailModal({ month, natalPlanets, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const natalHouseMap: Record<string, number> = {};
  if (natalPlanets) {
    for (const p of natalPlanets) natalHouseMap[p.name] = p.house;
  }

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

  const { label, color } = intensityInfo(month.intensity_score);
  const monthLabel = format(new Date(`${month.month}-01`), "MMMM yyyy", { locale: es });

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
        className="relative z-10 w-full sm:w-[600px] h-[92vh] sm:h-screen flex flex-col bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl transition-all duration-300 ease-out overflow-hidden"
        style={{
          transform: visible
            ? "translate(0, 0)"
            : typeof window !== "undefined" && window.innerWidth < 640
              ? "translateY(100%)"
              : "translateX(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 border-b border-slate-100 flex-shrink-0"
          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-semibold text-xl text-slate-900 capitalize">{monthLabel}</h2>
                <span
                  className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ color, backgroundColor: `${color}20` }}
                >
                  {label}
                </span>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color }}>{month.dominant_theme}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{month.theme_summary}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Barra de intensidad */}
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, month.intensity_score * 10)}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Áreas de vida */}
          {(month.life_areas_affected ?? []).length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
                Áreas de vida activadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {month.life_areas_affected.map((area) => (
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

          {/* Tránsitos activos */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-4">
              Tránsitos activos · {(month.transits_active ?? []).length} en total
            </h3>
            <div className="space-y-4">
              {(month.transits_active ?? []).map((t, i) => (
                <TransitDetailCard key={i} transit={t} natalHouseMap={natalHouseMap} />
              ))}
              {(month.transits_active ?? []).length === 0 && (
                <p className="text-sm text-slate-400 italic">Sin tránsitos activos este mes.</p>
              )}
            </div>
          </div>
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
