"use client";

import { useState, useMemo } from "react";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect, ClickTarget } from "@/lib/types";
import { polarXY, makeToAngle, describeSector, SIGN_SYMBOLS, SIGN_NAMES } from "@/lib/wheel-geometry";

// ── Geometry ─────────────────────────────────────────────────────────────────
const SVG_SIZE      = 560;
const cx            = SVG_SIZE / 2;
const cy            = SVG_SIZE / 2;
const R_ZODIAC_OUT  = 270;
const R_ZODIAC_IN   = 222;
const R_NEEDLE_OUT  = 220;
const R_NEEDLE_IN   = 202;
const R_GLYPH       = 194;
const R_DEG_LABEL   = 182;
const R_HOUSE_NUM   = 110;
const R_ASPECT      = 88;
const R_CENTER      = 22;

// ── Zodiac ring: dark background with element tints ──────────────────────────
const SIGN_DARK_BG = [
  "#2A1515","#152A15","#2A2A0F","#0F1A2A",
  "#2A1515","#152A15","#2A2A0F","#0F1A2A",
  "#2A1515","#152A15","#2A2A0F","#0F1A2A",
];

// Bright glyph colors on dark bg (fire/earth/air/water repeating)
const SIGN_GLYPH_COLOR = [
  "#FF8888","#7ED87E","#F6DE6A","#7EB8F6",
  "#FF8888","#7ED87E","#F6DE6A","#7EB8F6",
  "#FF8888","#7ED87E","#F6DE6A","#7EB8F6",
];

// ── Planet colors ─────────────────────────────────────────────────────────────
const PLANET_COLOR: Record<string, string> = {
  Sol:          "#F59E0B",
  Luna:         "#94A3B8",
  Mercurio:     "#6366F1",
  Venus:        "#EC4899",
  Marte:        "#EF4444",
  Júpiter:      "#10B981",
  Saturno:      "#8B5CF6",
  Urano:        "#06B6D4",
  Neptuno:      "#3B82F6",
  Plutón:       "#7C3AED",
  "Nodo Norte": "#64748B",
  Quirón:       "#A78BFA",
};

// ── Aspect colors (standard astrological) ────────────────────────────────────
const ASPECT_LINE_COLOR: Record<string, string> = {
  Conjunción:       "#475569",
  Oposición:        "#DC2626",
  Cuadratura:       "#EA580C",
  Trígono:          "#2563EB",
  Sextil:           "#059669",
  Quincuncio:       "#7C3AED",
  Sesquicuadratura: "#D97706",
  "Semi-sextil":    "#0891B2",
};

const ASPECT_LINE_WIDTH: Record<string, number> = {
  Conjunción: 1.5, Oposición: 1.4, Cuadratura: 1.3,
  Trígono: 1.0, Sextil: 0.9,
};

