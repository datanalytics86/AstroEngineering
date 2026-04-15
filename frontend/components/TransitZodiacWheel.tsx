"use client";

/**
 * TransitZodiacWheel — traditional biwheel SVG component.
 *
 * Outer ring : zodiac signs (30° sectors, element colours)
 * Tick ring  : degree marks (every 5° small, every 10° medium)
 * Transit ring: current transit planet positions
 * Separator  : thin dividing circle
 * Natal ring : natal planet positions
 * House lines: Placidus house cusps
 * Core       : natal aspect lines
 * ASC / MC labels
 */

import { useMemo, useState } from "react";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect, TransitEvent } from "@/lib/types";
import {
  SIGN_SYMBOLS,
  SIGN_NAMES,
  SIGN_ELEMENT_COLOR,
  SIGN_ELEMENT_BG,
  toRad,
  makeToAngle,
  polarXY,
  describeSector,
} from "@/lib/wheel-geometry";
import { ASPECT_COLORS } from "@/lib/zodiac-utils";

// ── Props ──────────────────────────────────────────────────────────────────────
interface TransitPlanetDot {
  name: string;
  symbol: string;
  longitude: number;
  retrograde?: boolean;
}

interface Props {
  /** Natal chart data */
  natalPlanets: PlanetPosition[];
  natalHouses?: HouseCusp[];
  ascendant?: AnglePoint;
  midheaven?: AnglePoint;
  natalAspects?: Aspect[];
  /** Current positions of transiting planets (deduplicated) */
  transitPlanets: TransitPlanetDot[];
  /** Raw transit events — used to draw transit-to-natal aspect lines */
  transitEvents?: TransitEvent[];
}

// ── Constants ──────────────────────────────────────────────────────────────────
const SVG_SIZE = 560;
const cx = SVG_SIZE / 2;
const cy = SVG_SIZE / 2;

const R_ZODIAC_OUT = 270;  // outer edge of zodiac ring
const R_ZODIAC_IN  = 228;  // inner edge of zodiac ring
const R_TICK_OUT   = 270;  // tick outer edge (same as zodiac out)
const R_TRANSIT    = 210;  // transit planet symbols
const R_SEP        = 194;  // separator circle
const R_NATAL      = 172;  // natal planet symbols
const R_HOUSES_MID = 145;  // house number labels
const R_CORE       = 108;  // inner circle for aspect lines

const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", Quirón: "⚷",
};

const TRANSIT_COLORS: Record<string, string> = {
  Plutón: "#7C3AED", Neptuno: "#3B82F6", Urano: "#06B6D4",
  Saturno: "#F59E0B", Júpiter: "#10B981", Marte: "#EF4444",
  Sol: "#F97316", Luna: "#94A3B8", Mercurio: "#6366F1",
  Venus: "#EC4899", "Nodo Norte": "#64748B", Quirón: "#8B5CF6",
};

// Major aspects to draw transit→natal lines for
const SHOW_ASPECTS = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);

// ── Tooltip ────────────────────────────────────────────────────────────────────
interface Tooltip {
  x: number; y: number;
  text: string; sub?: string;
}

