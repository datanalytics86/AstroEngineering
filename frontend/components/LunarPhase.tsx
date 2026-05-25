"use client";

import type { LunarInfo } from "@/lib/types";

interface LunarPhaseProps {
  lunar: LunarInfo;
}

/** Draw the moon disc with a terminator based on illumination + phase angle. */
function MoonSVG({ phaseAngle, illumination }: { phaseAngle: number; illumination: number }) {
  const R = 28;
  const cx = 36;
  const cy = 36;
  const size = 72;

  // Determine if waxing or waning
  const isWaxing = phaseAngle <= 180;

  // Build the moon disc path: left and right halves with the terminator
  // The terminator ellipse x-radius shrinks from R → 0 → R
  // At new moon (0°): dark disc; at full (180°): fully lit.
  // termX scales the ellipse axis: positive = bulge right (waxing lit on right)
  const termX = R * Math.abs(Math.cos(phaseAngle * Math.PI / 180));
  const litRight = isWaxing;

  // We draw:
  //  - Dark half of disc
  //  - Lit half of disc
  // Path: arc from top to bottom on "lit" side, terminator ellipse back
  const topX = cx;
  const topY = cy - R;
  const botX = cx;
  const botY = cy + R;

  // Lit half = arc from top to bottom on one side + ellipse (terminator) back
  // sweep direction: 1 = clockwise
  const arcSweep = litRight ? 1 : 0;   // lit on right → CW arc on right side

  // Terminator: ellipse from top to bottom, bulging toward dark side
  // if waxing: terminator bulges LEFT (dark side left) → termX to the left of center
  // if waning: terminator bulges RIGHT (dark side right)
  const termDir = isWaxing ? -1 : 1;
  const ex = cx + termDir * termX;

  const litPath =
    `M ${topX} ${topY}` +
    ` A ${R} ${R} 0 0 ${arcSweep} ${botX} ${botY}` +
    ` A ${termX} ${R} 0 0 ${litRight ? 0 : 1} ${topX} ${topY}` +
    ` Z`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="moon-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Dark base disc */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="rgba(15,23,42,0.9)"
        stroke="rgba(148,163,184,0.2)"
        strokeWidth="1"
      />
      {/* Lit portion */}
      {illumination > 0.02 && (
        <path
          d={litPath}
          fill="rgba(226,232,240,0.88)"
          filter="url(#moon-glow)"
        />
      )}
      {/* Full moon special case */}
      {illumination > 0.97 && (
        <circle
          cx={cx}
          cy={cy}
          r={R - 0.5}
          fill="rgba(226,232,240,0.88)"
          filter="url(#moon-glow)"
        />
      )}
      {/* Disc border */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="rgba(148,163,184,0.15)"
        strokeWidth="1"
      />
    </svg>
  );
}

export default function LunarPhase({ lunar }: LunarPhaseProps) {
  const isTurnPoint = lunar.phase_name === "Luna nueva" || lunar.phase_name === "Luna llena";
  const illumPct = Math.round(lunar.illumination * 100);

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: isTurnPoint
          ? "1px solid rgba(245,158,11,0.25)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Moon disc */}
      <div className="shrink-0">
        <MoonSVG phaseAngle={lunar.phase_angle} illumination={lunar.illumination} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-sm font-mono font-semibold"
            style={{ color: isTurnPoint ? "#F59E0B" : "#CBD5E1" }}
          >
            {lunar.phase_name}
          </span>
          {isTurnPoint && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded border"
              style={{
                color: "#F59E0B",
                borderColor: "rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)",
              }}
            >
              posible giro
            </span>
          )}
          {lunar.mercury_retrograde && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded border"
              style={{
                color: "#A78BFA",
                borderColor: "rgba(167,139,250,0.3)",
                background: "rgba(167,139,250,0.08)",
              }}
            >
              ☿ Mercurio Rx
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-mono" style={{ color: "rgba(148,163,184,0.5)" }}>
          <span>Iluminación {illumPct}%</span>
          <span>Sep Sol-Luna {lunar.phase_angle.toFixed(0)}°</span>
        </div>

        {lunar.note && (
          <p className="text-xs font-mono leading-relaxed" style={{ color: "rgba(148,163,184,0.4)" }}>
            {lunar.note}
          </p>
        )}
      </div>
    </div>
  );
}