// ── Collision resolver ────────────────────────────────────────────────────────
function resolveCollisions<T extends { longitude: number }>(
  items: T[],
  minDeg = 6,
): (T & { rOffset: number })[] {
  const sorted = [...items].sort((a, b) => a.longitude - b.longitude);
  const out = sorted.map((p) => ({ ...p, rOffset: 0 }));
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const diff = Math.abs(out[j].longitude - out[i].longitude);
      const angDiff = Math.min(diff, 360 - diff);
      if (angDiff < minDeg) {
        if (out[i].rOffset === 0) out[i].rOffset = -15;
        if (out[j].rOffset === 0) out[j].rOffset = +15;
      }
    }
  }
  return out;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  ascendant: AnglePoint;
  midheaven: AnglePoint;
  aspects: Aspect[];
  transitPlanets?: { name: string; symbol: string; longitude: number; retrograde?: boolean }[];
  highlightedPlanet?: string;
  onPlanetClick?: (name: string) => void;
  onElementClick?: (target: ClickTarget) => void;
  width?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChartWheel({
  planets,
  houses,
  ascendant,
  midheaven,
  aspects,
  transitPlanets,
  highlightedPlanet,
  onPlanetClick,
  onElementClick,
}: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const toAngle = useMemo(() => makeToAngle(ascendant.longitude), [ascendant.longitude]);
  const planetMap = useMemo(
    () => Object.fromEntries(planets.map((p) => [p.name, p])),
    [planets],
  );

  const resolvedPlanets = useMemo(() => resolveCollisions(planets), [planets]);

  const visibleAspects = useMemo(() => {
    const major = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);
    return highlightedPlanet
      ? aspects.filter((a) => a.planet1 === highlightedPlanet || a.planet2 === highlightedPlanet)
      : aspects.filter((a) => major.has(a.aspect_name));
  }, [aspects, highlightedPlanet]);

  function showTip(e: React.MouseEvent<SVGElement>, text: string) {
    const svg = e.currentTarget.closest("svg") as SVGSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = SVG_SIZE / rect.width;
    const sy = SVG_SIZE / rect.height;
    setTooltip({
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
      text,
    });
  }

  const anglePoints = useMemo(() => (
    [
      ascendant ? { lon: ascendant.longitude,               label: "ASC", color: "#60A5FA", obj: ascendant }  : null,
      ascendant ? { lon: (ascendant.longitude + 180) % 360, label: "DSC", color: "#94A3B8", obj: ascendant }  : null,
      midheaven ? { lon: midheaven.longitude,               label: "MC",  color: "#34D399", obj: midheaven }  : null,
      midheaven ? { lon: (midheaven.longitude + 180) % 360, label: "IC",  color: "#94A3B8", obj: midheaven }  : null,
    ] as Array<{ lon: number; label: string; color: string; obj: AnglePoint } | null>
  ).filter((x): x is { lon: number; label: string; color: string; obj: AnglePoint } => x !== null),
  [ascendant, midheaven]);

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[560px]"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* ── White base circle ── */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT + 2} fill="white" />

        {/* ── ZODIAC RING ── */}
        {SIGN_NAMES.map((name, i) => {
          const startDeg = toAngle(i * 30);
          const endDeg   = toAngle(i * 30 + 30);
          const midDeg   = toAngle(i * 30 + 15);
          const midPos   = polarXY(cx, cy, (R_ZODIAC_IN + R_ZODIAC_OUT) / 2, midDeg);
          return (
            <g key={name}>
              <path
                d={describeSector(cx, cy, R_ZODIAC_IN, R_ZODIAC_OUT, startDeg, endDeg)}
                fill={SIGN_DARK_BG[i]}
                stroke="#0D1520"
                strokeWidth={0.5}
              />
              <text
                x={midPos.x} y={midPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={15} fill={SIGN_GLYPH_COLOR[i]} fontWeight="500"
                className="select-none pointer-events-none"
              >
                {SIGN_SYMBOLS[i]}
              </text>
            </g>
          );
        })}

        {/* Sign divider lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const ang = toAngle(i * 30);
          const p1  = polarXY(cx, cy, R_ZODIAC_IN, ang);
          const p2  = polarXY(cx, cy, R_ZODIAC_OUT, ang);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#0D1520" strokeWidth={0.8} />;
        })}

        {/* Degree ticks every 5° (major 10°) */}
        {Array.from({ length: 72 }, (_, i) => {
          const deg     = i * 5;
          const ang     = toAngle(deg);
          const isMajor = deg % 10 === 0;
          const len     = isMajor ? 10 : 6;
          const p1      = polarXY(cx, cy, R_ZODIAC_IN, ang);
          const p2      = polarXY(cx, cy, R_ZODIAC_IN - len, ang);
          return (
            <line key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#FFFFFF" strokeWidth={isMajor ? 0.8 : 0.5} opacity={0.55}
            />
          );
        })}

        {/* 10°/20° labels inside zodiac */}
        {Array.from({ length: 12 }, (_, sign) =>
          [10, 20].map((deg) => {
            const lon = sign * 30 + deg;
            const ang = toAngle(lon);
            const pos = polarXY(cx, cy, R_ZODIAC_IN - 17, ang);
            return (
              <text key={`${sign}-${deg}`}
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={5.5} fill="#FFFFFF" opacity={0.45}
                className="select-none pointer-events-none"
              >{deg}</text>
            );
          })
        )}

        {/* Zodiac inner border */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_IN} fill="none" stroke="#2C3E60" strokeWidth={1.5} />

        {/* ── HOUSE LINES ── */}
        {houses.map((house) => {
          const isAngular = [1, 4, 7, 10].includes(house.number);
          const ang  = toAngle(house.cusp_longitude);
          const p1   = polarXY(cx, cy, R_ZODIAC_IN, ang);
          const p2   = polarXY(cx, cy, R_CENTER + 4, ang);

          const nextHouse = houses[house.number % 12];
          const nextAng   = toAngle(nextHouse.cusp_longitude);
          const span      = ((nextAng - ang) + 360) % 360;
          const midAng    = ang + span / 2;
          const numPos    = polarXY(cx, cy, R_HOUSE_NUM, midAng);

          return (
            <g key={house.number}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={isAngular ? "#3B82F6" : "#94A3B8"}
                strokeWidth={isAngular ? 1.2 : 0.6}
                strokeDasharray={isAngular ? undefined : "3,3"}
                opacity={isAngular ? 1 : 0.7}
              />
              <text
                x={numPos.x} y={numPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9} fill="#94A3B8"
                fontFamily="JetBrains Mono, monospace"
                className="cursor-pointer select-none"
                onClick={() => onElementClick?.({ type: "house", house })}
              >
                {house.number}
              </text>
            </g>
          );
        })}

        {/* ── ASPECT LINES ── */}
        {visibleAspects.map((asp, i) => {
          const p1 = planetMap[asp.planet1];
          const p2 = planetMap[asp.planet2];
          if (!p1 || !p2) return null;
          const a1    = toAngle(p1.longitude);
          const a2    = toAngle(p2.longitude);
          const pt1   = polarXY(cx, cy, R_ASPECT, a1);
          const pt2   = polarXY(cx, cy, R_ASPECT, a2);
          const color = ASPECT_LINE_COLOR[asp.aspect_name] ?? "#94A3B8";
          const lw    = ASPECT_LINE_WIDTH[asp.aspect_name] ?? 0.7;
          const isHl  = highlightedPlanet &&
            (asp.planet1 === highlightedPlanet || asp.planet2 === highlightedPlanet);
          return (
            <g key={i}>
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke={color}
                strokeWidth={isHl ? lw * 2.5 : lw}
                opacity={isHl ? 0.9 : 0.45}
              />
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke="transparent" strokeWidth={12}
                className="cursor-pointer"
                onClick={() => onElementClick?.({ type: "aspect", aspect: asp })}
                onMouseEnter={(e) => showTip(e, `${asp.planet1} ${asp.aspect_name} ${asp.planet2} (${asp.orb.toFixed(1)}°)`)}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}

        {/* ── PLANET NEEDLES + GLYPHS ── */}
        {resolvedPlanets.map((p) => {
          const ang        = toAngle(p.longitude);
          const isHl       = highlightedPlanet === p.name;
          const color      = isHl ? "#2563EB" : (PLANET_COLOR[p.name] ?? "#1E293B");
          const needleInR  = R_NEEDLE_IN + p.rOffset;
          const glyphR     = R_GLYPH + p.rOffset;
          const degR       = R_DEG_LABEL + p.rOffset;

          const tipPos   = polarXY(cx, cy, R_NEEDLE_OUT, ang);
          const basePos  = polarXY(cx, cy, needleInR, ang);
          const glyphPos = polarXY(cx, cy, glyphR, ang);
          const degPos   = polarXY(cx, cy, degR, ang);

          return (
            <g key={p.name}>
              {/* Dot at zodiac inner border */}
              <circle cx={tipPos.x} cy={tipPos.y} r={1.8} fill={color} />
              {/* Radial needle */}
              <line
                x1={tipPos.x} y1={tipPos.y} x2={basePos.x} y2={basePos.y}
                stroke={color} strokeWidth={0.8} opacity={0.65}
              />
              {/* Planet glyph */}
              <text
                x={glyphPos.x} y={glyphPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={14} fill={color}
                fontWeight={isHl ? "700" : "400"}
                className="cursor-pointer select-none"
                onClick={() => {
                  onPlanetClick?.(p.name);
                  onElementClick?.({ type: "planet", planet: p, aspects });
                }}
                onMouseEnter={(e) => showTip(e, `${p.name} ${p.degree_display} ${p.sign} · Casa ${p.house}`)}
                onMouseLeave={() => setTooltip(null)}
              >
                {p.symbol}
              </text>
              {/* Degree label */}
              <text
                x={degPos.x} y={degPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={6} fill={color} opacity={0.7}
                className="select-none pointer-events-none"
              >
                {Math.floor(p.degree_in_sign)}°
              </text>
              {/* Retrograde ℞ */}
              {p.retrograde && (
                <text
                  x={glyphPos.x + 9} y={glyphPos.y - 8}
                  fontSize={7} fill="#EF4444" fontWeight="700"
                  className="select-none pointer-events-none"
                >℞</text>
              )}
            </g>
          );
        })}

        {/* ── TRANSIT RING (optional) ── */}
        {transitPlanets && transitPlanets.length > 0 && (
          <>
            <circle cx={cx} cy={cy} r={R_ZODIAC_IN - 4} fill="none" stroke="#60A5FA" strokeWidth={0.5} strokeDasharray="2,4" opacity={0.4} />
            {transitPlanets.map((p) => {
              const ang = toAngle(p.longitude);
              const pos = polarXY(cx, cy, R_ZODIAC_IN - 18, ang);
              return (
                <text key={p.name}
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fill="#60A5FA" opacity={0.85}
                  className="select-none pointer-events-none"
                >
                  {p.symbol}
                </text>
              );
            })}
          </>
        )}

        {/* ── ASC / DSC / MC / IC ── */}
        {anglePoints.map(({ lon, label, color, obj }) => {
          const ang      = toAngle(lon);
          const inner    = polarXY(cx, cy, R_CENTER + 4, ang);
          const outer    = polarXY(cx, cy, R_ZODIAC_IN, ang);
          const labelPos = polarXY(cx, cy, R_ZODIAC_IN - 14, ang);
          const isMain   = label === "ASC" || label === "MC";
          return (
            <g key={label}>
              <line
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={color} strokeWidth={isMain ? 1.5 : 1.0} opacity={0.9}
              />
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={7.5} fill={color} fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
                className="cursor-pointer select-none"
                onClick={() =>
                  onElementClick?.({
                    type: "angle",
                    name: label as "ASC" | "DSC" | "MC" | "IC",
                    longitude: lon,
                    sign: obj.sign,
                    degree_display: obj.degree_display,
                  })
                }
              >{label}</text>
            </g>
          );
        })}

        {/* ── CENTER CIRCLE ── */}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* ── TOOLTIP ── */}
        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x, 85), SVG_SIZE - 85);
          const ty = Math.max(tooltip.y - 30, 6);
          return (
            <g className="pointer-events-none">
              <rect x={tx - 80} y={ty} width={160} height={22} rx={4} fill="#1E293B" opacity={0.93} />
              <text x={tx} y={ty + 11}
                textAnchor="middle" dominantBaseline="central"
                fontSize={9} fill="white"
                className="select-none"
              >{tooltip.text}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
