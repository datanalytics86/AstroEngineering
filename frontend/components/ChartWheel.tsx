"use client";

import { useState, useMemo } from "react";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect, ClickTarget } from "@/lib/types";
import { polarXY, makeToAngle, describeSector, SIGN_SYMBOLS, SIGN_NAMES } from "@/lib/wheel-geometry";

// ── Geometry ─────────────────────────────────────────────────────────────────
const SVG_SIZE         = 560;
const cx               = SVG_SIZE / 2;
const cy               = SVG_SIZE / 2;

// Zodiac ring
const R_ZODIAC_OUT     = 268;
const R_ZODIAC_IN      = 218;

// Planet ring (between zodiac and chart area)
const R_PLANET_OUT     = R_ZODIAC_IN;        // 218
const R_PLANET_IN      = 168;

// Exact-degree dot and needle (inside zodiac inner border)
const R_DOT            = 216;
const R_NEEDLE_END     = 186;
const R_GLYPH          = 196;
const R_DEG_LABEL      = 177;

// Chart area (inside planet ring)
const R_CHART_OUT      = R_PLANET_IN;        // 168
const R_HOUSE_NUM      = 120;
const R_ASPECT         = 88;
const R_CENTER         = 22;

// ── Zodiac: light element tints ───────────────────────────────────────────────
const SIGN_BG = [
  "#FEF2F2","#F0FDF4","#FEFCE8","#EFF6FF",   // fire, earth, air, water
  "#FEF2F2","#F0FDF4","#FEFCE8","#EFF6FF",
  "#FEF2F2","#F0FDF4","#FEFCE8","#EFF6FF",
];

const SIGN_GLYPH_COLOR = [
  "#DC2626","#16A34A","#D97706","#2563EB",
  "#DC2626","#16A34A","#D97706","#2563EB",
  "#DC2626","#16A34A","#D97706","#2563EB",
];

// ── Planet colors ─────────────────────────────────────────────────────────────
const PLANET_COLOR: Record<string, string> = {
  Sol:          "#D97706",
  Luna:         "#64748B",
  Mercurio:     "#6366F1",
  Venus:        "#DB2777",
  Marte:        "#DC2626",
  Júpiter:      "#059669",
  Saturno:      "#7C3AED",
  Urano:        "#0891B2",
  Neptuno:      "#2563EB",
  Plutón:       "#7C3AED",
  "Nodo Norte": "#94A3B8",
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
  Conjunción: 1.4, Oposición: 1.3, Cuadratura: 1.2,
  Trígono: 1.0,    Sextil: 0.9,
};

