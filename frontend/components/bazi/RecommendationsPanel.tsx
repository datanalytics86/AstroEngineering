"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

export default function RecommendationsPanel({ data }: { data: BaZiResponse }) {
  const r = data.recommendations;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2DD4BF]/40 bg-[#0A1A18] p-4">
        <h4 className="text-[#2DD4BF] font-semibold mb-2">Resumen</h4>
        <p className="text-slate-300 text-sm leading-relaxed">{r.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#334155] bg-[#151E2E] p-4">
          <h4 className="text-[#C9A84C] text-sm font-semibold mb-2">Sonido Curativo</h4>
          <p className="text-slate-200 font-mono text-lg">{r.healing_sound}</p>
          <p className="text-slate-400 text-xs mt-1">Elemento: {r.priority_element}</p>
        </div>
        <div className="rounded-xl border border-[#334155] bg-[#151E2E] p-4">
          <h4 className="text-[#C9A84C] text-sm font-semibold mb-2">Dirección</h4>
          <p className="text-slate-200">{r.favorable_direction}</p>
          <p className="text-slate-400 text-xs mt-1">Colores favorables</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {r.favorable_colors.filter(Boolean).map((c) => (
              <span key={c} className="text-xs text-slate-300 bg-[#0A0E1A] px-2 py-0.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#334155] bg-[#151E2E] p-4">
        <h4 className="text-[#C9A84C] text-sm font-semibold mb-2">Alimentos Recomendados</h4>
        <div className="flex flex-wrap gap-2">
          {r.strengthen_with.map((f) => (
            <span key={f} className="text-sm text-slate-300 bg-[#0A0E1A] px-3 py-1 rounded-full">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
