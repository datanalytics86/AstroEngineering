"use client";

import type { PlanetPosition } from "@/lib/types";
import { signColor } from "@/lib/zodiac-utils";

interface Props {
  planets: PlanetPosition[];
  highlightedPlanet?: string;
  onPlanetClick?: (name: string) => void;
}

export default function PlanetPositions({ planets, highlightedPlanet, onPlanetClick }: Props) {
  return (
    <div className="bg-space-card border border-space-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-space-border">
        <h3 className="text-sm uppercase tracking-widest text-gray-500 font-mono">
          Posiciones Planetarias
        </h3>
      </div>
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="text-xs text-gray-600 uppercase">
            <th className="text-left px-4 py-2">Planeta</th>
            <th className="text-left px-4 py-2">Signo</th>
            <th className="text-left px-4 py-2">Posición</th>
            <th className="text-center px-4 py-2">Casa</th>
            <th className="text-center px-4 py-2">R</th>
          </tr>
        </thead>
        <tbody>
          {planets.map((p) => (
            <tr
              key={p.name}
              onClick={() => onPlanetClick?.(p.name)}
              className={`border-t border-space-border cursor-pointer transition-colors ${
                highlightedPlanet === p.name
                  ? "bg-gold/10"
                  : "hover:bg-space-muted/20"
              }`}
            >
              <td className="px-4 py-2.5 flex items-center gap-2">
                <span className="text-lg">{p.symbol}</span>
                <span className="text-gray-300">{p.name}</span>
              </td>
              <td className="px-4 py-2.5">
                <span style={{ color: signColor(p.sign) }}>
                  {p.sign_symbol} {p.sign}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-400">{p.degree_display}</td>
              <td className="px-4 py-2.5 text-center text-gold">{p.house}</td>
              <td className="px-4 py-2.5 text-center">
                {p.retrograde ? (
                  <span className="text-red-400 text-xs">℞</span>
                ) : (
                  <span className="text-gray-700">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
