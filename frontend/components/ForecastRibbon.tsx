"use client";

import { useState } from "react";
import type { MonthlySignal } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ForecastRibbonProps {
  monthly_signals: MonthlySignal[];
}

const SIGNAL_COLORS = {
  LONG:    "#22C55E",
  SHORT:   "#EF4444",
  NEUTRAL: "#F59E0B",
};

const W = 700;
const H = 160;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 16;
const PAD_B = 28;   // space for labels

const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;
const ZERO_Y  = PAD_T + CHART_H / 2;   // y position of y=0

function consensusToY(v: number): number {
  // v ∈ [-1,+1]; +1 → top (PAD_T), -1 → bottom (PAD_T + CHART_H)
  return PAD_T + (1 - v) * (CHART_H / 2);
}

function monthX(i: number, total: number): number {
  return PAD_L + (i + 0.5) * (CHART_W / total);
}

/** Build a smooth SVG polyline path (simple Catmull-Rom via control points). */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX1 = prev.x + (curr.x - prev.x) / 3;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (2 * (curr.x - prev.x)) / 3;
    const cpY2 = curr.y;
    d += ` C ${cpX1} ${cpY1} ${cpX2} ${cpY2} ${curr.x} ${curr.y}`;
  }
  return d;
}

/** Build filled area path from a smooth curve, clipped at zero. */
function buildAreaPath(
  points: { x: number; y: number }[],
  zeroY: number,
  above: boolean,   // true = bullish area above zero line
): string {
  if (points.length === 0) return "";

  // Filter only the side we want
  const relevant = points.map((p) => ({
    x: p.x,
    y: above ? Math.min(p.y, zeroY) : Math.max(p.y, zeroY),
  }));

  const curve = smoothPath(relevant);
  const lastX  = relevant[relevant.length - 1].x;
  const firstX = relevant[0].x;

  return `${curve} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
}

export default function ForecastRibbon({ monthly_signals }: ForecastRibbonProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!monthly_signals || monthly_signals.length === 0) return null;

  const total = monthly_signals.length;

  // Build (x, y) for each month using consensus
  const pts = monthly_signals.map((ms, i) => ({
    x: monthX(i, total),
    y: consensusToY(ms.consensus ?? 0),
  }));

  const bullishArea = buildAreaPath(pts, ZERO_Y, true);
  const bearishArea = buildAreaPath(pts, ZERO_Y, false);
  const linePath    = smoothPath(pts);

  const colW = CHART_W / total;

  return (
    <div
      className="rounded-2xl p-5 space-y-2"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <h2
        className="text-sm font-mono uppercase tracking-widest"
        style={{ color: "rgba(148,163,184,0.5)" }}
      >
        Pronóstico de consenso — 12 meses
      </h2>

      <div className="overflow-x-auto">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: "320px" }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="grad-bull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22C55E" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="grad-bear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#EF4444" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.35" />
            </linearGradient>
            <filter id="line-glow" x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Bullish area */}
          <path d={bullishArea} fill="url(#grad-bull)" />
          {/* Bearish area */}
          <path d={bearishArea} fill="url(#grad-bear)" />

          {/* Zero gridline */}
          <line
            x1={PAD_L}
            y1={ZERO_Y}
            x2={W - PAD_R}
            y2={ZERO_Y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          {/* +0.15 and -0.15 threshold lines */}
          <line x1={PAD_L} y1={consensusToY(0.15)}  x2={W - PAD_R} y2={consensusToY(0.15)}  stroke="rgba(34,197,94,0.15)"  strokeWidth="1" strokeDasharray="3 4" />
          <line x1={PAD_L} y1={consensusToY(-0.15)} x2={W - PAD_R} y2={consensusToY(-0.15)} stroke="rgba(239,68,68,0.15)" strokeWidth="1" strokeDasharray="3 4" />

          {/* +1 / -1 labels */}
          <text x={PAD_L - 2} y={PAD_T + 4}          fill="rgba(34,197,94,0.4)"  fontSize="7" fontFamily="JetBrains Mono, monospace" textAnchor="end" dominantBaseline="middle">+1</text>
          <text x={PAD_L - 2} y={ZERO_Y}             fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="JetBrains Mono, monospace" textAnchor="end" dominantBaseline="middle">0</text>
          <text x={PAD_L - 2} y={PAD_T + CHART_H - 4} fill="rgba(239,68,68,0.4)" fontSize="7" fontFamily="JetBrains Mono, monospace" textAnchor="end" dominantBaseline="middle">-1</text>

          {/* Hover columns */}
          {monthly_signals.map((ms, i) => (
            <rect
              key={ms.month}
              x={PAD_L + i * colW}
              y={PAD_T}
              width={colW}
              height={CHART_H}
              fill={hoverIdx === i ? "rgba(255,255,255,0.04)" : "transparent"}
              style={{ cursor: "default" }}
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}

          {/* Curve line — drawn last for glow to appear above fills */}
          <path
            d={linePath}
            fill="none"
            stroke="rgba(148,163,184,0.5)"
            strokeWidth="1.5"
            filter="url(#line-glow)"
          />

          {/* Active segment highlight */}
          {hoverIdx !== null && pts[hoverIdx] && (
            <>
              <circle
                cx={pts[hoverIdx].x}
                cy={pts[hoverIdx].y}
                r={4}
                fill={SIGNAL_COLORS[monthly_signals[hoverIdx].direction]}
                filter="url(#line-glow)"
              />
              {/* Vertical drop to zero */}
              <line
                x1={pts[hoverIdx].x}
                y1={pts[hoverIdx].y}
                x2={pts[hoverIdx].x}
                y2={ZERO_Y}
                stroke={SIGNAL_COLORS[monthly_signals[hoverIdx].direction]}
                strokeWidth="1"
                strokeDasharray="3 2"
                opacity="0.5"
              />
            </>
          )}

          {/* Month labels on X axis */}
          {monthly_signals.map((ms, i) => {
            const [y, m] = ms.month.split("-");
            const lbl = format(new Date(+y, +m - 1, 1), "MMM", { locale: es });
            return (
              <text
                key={ms.month}
                x={monthX(i, total)}
                y={H - 8}
                textAnchor="middle"
                fill={hoverIdx === i ? "rgba(255,255,255,0.7)" : "rgba(148,163,184,0.35)"}
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                style={{ transition: "fill 0.15s" }}
              >
                {lbl}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip */}
      {hoverIdx !== null && monthly_signals[hoverIdx] && (() => {
        const ms = monthly_signals[hoverIdx];
        const [y, m] = ms.month.split("-");
        const lbl = format(new Date(+y, +m - 1, 1), "MMMM yyyy", { locale: es });
        const sc = SIGNAL_COLORS[ms.direction];
        const confPct = Math.round(ms.confidence * 100);
        const cons = ms.consensus ?? 0;
        return (
          <div
            className="rounded-xl px-4 py-3 flex flex-wrap items-center gap-4 text-xs font-mono"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${sc}40`,
            }}
          >
            <span style={{ color: "rgba(148,163,184,0.6)", textTransform: "capitalize" }}>{lbl}</span>
            <span className="font-bold" style={{ color: sc }}>{ms.direction}</span>
            <span style={{ color: "rgba(148,163,184,0.5)" }}>consenso {cons >= 0 ? "+" : ""}{(cons * 100).toFixed(0)}%</span>
            <span style={{ color: "rgba(148,163,184,0.5)" }}>confianza {confPct}%</span>
            {ms.dominant_theme && (
              <span style={{ color: "rgba(148,163,184,0.4)" }}>{ms.dominant_theme}</span>
            )}
          </div>
        );
      })()}

      {/* Mini monthly direction strip */}
      <div className="flex gap-1 pt-1">
        {monthly_signals.map((ms, i) => {
          const sc = SIGNAL_COLORS[ms.direction];
          return (
            <div
              key={ms.month}
              className="flex-1 h-1.5 rounded-full transition-opacity"
              style={{
                background: sc,
                opacity: hoverIdx === i ? 1 : 0.4,
              }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          );
        })}
      </div>
    </div>
  );
}
