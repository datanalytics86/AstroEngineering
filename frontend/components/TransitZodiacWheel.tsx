"use client";

/**
 * TransitZodiacWheel — biwheel estilo astro.com
 *
 * Capas (exterior → interior):
 *  1. Anillo zodiacal (30° × 12, colores de elemento)
 *  2. Marcas de grado (1°/5°/10°) sobre el anillo zodiacal
 *  3. Agujas + esferas 3D de planetas en TRÁNSITO (anillo exterior)
 *  4. Separador grueso
 *  5. Agujas + gliphs de planetas NATALES (anillo interior)
 *  6. Líneas de cúspide de casa
 *  7. Líneas de aspecto natal→natal (núcleo)
 *  8. Líneas de aspecto tránsito→natal (punteadas, núcleo)
 *  9. Números de casa
 * 10. Etiquetas ASC/DSC/MC/IC
 * 11. Tooltip SVG
 */

import { useMemo, useState } from "react";
import type { PlanetPosition, HouseCusp, AnglePoint, Aspect, TransitEvent } from "@/lib/types";
import {
  SIGN_SYMBOLS,
  SIGN_NAMES,
  SIGN_ELEMENT_COLOR,
  SIGN_ELEMENT_BG,
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
  natalPlanets: PlanetPosition[];
  natalHouses?: HouseCusp[];
  ascendant?: AnglePoint;
  midheaven?: AnglePoint;
  natalAspects?: Aspect[];
  transitPlanets: TransitPlanetDot[];
  transitEvents?: TransitEvent[];
}

// ── Geometría ──────────────────────────────────────────────────────────────────
const SVG_SIZE = 560;
const cx = SVG_SIZE / 2;
const cy = SVG_SIZE / 2;

const R_ZODIAC_OUT = 270;
const R_ZODIAC_IN  = 222;

// Anillo tránsito
const R_TR_NEEDLE_OUT  = 220; // inicio de aguja (borde interno zodíaco)
const R_TR_NEEDLE_IN   = 204; // fin de aguja
const R_TR_GLYPH       = 195; // centro de la esfera transitante
const R_TR_DEGREE      = 181; // texto de grado transitante (empujado un poco más adentro)

// Separador
const R_SEP = 176;

// Anillo natal
const R_NA_NEEDLE_OUT  = 174;
const R_NA_NEEDLE_IN   = 160;
const R_NA_GLYPH       = 151;
const R_NA_DEGREE      = 140;

// Casas y núcleo
const R_HOUSES_OUT = 174;
const R_HOUSE_NUM  = 112;
const R_CORE       = 94;
const R_CENTER     = 26;

// Radio de la esfera 3D de tránsito
const R_SPHERE = 9;

// ── Colores por planeta ────────────────────────────────────────────────────────
const TRANSIT_COLORS: Record<string, string> = {
  Plutón: "#7C3AED", Neptuno: "#3B82F6", Urano: "#06B6D4",
  Saturno: "#F59E0B", Júpiter: "#10B981", Marte: "#EF4444",
  Sol: "#F97316", Luna: "#64748B", Mercurio: "#6366F1",
  Venus: "#EC4899", "Nodo Norte": "#94A3B8", Quirón: "#8B5CF6",
};

const ASPECT_WIDTH: Record<string, number> = {
  Conjunción: 1.4, Oposición: 1.3, Cuadratura: 1.2,
  Trígono: 0.9, Sextil: 0.9,
};

const SHOW_ASPECTS = new Set(["Conjunción", "Oposición", "Cuadratura", "Trígono", "Sextil"]);

