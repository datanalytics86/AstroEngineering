"use client";
import type { BaZiResponse } from "@/lib/bazi-types";

export default function SymbolicStars({ data }: { data: BaZiResponse }) {
  if (!data.symbolic_stars.length) {
    return <p className="text-slate-400 text-sm">No se detectaron estrellas simbólicas destacadas en los pilares.</p>;
  }

  return (
    <div className="space-y-3">
      {data.symbolic_stars.map((star, i) => (
        <div key={i} className="rounded-xl border border-[#334155] bg-[#151E2E] p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#C9A84C] font-semibold text-sm">⭐ {star.name}</span>
            {star.present_in.length > 0 && (
              <span className="text-xs text-[#2DD4BF] ml-auto">Activa en: {star.present_in.join(", ")}</span>
            )}
          </div>
          <p className="text-slate-400 text-xs">{star.description}</p>
          <p className="text-slate-500 text-xs mt-1">
            Rama: {star.branch_chinese} ({star.branch_animal})
          </p>
        </div>
      ))}
    </div>
  );
}
