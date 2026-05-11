"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

const ELEMENT_COLORS: Record<string, string> = {
  Wood: "#4CAF50", Fire: "#EF4444", Earth: "#EAB308",
  Metal: "#9CA3AF", Water: "#3B82F6",
};

export default function YearForecast({ data }: { data: BaZiResponse }) {
  const yr = data.current_year;

  return (
    <div>
      <div className="rounded-xl border border-[#C9A84C]/40 bg-[#1E293B] p-4 mb-4 flex gap-4 items-center">
        <span className="text-4xl font-bold text-[#C9A84C]">{yr.pillar}</span>
        <div>
          <div className="text-slate-200">{yr.stem?.pinyin} {yr.branch?.pinyin}</div>
          <div className="text-slate-400 text-sm">Año {yr.year} · {yr.branch?.animal}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {yr.months.map((m) => (
          <div key={m.month_number}
            className="rounded-lg border border-[#334155] bg-[#151E2E] p-2 flex flex-col items-center gap-0.5">
            <span className="text-xs text-slate-500">Mes {m.month_number}</span>
            <span className="text-lg font-bold text-[#C9A84C]">{m.pillar_display}</span>
            <span className="text-xs text-slate-400">{m.animal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
