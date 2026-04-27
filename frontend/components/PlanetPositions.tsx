"use client";

import type { PlanetPosition } from "@/lib/types";
import { signColor, getPlanetDignity, DIGNITY_SYMBOL, DIGNITY_COLOR } from "@/lib/zodiac-utils";

interface Props {
  planets: PlanetPosition[];
  highlightedPlanet?: string;
  onPlanetClick?: (name: string) => void;
}

export default function PlanetPositions({ planets, highlightedPlanet, onPlanetClick }: Props) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm uppercase tracking-widest text-slate-400 font-mono">
          Posiciones Planetarias
        </h3>
      </div>
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="text-xs text-slate-400 uppercase">
            <th className="text-left px-4 py-2">Planeta</th>
            <th className="text-left px-4 py-2">Signo</th>
            <th className="text-left px-4 py-2">Posición</th>
            <th className="text-center px-4 py-2">Casa</th>
            <th className="text-center px-4 py-2">D</th>
            <th className="text-center px-4 py-2">R</th>
          </tr>
        </thead>
        <tbody>
          {planets.map((p) => {
            const dignity = getPlanetDignity(p.name, p.sign);
            return (
            <tr
              key={p.name}
              onClick={() => onPlanetClick?.(p.name)}
              className={`border-t border-border cursor-pointer transition-colors ${
                highlightedPlanet === p.name
                  ? "bg-blue-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <td className="px-4 py-2.5 flex items-center gap-2">
                <span className="text-lg">{p.symbol}</span>
                <span className="text-slate-700">{p.name}</span>
              </td>
              <td className="px-4 py-2.5">
                <span style={{ color: signColor(p.sign) }}>
                  {p.sign_symbol} {p.sign}
                </span>
              </td>
              <td className="px-4 py-2.5 text-slate-500">{p.degree_display}</td>
              <td className="px-4 py-2.5 text-center text-blue-600 font-semibold">{p.house}</td>
              <td className="px-4 py-2.5 text-center">
                {dignity ? (
                  <span
                    title={dignity.charAt(0).toUpperCase() + dignity.slice(1)}
                    style={{ color: DIGNITY_COLOR[dignity] }}
                    className="text-sm font-semibold"
                  >
                    {DIGNITY_SYMBOL[dignity]}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-center">
                {p.retrograde ? (
                  <span className="text-red-500 text-xs">℞</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
