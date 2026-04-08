"use client";

import type { Aspect } from "@/lib/types";
import { ASPECT_COLORS } from "@/lib/zodiac-utils";

interface Props {
  aspects: Aspect[];
  highlightedPlanet?: string;
}

export default function AspectTable({ aspects, highlightedPlanet }: Props) {
  const filtered = highlightedPlanet
    ? aspects.filter((a) => a.planet1 === highlightedPlanet || a.planet2 === highlightedPlanet)
    : aspects;

  const sorted = [...filtered].sort((a, b) => a.orb - b.orb);

  return (
    <div className="bg-space-card border border-space-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-space-border flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-widest text-gray-500 font-mono">Aspectos</h3>
        <span className="text-xs text-gray-600 font-mono">{sorted.length} aspectos</span>
      </div>
      <div className="overflow-y-auto max-h-72">
        <table className="w-full text-sm font-mono">
          <thead className="sticky top-0 bg-space-card">
            <tr className="text-xs text-gray-600 uppercase">
              <th className="text-left px-4 py-2">Planeta 1</th>
              <th className="text-center px-4 py-2">Aspecto</th>
              <th className="text-left px-4 py-2">Planeta 2</th>
              <th className="text-right px-4 py-2">Orbe</th>
              <th className="text-center px-4 py-2">Apl.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, idx) => (
              <tr
                key={idx}
                className="border-t border-space-border hover:bg-space-muted/10 transition-colors"
              >
                <td className="px-4 py-2 text-gray-300">{a.planet1}</td>
                <td className="px-4 py-2 text-center">
                  <span style={{ color: ASPECT_COLORS[a.nature] }} className="text-lg" title={a.aspect_name}>
                    {a.aspect_symbol}
                  </span>
                  <span className="ml-1 text-xs text-gray-500">{a.aspect_name}</span>
                </td>
                <td className="px-4 py-2 text-gray-300">{a.planet2}</td>
                <td className="px-4 py-2 text-right text-gray-400">
                  {a.orb.toFixed(2)}°
                </td>
                <td className="px-4 py-2 text-center">
                  {a.applying ? (
                    <span className="text-green-400 text-xs">↗</span>
                  ) : (
                    <span className="text-gray-600 text-xs">↘</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