export default function TransitZodiacWheel({
  natalPlanets,
  natalHouses,
  ascendant,
  midheaven,
  natalAspects,
  transitPlanets,
  transitEvents,
}: Props) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  // toAngle maps ecliptic longitude → SVG screen angle (0° = top, CW)
  // Default: if no ascendant, place 0°Aries at left (ASC = 0)
  const ascLon = ascendant?.longitude ?? 0;
  const toAngle = useMemo(() => makeToAngle(ascLon), [ascLon]);

  // ── Zodiac ring sectors ────────────────────────────────────────────────────
  const zodiacSectors = useMemo(() =>
    SIGN_NAMES.map((name, i) => {
      const startLon = i * 30;
      const startDeg = toAngle(startLon);
      // endDeg must be clockwise from startDeg by exactly 30°
      const endDeg = startDeg + 30;
      return { name, i, startDeg, endDeg, symbol: SIGN_SYMBOLS[i] };
    }),
  [toAngle]);

  // ── Degree ticks ──────────────────────────────────────────────────────────
  const ticks = useMemo(() => {
    const result: { outer: { x: number; y: number }; inner: { x: number; y: number }; is10: boolean }[] = [];
    for (let d = 0; d < 360; d += 5) {
      const ang = toAngle(d);
      const is10 = d % 10 === 0;
      const innerR = is10 ? R_TICK_OUT - 12 : R_TICK_OUT - 7;
      result.push({
        outer: polarXY(cx, cy, R_TICK_OUT, ang),
        inner: polarXY(cx, cy, innerR, ang),
        is10,
      });
    }
    return result;
  }, [toAngle]);

  // ── Transit planet dedup & collision offset ────────────────────────────────
  const transitDots = useMemo(() => {
    const sorted = [...transitPlanets].sort((a, b) => a.longitude - b.longitude);
    // Simple collision offset: if two planets within 8°, offset radially
    return sorted.map((p, idx) => {
      const prev = sorted[idx - 1];
      const angDiff = prev
        ? Math.abs(((p.longitude - prev.longitude) % 360 + 360) % 360)
        : 999;
      const rOffset = (angDiff < 8 && idx % 2 === 1) ? -18 : 0;
      return { ...p, rOffset };
    });
  }, [transitPlanets]);

  // ── Transit→natal aspect lines in core ────────────────────────────────────
  const transitAspectLines = useMemo(() => {
    if (!transitEvents?.length) return [];
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string; opacity: number }[] = [];
    const seen = new Set<string>();

    for (const te of transitEvents) {
      if (!SHOW_ASPECTS.has(te.aspect_name)) continue;
      const key = `${te.transit_planet}_${te.aspect_name}_${te.natal_planet}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Find the transit planet's position
      const tp = transitPlanets.find((p) => p.name === te.transit_planet);
      const np = natalPlanets.find((p) => p.name === te.natal_planet);
      if (!tp || !np) continue;

      const a1 = toAngle(tp.longitude);
      const a2 = toAngle(np.longitude);
      const p1 = polarXY(cx, cy, R_CORE * 0.92, a1);
      const p2 = polarXY(cx, cy, R_CORE * 0.92, a2);
      const color = ASPECT_COLORS[te.nature] ?? "#94A3B8";
      lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color, opacity: 0.35 });
    }
    return lines;
  }, [transitEvents, transitPlanets, natalPlanets, toAngle]);

  // ── Natal aspect lines in core ─────────────────────────────────────────────
  const natalAspectLines = useMemo(() => {
    if (!natalAspects?.length) return [];
    const major = natalAspects.filter((a) => SHOW_ASPECTS.has(a.aspect_name));
    const planetMap = Object.fromEntries(natalPlanets.map((p) => [p.name, p]));

    return major.map((asp) => {
      const p1 = planetMap[asp.planet1];
      const p2 = planetMap[asp.planet2];
      if (!p1 || !p2) return null;
      const a1 = toAngle(p1.longitude);
      const a2 = toAngle(p2.longitude);
      const pt1 = polarXY(cx, cy, R_CORE * 0.88, a1);
      const pt2 = polarXY(cx, cy, R_CORE * 0.88, a2);
      const color = ASPECT_COLORS[asp.nature] ?? "#94A3B8";
      return { x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y, color, opacity: 0.28 };
    }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; color: string; opacity: number }[];
  }, [natalAspects, natalPlanets, toAngle]);

  // ── Tooltip helpers ────────────────────────────────────────────────────────
  function showTooltip(e: React.MouseEvent<SVGElement>, text: string, sub?: string) {
    const svgEl = (e.target as SVGElement).closest("svg")!;
    const rect  = svgEl.getBoundingClientRect();
    const scaleX = SVG_SIZE / rect.width;
    const scaleY = SVG_SIZE / rect.height;
    setTooltip({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      text,
      sub,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[560px]"
        style={{ fontFamily: "monospace" }}
      >
        {/* ── Background ── */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* ── Zodiac ring sectors ── */}
        {zodiacSectors.map(({ name, i, startDeg, endDeg, symbol }) => {
          const midDeg = startDeg + 15;
          const midPos = polarXY(cx, cy, (R_ZODIAC_IN + R_ZODIAC_OUT) / 2, midDeg);
          const color  = SIGN_ELEMENT_COLOR[name] ?? "#94A3B8";
          const bg     = SIGN_ELEMENT_BG[name] ?? "#F8FAFC";
          return (
            <g key={name}>
              <path
                d={describeSector(cx, cy, R_ZODIAC_IN, R_ZODIAC_OUT, startDeg, endDeg)}
                fill={bg}
                stroke="#E2E8F0"
                strokeWidth={0.5}
              />
              <text
                x={midPos.x} y={midPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={14} fill={color}
                className="select-none pointer-events-none"
              >
                {symbol}
              </text>
            </g>
          );
        })}

        {/* ── Degree ticks ── */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.inner.x} y1={t.inner.y}
            x2={t.outer.x} y2={t.outer.y}
            stroke={t.is10 ? "#CBD5E1" : "#E2E8F0"}
            strokeWidth={t.is10 ? 1 : 0.5}
          />
        ))}

        {/* ── Inner zodiac boundary circle ── */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_IN} fill="none" stroke="#CBD5E1" strokeWidth={1} />

        {/* ── Transit planet ring circle ── */}
        <circle cx={cx} cy={cy} r={R_SEP + 18} fill="none" stroke="#EFF6FF" strokeWidth={0.5} />

        {/* ── Transit planet symbols ── */}
        {transitDots.map((p) => {
          const ang = toAngle(p.longitude);
          const r   = R_TRANSIT + p.rOffset;
          const pos = polarXY(cx, cy, r, ang);
          const col = TRANSIT_COLORS[p.name] ?? "#3B82F6";
          return (
            <g key={p.name}>
              {/* Tiny dot on the zodiac inner edge */}
              <circle
                cx={polarXY(cx, cy, R_ZODIAC_IN - 2, ang).x}
                cy={polarXY(cx, cy, R_ZODIAC_IN - 2, ang).y}
                r={2.5} fill={col}
              />
              {/* Planet symbol */}
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={14} fill={col} fontWeight="700"
                className="cursor-pointer select-none"
                onMouseEnter={(e) =>
                  showTooltip(e, `${p.name} (tránsito)`, `${p.longitude.toFixed(1)}°${p.retrograde ? " ℞" : ""}`)
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {p.symbol ?? PLANET_SYMBOLS[p.name] ?? p.name[0]}
              </text>
              {p.retrograde && (
                <text
                  x={pos.x + 9} y={pos.y - 9}
                  fontSize={8} fill={col}
                  className="pointer-events-none select-none"
                >℞</text>
              )}
            </g>
          );
        })}

        {/* ── Separator between transit and natal ── */}
        <circle cx={cx} cy={cy} r={R_SEP} fill="white" stroke="#CBD5E1" strokeWidth={1.5} />

        {/* ── House cusp lines ── */}
        {natalHouses?.map((house) => {
          const ang = toAngle(house.cusp_longitude);
          const isAngular = [1, 4, 7, 10].includes(house.number);
          const outer = polarXY(cx, cy, R_SEP, ang);
          const inner = polarXY(cx, cy, R_CORE, ang);
          return (
            <line
              key={house.number}
              x1={outer.x} y1={outer.y}
              x2={inner.x} y2={inner.y}
              stroke={isAngular ? "#2563EB" : "#CBD5E1"}
              strokeWidth={isAngular ? 1 : 0.5}
              strokeDasharray={isAngular ? undefined : "2,3"}
            />
          );
        })}

        {/* ── House number labels ── */}
        {natalHouses?.map((house, idx) => {
          const nextCusp = natalHouses[(idx + 1) % 12].cusp_longitude;
          let thisAng = toAngle(house.cusp_longitude);
          let nextAng = toAngle(nextCusp);
          if (nextAng <= thisAng) nextAng += 360;
          const midAng = (thisAng + nextAng) / 2;
          const pos = polarXY(cx, cy, R_HOUSES_MID, midAng);
          return (
            <text
              key={house.number}
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={9} fill="#94A3B8"
              className="select-none pointer-events-none"
            >
              {house.number}
            </text>
          );
        })}

        {/* ── Transit→natal aspect lines ── */}
        {transitAspectLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color} strokeWidth={0.8} opacity={l.opacity} strokeDasharray="3,2" />
        ))}

        {/* ── Natal aspect lines ── */}
        {natalAspectLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color} strokeWidth={0.6} opacity={l.opacity} />
        ))}

        {/* ── Core circle ── */}
        <circle cx={cx} cy={cy} r={R_CORE} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* ── Natal planet symbols ── */}
        {natalPlanets.map((p) => {
          const ang = toAngle(p.longitude);
          const pos = polarXY(cx, cy, R_NATAL, ang);
          return (
            <g key={p.name}>
              {/* Dot on separator */}
              <circle
                cx={polarXY(cx, cy, R_SEP, ang).x}
                cy={polarXY(cx, cy, R_SEP, ang).y}
                r={2} fill="#1E293B"
              />
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={13} fill="#1E293B"
                className="cursor-pointer select-none"
                onMouseEnter={(e) =>
                  showTooltip(e, `${p.name} natal`, `${p.degree_display} ${p.sign}${p.retrograde ? " ℞" : ""}`)
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {p.symbol}
              </text>
              {p.retrograde && (
                <text
                  x={pos.x + 9} y={pos.y - 9}
                  fontSize={7} fill="#EF4444"
                  className="pointer-events-none select-none"
                >℞</text>
              )}
            </g>
          );
        })}

        {/* ── ASC / DSC / MC / IC labels ── */}
        {ascendant && (() => {
          const labels = [
            { lon: ascendant.longitude, label: "ASC", color: "#2563EB" },
            { lon: (ascendant.longitude + 180) % 360, label: "DSC", color: "#94A3B8" },
          ];
          return labels.map(({ lon, label, color }) => {
            const ang = toAngle(lon);
            const pos = polarXY(cx, cy, R_ZODIAC_IN - 18, ang);
            return (
              <text
                key={label}
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={8.5} fill={color} fontWeight="700"
                className="select-none pointer-events-none"
              >
                {label}
              </text>
            );
          });
        })()}
        {midheaven && (() => {
          const labels = [
            { lon: midheaven.longitude, label: "MC", color: "#0EA5E9" },
            { lon: (midheaven.longitude + 180) % 360, label: "IC", color: "#94A3B8" },
          ];
          return labels.map(({ lon, label, color }) => {
            const ang = toAngle(lon);
            const pos = polarXY(cx, cy, R_ZODIAC_IN - 18, ang);
            return (
              <text
                key={label}
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={8.5} fill={color} fontWeight="700"
                className="select-none pointer-events-none"
              >
                {label}
              </text>
            );
          });
        })()}

        {/* ── Tooltip ── */}
        {tooltip && (
          <g>
            <rect
              x={Math.min(tooltip.x - 70, SVG_SIZE - 145)}
              y={Math.max(tooltip.y - 46, 4)}
              width={140} height={tooltip.sub ? 38 : 24}
              rx={5} fill="#1E293B" opacity={0.93}
            />
            <text
              x={Math.min(tooltip.x, SVG_SIZE - 75)}
              y={Math.max(tooltip.y - 34, 16)}
              textAnchor="middle" fontSize={9} fill="white" fontWeight="600"
            >{tooltip.text}</text>
            {tooltip.sub && (
              <text
                x={Math.min(tooltip.x, SVG_SIZE - 75)}
                y={Math.max(tooltip.y - 20, 30)}
                textAnchor="middle" fontSize={8} fill="#94A3B8"
              >{tooltip.sub}</text>
            )}
          </g>
        )}
      </svg>

      {/* ── Legend ── */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-mono text-slate-500">
        <span className="text-slate-700 font-semibold">Tránsitos:</span>
        {(["Plutón", "Saturno", "Júpiter", "Urano", "Neptuno", "Marte"] as const).map((p) => (
          <span key={p} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: TRANSIT_COLORS[p] }} />
            {p}
          </span>
        ))}
        <span className="text-slate-400 ml-2">· Círculo exterior = tránsito · Interior = natal</span>
      </div>
    </div>
  );
}