// ── Colisiones mejoradas ───────────────────────────────────────────────────────
// Distribuye clusters densos alternando offsets ±18/±14 para evitar solapamientos
// con las esferas más grandes (R_SPHERE=9).
function resolveCollisions<T extends { longitude: number }>(
  planets: T[],
  minAngDeg = 7,
): (T & { rOffset: number })[] {
  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const offsets: number[] = new Array(sorted.length).fill(0);

  // Primera pasada: detectar grupos de planetas cercanos
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const diff = ((next.longitude - sorted[i].longitude + 360) % 360);
    if (diff < minAngDeg) {
      // Alternar desplazamiento: par→+0, impar→-18
      // Para clusters de 3+, también desplazamos el par hacia +14
      const clusterPos = offsets[i] === 0 && offsets[(i + 1) % sorted.length] === 0;
      if (clusterPos) {
        offsets[i] = 0;
        offsets[(i + 1) % sorted.length] = -18;
      }
    }
  }

  // Segunda pasada: si algún -18 está demasiado cerca de otro 0, separar más
  for (let i = 0; i < sorted.length; i++) {
    if (offsets[i] === -18) {
      // Revisar si el planeta anterior también tiene offset 0 muy cerca
      const prev = (i - 1 + sorted.length) % sorted.length;
      const diffPrev = ((sorted[i].longitude - sorted[prev].longitude + 360) % 360);
      if (diffPrev < minAngDeg && offsets[prev] === 0) {
        // Separar más: anterior +14, actual -18
        offsets[prev] = 14;
      }
    }
  }

  return sorted.map((p, i) => ({ ...p, rOffset: offsets[i] }));
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
interface Tooltip { x: number; y: number; text: string; sub: string }

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

  const ascLon  = ascendant?.longitude ?? 0;
  const toAngle = useMemo(() => makeToAngle(ascLon), [ascLon]);

  // ── Zodiac sectors ──────────────────────────────────────────────────────────
  const zodiacSectors = useMemo(() =>
    SIGN_NAMES.map((name, i) => {
      const startDeg = toAngle(i * 30);
      return { name, i, startDeg, endDeg: startDeg + 30, symbol: SIGN_SYMBOLS[i] };
    }),
  [toAngle]);

  // ── Degree ticks ────────────────────────────────────────────────────────────
  const ticks = useMemo(() => {
    const result: { p1: { x: number; y: number }; p2: { x: number; y: number }; w: number; c: string }[] = [];
    for (let d = 0; d < 360; d++) {
      const ang   = toAngle(d);
      const len   = d % 10 === 0 ? 11 : d % 5 === 0 ? 7 : 4;
      const w     = d % 10 === 0 ? 0.8 : 0.4;
      const color = d % 10 === 0 ? "#CBD5E1" : "#E2E8F0";
      result.push({
        p1: polarXY(cx, cy, R_ZODIAC_OUT, ang),
        p2: polarXY(cx, cy, R_ZODIAC_OUT - len, ang),
        w, c: color,
      });
    }
    return result;
  }, [toAngle]);

  // ── Degree labels inside zodiac (0°, 10°, 20° per sign) ────────────────────
  const degLabels = useMemo(() => {
    const labels: { pos: { x: number; y: number }; text: string }[] = [];
    for (let sign = 0; sign < 12; sign++) {
      for (const deg of [10, 20]) {
        const lon = sign * 30 + deg;
        const ang = toAngle(lon);
        labels.push({
          pos: polarXY(cx, cy, R_ZODIAC_IN + 9, ang),
          text: `${deg}`,
        });
      }
    }
    return labels;
  }, [toAngle]);

  // ── Transit planets with collision offsets ──────────────────────────────────
  const transitDots = useMemo(() => resolveCollisions(transitPlanets), [transitPlanets]);

  // ── Natal planets with collision offsets ───────────────────────────────────
  const natalDots = useMemo(() => resolveCollisions(natalPlanets), [natalPlanets]);

  // ── Transit → natal aspect lines ───────────────────────────────────────────
  const trNatalLines = useMemo(() => {
    if (!transitEvents?.length) return [];
    const seen = new Set<string>();
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string; w: number }[] = [];
    for (const te of transitEvents) {
      if (!SHOW_ASPECTS.has(te.aspect_name)) continue;
      const key = `${te.transit_planet}_${te.aspect_name}_${te.natal_planet}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tp = transitPlanets.find((p) => p.name === te.transit_planet);
      const np = natalPlanets.find((p) => p.name === te.natal_planet);
      if (!tp || !np) continue;
      const a1 = toAngle(tp.longitude);
      const a2 = toAngle(np.longitude);
      const p1 = polarXY(cx, cy, R_CORE * 0.88, a1);
      const p2 = polarXY(cx, cy, R_CORE * 0.88, a2);
      lines.push({
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        color: ASPECT_COLORS[te.nature] ?? "#94A3B8",
        w: ASPECT_WIDTH[te.aspect_name] ?? 0.8,
      });
    }
    return lines;
  }, [transitEvents, transitPlanets, natalPlanets, toAngle]);

  // ── Natal → natal aspect lines ─────────────────────────────────────────────
  const natalLines = useMemo(() => {
    if (!natalAspects?.length) return [];
    const major = natalAspects.filter((a) => SHOW_ASPECTS.has(a.aspect_name));
    const map   = Object.fromEntries(natalPlanets.map((p) => [p.name, p]));
    return major.map((asp) => {
      const p1 = map[asp.planet1];
      const p2 = map[asp.planet2];
      if (!p1 || !p2) return null;
      const a1 = toAngle(p1.longitude);
      const a2 = toAngle(p2.longitude);
      const pt1 = polarXY(cx, cy, R_CORE * 0.93, a1);
      const pt2 = polarXY(cx, cy, R_CORE * 0.93, a2);
      return {
        x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y,
        color: ASPECT_COLORS[asp.nature] ?? "#94A3B8",
        w: ASPECT_WIDTH[asp.aspect_name] ?? 0.7,
      };
    }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; color: string; w: number }[];
  }, [natalAspects, natalPlanets, toAngle]);

  // ── House number positions ─────────────────────────────────────────────────
  const houseLabels = useMemo(() => {
    if (!natalHouses?.length) return [];
    return natalHouses.map((house, idx) => {
      const nextCusp = natalHouses[(idx + 1) % 12].cusp_longitude;
      let a1 = toAngle(house.cusp_longitude);
      let a2 = toAngle(nextCusp);
      if (a2 <= a1) a2 += 360;
      return { number: house.number, pos: polarXY(cx, cy, R_HOUSE_NUM, (a1 + a2) / 2) };
    });
  }, [natalHouses, toAngle]);

  // ── Tooltip helper ─────────────────────────────────────────────────────────
  function showTip(e: React.MouseEvent<SVGElement>, text: string, sub: string) {
    const rect  = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    const sx    = SVG_SIZE / rect.width;
    const sy    = SVG_SIZE / rect.height;
    setTooltip({ x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy, text, sub });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full max-w-[560px]"
        style={{ fontFamily: "monospace" }}
      >
        {/* ── SVG Defs: gradiente esfera 3D + sombra ── */}
        <defs>
          <radialGradient id="tz-sphere" cx="0.35" cy="0.30" r="0.75">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="38%"  stopColor="#ffffff" stopOpacity={0} />
            <stop offset="100%" stopColor="#0b1220" stopOpacity={0.40} />
          </radialGradient>
          <filter id="tz-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx={0} dy={1.3} stdDeviation={1.5} floodColor="#0f172a" floodOpacity={0.35} />
          </filter>
        </defs>

        {/* ── White background ── */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_OUT} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* ── Zodiac ring sectors ── */}
        {zodiacSectors.map(({ name, startDeg, endDeg, symbol }) => {
          const midDeg = startDeg + 15;
          const mid    = polarXY(cx, cy, (R_ZODIAC_IN + R_ZODIAC_OUT) / 2, midDeg);
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
              {/* Glifo del signo */}
              <text
                x={mid.x} y={mid.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={15} fill={color}
                className="select-none pointer-events-none"
              >{symbol}</text>
            </g>
          );
        })}

        {/* ── Degree ticks ── */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y}
            stroke={t.c} strokeWidth={t.w} />
        ))}

        {/* ── 10°/20° labels inside zodiac ring ── */}
        {degLabels.map((l, i) => (
          <text key={i} x={l.pos.x} y={l.pos.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={6.5} fill="#CBD5E1"
            className="select-none pointer-events-none"
          >{l.text}</text>
        ))}

        {/* ── Inner zodiac boundary ── */}
        <circle cx={cx} cy={cy} r={R_ZODIAC_IN} fill="none" stroke="#CBD5E1" strokeWidth={1} />

        {/* ── Transit planet spheres ── */}
        {transitDots.map((p) => {
          const ang    = toAngle(p.longitude);
          const col    = TRANSIT_COLORS[p.name] ?? "#3B82F6";
          const rG     = R_TR_GLYPH + p.rOffset;
          const rD     = R_TR_DEGREE + p.rOffset;
          const nOut   = polarXY(cx, cy, R_TR_NEEDLE_OUT, ang);
          const nIn    = polarXY(cx, cy, R_TR_NEEDLE_IN, ang);
          const gPos   = polarXY(cx, cy, rG, ang);
          const dPos   = polarXY(cx, cy, rD, ang);
          const degNum = Math.floor(p.longitude % 30);
          const degText = `${degNum}°`;

          // Posición del marcador de movimiento (top-right del sphere)
          const markerX = gPos.x + R_SPHERE * 0.65;
          const markerY = gPos.y - R_SPHERE * 0.85;

          return (
            <g key={`tr-${p.name}`}>
              {/* Dot en el borde interior del zodíaco */}
              <circle cx={nOut.x} cy={nOut.y} r={2.2} fill={col} />
              {/* Aguja */}
              <line x1={nOut.x} y1={nOut.y} x2={nIn.x} y2={nIn.y}
                stroke={col} strokeWidth={0.7} opacity={0.6} />

              {/* ── Esfera 3D: base sólida + overlay gradiente iluminado ── */}
              <circle cx={gPos.x} cy={gPos.y} r={R_SPHERE} fill={col} filter="url(#tz-shadow)" />
              <circle cx={gPos.x} cy={gPos.y} r={R_SPHERE} fill="url(#tz-sphere)" />

              {/* Anillo rojo de retrógrado (alrededor de la esfera) */}
              {p.retrograde && (
                <circle
                  cx={gPos.x} cy={gPos.y}
                  r={R_SPHERE + 1.6}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth={1.5}
                />
              )}

              {/* Glifo del planeta (blanco, centrado en la esfera) */}
              <text
                x={gPos.x} y={gPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={12} fill="#ffffff" fontWeight="700"
                className="select-none pointer-events-none"
              >{p.symbol}</text>

              {/* ── Indicador de movimiento ── */}
              {p.retrograde ? (
                /* RETRÓGRADO: ℞ rojo llamativo + flecha curva hacia atrás */
                <g className="select-none pointer-events-none">
                  {/* "℞" en rojo bold, top-right de la esfera */}
                  <text
                    x={markerX} y={markerY}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={9} fill="#EF4444" fontWeight="700"
                  >℞</text>
                  {/* Flecha curva retrógrada (↺) justo debajo del ℞ */}
                  <text
                    x={markerX} y={markerY + 10}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={9} fill="#EF4444" fontWeight="700"
                  >↺</text>
                </g>
              ) : (
                /* DIRECTO: chevron › suave y apagado */
                <text
                  x={markerX} y={markerY}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fill="#94A3B8" opacity={0.55}
                  fontWeight="400"
                  className="select-none pointer-events-none"
                >›</text>
              )}

              {/* Etiqueta de grado (fuera/dentro de la esfera, no solapada) */}
              <text
                x={dPos.x} y={dPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={7} fill={col} opacity={0.80}
                className="select-none pointer-events-none"
              >{degText}</text>

              {/* Hit area transparente para tooltip */}
              <circle
                cx={gPos.x} cy={gPos.y}
                r={R_SPHERE}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(e) =>
                  showTip(
                    e,
                    `${p.name} (tránsito)`,
                    `${degNum}° ${p.retrograde ? "℞ retrógrado" : "directo"}`,
                  )
                }
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}

        {/* ── Separator ring ── */}
        <circle cx={cx} cy={cy} r={R_SEP} fill="white" stroke="#94A3B8" strokeWidth={2} />

        {/* ── House cusp lines ── */}
        {natalHouses?.map((house) => {
          const ang      = toAngle(house.cusp_longitude);
          const isAngular = [1, 4, 7, 10].includes(house.number);
          const outer    = polarXY(cx, cy, R_HOUSES_OUT, ang);
          const inner    = polarXY(cx, cy, R_CORE, ang);
          return (
            <line key={house.number}
              x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke={isAngular ? "#2563EB" : "#CBD5E1"}
              strokeWidth={isAngular ? 1.5 : 0.6}
              strokeDasharray={isAngular ? undefined : "3,4"}
            />
          );
        })}

        {/* ── Transit → natal aspects (dashed) ── */}
        {trNatalLines.map((l, i) => (
          <line key={`tra-${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color} strokeWidth={l.w}
            opacity={0.55} strokeDasharray="4,3"
          />
        ))}

        {/* ── Natal → natal aspects ── */}
        {natalLines.map((l, i) => (
          <line key={`na-${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color} strokeWidth={l.w} opacity={0.65}
          />
        ))}

        {/* ── Core circle ── */}
        <circle cx={cx} cy={cy} r={R_CORE} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* ── Natal planet needles + glyphs (flat, subordinate) ── */}
        {natalDots.map((p) => {
          const ang  = toAngle(p.longitude);
          const rG   = R_NA_GLYPH + p.rOffset;
          const rD   = R_NA_DEGREE + p.rOffset;
          const nOut = polarXY(cx, cy, R_NA_NEEDLE_OUT, ang);
          const nIn  = polarXY(cx, cy, R_NA_NEEDLE_IN, ang);
          const gPos = polarXY(cx, cy, rG, ang);
          const dPos = polarXY(cx, cy, rD, ang);
          const degText = `${Math.floor(p.longitude % 30)}°`;
          return (
            <g key={`na-${p.name}`}>
              {/* Dot en separador */}
              <circle cx={nOut.x} cy={nOut.y} r={2} fill="#1E293B" />
              {/* Aguja */}
              <line x1={nOut.x} y1={nOut.y} x2={nIn.x} y2={nIn.y}
                stroke="#64748B" strokeWidth={0.6} />
              {/* Glifo */}
              <text
                x={gPos.x} y={gPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={12} fill="#1E293B" fontWeight="600"
                className="cursor-pointer select-none"
                onMouseEnter={(e) => showTip(e, `${p.name} natal`, `${p.degree_display} ${p.sign}${p.retrograde ? " ℞" : ""}`)}
                onMouseLeave={() => setTooltip(null)}
              >{p.symbol}</text>
              {/* Grado */}
              <text
                x={dPos.x} y={dPos.y}
                textAnchor="middle" dominantBaseline="central"
                fontSize={6.5} fill="#94A3B8"
                className="select-none pointer-events-none"
              >{degText}</text>
              {/* Retrógrado natal: pequeño, discreto */}
              {p.retrograde && (
                <text
                  x={gPos.x + 9} y={gPos.y - 8}
                  fontSize={7} fill="#EF4444"
                  className="select-none pointer-events-none"
                >℞</text>
              )}
            </g>
          );
        })}

        {/* ── House number labels ── */}
        {houseLabels.map(({ number, pos }) => (
          <text key={number}
            x={pos.x} y={pos.y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={9} fill="#94A3B8"
            className="select-none pointer-events-none"
          >{number}</text>
        ))}

        {/* ── Center circle ── */}
        <circle cx={cx} cy={cy} r={R_CENTER} fill="white" stroke="#E2E8F0" strokeWidth={1} />

        {/* ── ASC / DSC / MC / IC ── */}
        {(
          [
            ascendant  ? { lon: ascendant.longitude,               label: "ASC", color: "#2563EB" } : null,
            ascendant  ? { lon: (ascendant.longitude + 180) % 360, label: "DSC", color: "#94A3B8" } : null,
            midheaven  ? { lon: midheaven.longitude,               label: "MC",  color: "#0EA5E9" } : null,
            midheaven  ? { lon: (midheaven.longitude + 180) % 360, label: "IC",  color: "#94A3B8" } : null,
          ] as Array<{ lon: number; label: string; color: string } | null>
        ).filter((x): x is { lon: number; label: string; color: string } => x !== null)
         .map(({ lon, label, color }) => {
          const ang = toAngle(lon);
          const pos = polarXY(cx, cy, R_ZODIAC_IN - 16, ang);
          return (
            <text key={label}
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize={8} fill={color} fontWeight="700"
              className="select-none pointer-events-none"
            >{label}</text>
          );
        })}

        {/* ── Tooltip ── */}
        {tooltip && (() => {
          const tx = Math.min(Math.max(tooltip.x, 75), SVG_SIZE - 75);
          const ty = Math.max(tooltip.y - 40, 8);
          return (
            <g>
              <rect x={tx - 72} y={ty} width={144} height={38} rx={5} fill="#1E293B" opacity={0.93} />
              <text x={tx} y={ty + 13} textAnchor="middle" fontSize={9} fill="white" fontWeight="600">
                {tooltip.text}
              </text>
              <text x={tx} y={ty + 27} textAnchor="middle" fontSize={8} fill="#94A3B8">
                {tooltip.sub}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* ── Leyenda ── */}
      <div className="w-full max-w-[560px] space-y-2 text-xs font-mono">
        {/* Planetas transitantes */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-slate-500 font-semibold">Tránsitos:</span>
          {(["Plutón","Saturno","Júpiter","Urano","Neptuno","Marte"] as const).map((p) => (
            <span key={p} className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TRANSIT_COLORS[p], display: "inline-block" }} />
              {p}
            </span>
          ))}
        </div>
        {/* Movimiento de tránsito */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 items-center">
          <span className="text-slate-500 font-semibold">Movimiento:</span>
          {/* Directo */}
          <span className="flex items-center gap-1.5 text-slate-500">
            <span
              className="inline-flex items-center justify-center rounded-full w-4 h-4"
              style={{ background: "#3B82F6" }}
              aria-hidden="true"
            >
              <span style={{ color: "#ffffff", fontSize: 8, fontWeight: 700, lineHeight: 1 }}>♆</span>
            </span>
            <span className="text-slate-400">directo</span>
          </span>
          {/* Retrógrado */}
          <span className="flex items-center gap-1.5 text-slate-500">
            <span
              className="inline-flex items-center justify-center rounded-full w-4 h-4"
              style={{ background: "#7C3AED", outline: "2px solid #EF4444", outlineOffset: "1px" }}
              aria-hidden="true"
            >
              <span style={{ color: "#ffffff", fontSize: 8, fontWeight: 700, lineHeight: 1 }}>♇</span>
            </span>
            <span className="text-red-500 font-semibold">℞ retrógrado</span>
          </span>
        </div>
        {/* Aspectos */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400">
          <span className="text-slate-500 font-semibold">Aspectos:</span>
          {[
            { name: "Conjunción", sym: "☌", nature: "neutro"     },
            { name: "Oposición",  sym: "☍", nature: "tenso"      },
            { name: "Cuadratura", sym: "□",  nature: "tenso"      },
            { name: "Trígono",    sym: "△",  nature: "armonioso"  },
            { name: "Sextil",     sym: "⚹",  nature: "armonioso"  },
          ].map(({ name, sym, nature }) => (
            <span key={name} className="flex items-center gap-1">
              <span style={{ color: ASPECT_COLORS[nature] }}>{sym}</span>
              {name}
            </span>
          ))}
          <span className="text-slate-300">· sólido = natal·natal · punteado = tránsito·natal</span>
        </div>
      </div>
    </div>
  );
}