// ── Collision resolver ────────────────────────────────────────────────────────
function resolveCollisions<T extends { longitude: number }>(
  items: T[],
  minDeg = 7,
): (T & { rOffset: number })[] {
  const sorted = [...items].sort((a, b) => a.longitude - b.longitude);
  const out = sorted.map((p) => ({ ...p, rOffset: 0 }));
  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const diff    = Math.abs(out[j].longitude - out[i].longitude);
      const angDiff = Math.min(diff, 360 - diff);
      if (angDiff < minDeg) {
        if (out[i].rOffset === 0) out[i].rOffset = -12;
        if (out[j].rOffset === 0) out[j].rOffset = +12;
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
    setTooltip({
      x: (e.clientX - rect.left) * (SVG_SIZE / rect.width),
      y: (e.clientY - rect.top)  * (SVG_SIZE / rect.height),
      text,
    });
  }

  const anglePoints = useMemo(() => (
    [
      ascendant ? { lon: ascendant.longitude,               label: "ASC", color: "#2563EB", obj: ascendant } : null,
      ascendant ? { lon: (ascendant.longitude + 180) % 360, label: "DSC", color: "#64748B", obj: ascendant } : null,
      midheaven ? { lon: midheaven.longitude,               label: "MC",  color: "#059669", obj: midheaven } : null,
      midheaven ? { lon: (midheaven.longitude + 180) % 360, label: "IC",  color: "#64748B", obj: midheaven } : null,
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
        {/* ── White base ── */}
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
                fill={SIGN_BG[i]}
                stroke="#CBD5E1"
                strokeWidth={0.4}
              />
              <text
                x={midPos.x} y={midPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={16} fill={SIGN_GLYPH_COLOR[i]}
                fontWeight="600"
                className="select-none pointer-events-none"
              >
                {SIGN_SYMBOLS[i]}
              </text>
            </g>
          );
        })}

        {/* Sign divider lines (zodiac) */}
        {Array.from({ length: 12 }, (_, i) => {
          const ang = toAngle(i * 30);
          const p1  = polarXY(cx, cy, R_ZODIAC_IN,  ang);
          const p2  = polarXY(cx, cy, R_ZODIAC_OUT, ang);
          return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94A3B8" strokeWidth={0.7} />;
        })}

        {/* Degree ticks every 5° on inner zodiac border */}
        {Array.from({ length: 72 }, (_, i) => {
          const deg     = i * 5;
          const ang     = toAngle(deg);
          const isMajor = deg % 10 === 0;
          const len     = isMajor ? 8 : 4;
          const p1      = polarXY(cx, cy, R_ZODIAC_IN,       ang);
          const p2      = polarXY(cx, cy, R_ZODIAC_IN - len, ang);
          return (
            <line key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#94A3B8" strokeWidth={isMajor ? 0.7 : 0.4}
            />
          );
        })}

        {/* Zodiac borders */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT} fill="none" stroke="#94A3B8" strokeWidth={1.2} />
        <circle cx={cx} cy={cy} r={R_ZODIAC_IN}  fill="none" stroke="#94A3B8" strokeWidth={1.0} />

        {/* ── PLANET RING ── */}
        <circle cx={cx} cy={cy} r={R_PLANET_OUT} fill="#F8FAFC" />
        <circle cx={cx} cy={cy} r={R_PLANET_IN}  fill="white" />
        <circle cx={cx} cy={cy} r={R_PLANET_IN}  fill="none" stroke="#CBD5E1" strokeWidth={0.8} />

        {/* ── HOUSE LINES (inside chart area) ── */}
        {houses.map((house) => {
          const isAngular = [1, 4, 7, 10].includes(house.number);
          const ang       = toAngle(house.cusp_longitude);
          const p1        = polarXY(cx, cy, R_CHART_OUT, ang);
          const p2        = polarXY(cx, cy, R_CENTER + 4, ang);

          const nextHouse = houses[house.number % 12];
          const nextAng   = toAngle(nextHouse.cusp_longitude);
          const span      = ((nextAng - ang) + 360) % 360;
          const midAng    = ang + span / 2;
          const numPos    = polarXY(cx, cy, R_HOUSE_NUM, midAng);

          return (
            <g key={house.number}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={isAngular ? "#3B82F6" : "#CBD5E1"}
                strokeWidth={isAngular ? 1.4 : 0.7}
                strokeDasharray={isAngular ? undefined : "3,3"}
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
          const isHl  = !!highlightedPlanet &&
            (asp.planet1 === highlightedPlanet || asp.planet2 === highlightedPlanet);
          return (
            <g key={i}>
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke={color}
                strokeWidth={isHl ? lw * 2.5 : lw}
                opacity={isHl ? 0.9 : 0.5}
              />
              <line
                x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y}
                stroke="transparent" strokeWidth={12}
                className="cursor-pointer"
                onClick={() => onElementClick?.({ type: "aspect", aspect: asp })}
                onMouseEnter={(e) =>
                  showTip(e, `${asp.planet1} ${asp.aspect_name} ${asp.planet2} (${asp.orb.toFixed(1)}°)`)
                }
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}

        {/* ── ASC / DSC / MC / IC axis lines through full chart ── */}
        {anglePoints.map(({ lon, label, color }) => {
          const ang   = toAngle(lon);
          const inner = polarXY(cx, cy, R_CENTER + 4, ang);
          const outer = polarXY(cx, cy, R_CHART_OUT, ang);
          const isMain = label === "ASC" || label === "MC";
          return (
            <line key={`axis-${label}`}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={color} strokeWidth={isMain ? 1.8 : 1.0} opacity={0.9}
            />
          );
        })}

        {/* ── PLANET NEEDLES + GLYPHS (in planet ring) ── */}
        {resolvedPlanets.map((p) => {
          const ang       = toAngle(p.longitude);
          const isHl      = highlightedPlanet === p.name;
          const color     = isHl ? "#1D4ED8" : (PLANET_COLOR[p.name] ?? "#1E293B");
          const glyphR    = R_GLYPH    + p.rOffset;
          const needleEnd = R_NEEDLE_END + p.rOffset;
          const degR      = R_DEG_LABEL + p.rOffset;

          const dotPos   = polarXY(cx, cy, R_DOT,      ang);
          const needleP  = polarXY(cx, cy, needleEnd,  ang);
          const glyphPos = polarXY(cx, cy, glyphR,     ang);
          const degPos   = polarXY(cx, cy, degR,       ang);

          return (
            <g key={p.name}>
              {/* Exact-degree dot on inner zodiac border */}
              <circle cx={dotPos.x} cy={dotPos.y} r={2} fill={color} />
              {/* Radial needle to glyph */}
              <line
                x1={dotPos.x} y1={dotPos.y} x2={needleP.x} y2={needleP.y}
                stroke={color} strokeWidth={0.8} opacity={0.6}
              />
              {/* Planet glyph */}
              <text
                x={glyphPos.x} y={glyphPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={15} fill={color}
                fontWeight={isHl ? "700" : "400"}
                className="cursor-pointer select-none"
                onClick={() => {
                  onPlanetClick?.(p.name);
                  onElementClick?.({ type: "planet", planet: p, aspects });
                }}
                onMouseEnter={(e) =>
                  showTip(e, `${p.name} ${p.degree_display} ${p.sign} · Casa ${p.house}`)
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {p.symbol}
              </text>
              {/* Degree label */}
              <text
                x={degPos.x} y={degPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={6} fill={color} opacity={0.75}
                className="select-none pointer-events-none"
              >
                {Math.floor(p.degree_in_sign)}°
              </text>
              {/* Retrograde ℞ */}
              {p.retrograde && (
                <text
                  x={glyphPos.x + 10} y={glyphPos.y - 9}
                  fontSize={7} fill="#DC2626" fontWeight="700"
                  className="select-none pointer-events-none"
                >℞</text>
              )}
            </g>
          );
        })}

        {/* ── TRANSIT RING (optional outer glyphs just inside zodiac) ── */}
        {transitPlanets && transitPlanets.length > 0 && (
          <>
            {transitPlanets.map((p) => {
              const ang = toAngle(p.longitude);
              const pos = polarXY(cx, cy, R_ZODIAC_IN + 16, ang);
              return (
                <text key={p.name}
                  x={pos.x} y={pos.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fill="#60A5FA" opacity={0.9}
                  className="select-none pointer-events-none"
                >
                  {p.symbol}
                </text>
              );
            })}
          </>
        )}

        {/* ── ANGLE LABELS (ASC/DSC/MC/IC) in planet ring ── */}
        {anglePoints.map(({ lon, label, color, obj }) => {
          const ang      = toAngle(lon);
          const labelPos = polarXY(cx, cy, R_PLANET_IN + 12, ang);
          const isMain   = label === "ASC" || label === "MC";
          return (
            <text
              key={label}
              x={labelPos.x} y={labelPos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={7} fill={color} fontWeight="700"
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
              opacity={isMain ? 1 : 0.7}
            >{label}</text>
          );
        })}

        {/* ── CENTER CIRCLE ── */}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* ── TOOLTIP ── */}
        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x, 90), SVG_SIZE - 90);
          const ty = Math.max(tooltip.y - 32, 6);
          return (
            <g className="pointer-events-none">
              <rect x={tx - 85} y={ty} width={170} height={22} rx={4} fill="#1E293B" opacity={0.93} />
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
