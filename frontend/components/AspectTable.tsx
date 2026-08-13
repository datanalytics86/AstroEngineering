"use client";

import { useState } from "react";
import type { Aspect } from "@/lib/types";
import { ASPECT_COLORS } from "@/lib/zodiac-utils";
import { useT } from "@/lib/i18n";

interface Props {
  aspects: Aspect[];
  highlightedPlanet?: string;
}

const VISIBLE_COUNT = 8;

export default function AspectTable({ aspects, highlightedPlanet }: Props) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);

  const filtered = highlightedPlanet
    ? aspects.filter((a) => a.planet1 === highlightedPlanet || a.planet2 === highlightedPlanet)
    : aspects;

  const sorted = [...filtered].sort((a, b) => a.orb - b.orb);
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT);
  const hasMore = sorted.length > VISIBLE_COUNT;

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-widest text-ink-3 font-mono">Aspectos</h3>
        <span className="text-xs text-ink-3 font-mono">{sorted.length} aspectos</span>
      </div>
      <div>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-xs text-ink-3 uppercase">
              <th className="text-left px-4 py-2">Planeta 1</th>
              <th className="text-center px-4 py-2">Aspecto</th>
              <th className="text-left px-4 py-2">Planeta 2</th>
              <th className="text-right px-4 py-2">Orbe</th>
              <th className="text-center px-4 py-2">Apl.</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a, idx) => (
              <tr
                key={idx}
                className="border-t border-border hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-2 text-slate-700">{a.planet1}</td>
                <td className="px-4 py-2 text-center">
                  <span style={{ color: ASPECT_COLORS[a.nature] }} className="text-lg" title={a.aspect_name}>
                    {a.aspect_symbol}
                  </span>
                  <span className="ml-1 text-xs text-ink-3">{a.aspect_name}</span>
                </td>
                <td className="px-4 py-2 text-slate-700">{a.planet2}</td>
                <td className="px-4 py-2 text-right text-slate-500">
                  {a.orb.toFixed(2)}°
                </td>
                <td className="px-4 py-2 text-center">
                  {a.applying ? (
                    <span className="text-emerald-500 text-xs">↗</span>
                  ) : (
                    <span className="text-slate-300 text-xs">↘</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="px-4 py-2.5 border-t border-border">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-center text-xs font-mono text-blue-600 border border-blue-200 bg-blue-50 rounded-lg py-2 hover:bg-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            {expanded ? t("chart.aspects.show_less") : `${t("chart.aspects.show_all")} (${sorted.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
