"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BirthDataForm from "@/components/BirthDataForm";
import type { BirthData, ChartResponse } from "@/lib/types";
import { saveChart, listCharts, deleteChart, type SavedChartMeta } from "@/lib/storage";

const SIGN_COLORS: Record<string, string> = {
  Aries: "#EF4444", Tauro: "#16A34A", Géminis: "#EAB308", Cáncer: "#2563EB",
  Leo: "#F97316", Virgo: "#65A30D", Libra: "#06B6D4", Escorpio: "#7C3AED",
  Sagitario: "#DC2626", Capricornio: "#64748B", Acuario: "#0EA5E9", Piscis: "#8B5CF6",
};

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [saved, setSaved]           = useState<SavedChartMeta[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    setSaved(listCharts());
  }, []);

  async function handleSubmit(data: BirthData) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const chart: ChartResponse = await res.json();
      const id = saveChart(chart, data);
      router.push(`/carta/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al calcular la carta");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    deleteChart(id);
    setSaved((prev) => prev.filter((c) => c.id !== id));
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 bg-base pt-12">
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="font-semibold text-3xl text-slate-900 tracking-tight mb-2">
            Carta Natal
          </h1>
          <p className="text-slate-500 leading-relaxed text-sm">
            Precisión astronómica con Swiss Ephemeris.<br />
            Tránsitos calculados día a día.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <BirthDataForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 font-mono">
            {error}
          </div>
        )}

        {/* Navigation links */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => router.push("/mundial")}
            className="text-xs font-mono text-slate-400 hover:text-blue-500 transition-colors underline underline-offset-2"
          >
            🌍 Astrología Mundial → tránsitos sobre cartas nacionales
          </button>
          <button
            onClick={() => router.push("/astrotrading")}
            className="text-xs font-mono font-semibold px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition-colors"
          >
            📈 AstroTrading → señales long/short según los astros
          </button>
        </div>

        {/* ── Cartas guardadas ── */}
        {saved.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest font-mono mb-3">
              Cartas guardadas
            </h2>
            <div className="space-y-2">
              {saved.map((c) => {
                const asc = c.ascendant;
                const color = SIGN_COLORS[asc] ?? "#6B7280";
                const isConfirming = deleteTarget === c.id;
                return (
                  <div
                    key={c.id}
                    className="bg-white border border-border rounded-xl px-4 py-3 shadow-card flex items-center gap-3"
                  >
                    {/* Color dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs font-mono text-slate-400">
                        {c.birth_date} · {c.birth_time} ·{" "}
                        <span style={{ color }} className="font-semibold">{asc} ASC</span>
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 shrink-0">
                      {c.hasTransits && (
                        <button
                          onClick={() => router.push(`/transitos/${c.id}`)}
                          title="Ver tránsitos"
                          className="text-xs font-mono px-2 py-1 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          ✦ Tránsitos
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/carta/${c.id}`)}
                        className="text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors"
                      >
                        Ver carta
                      </button>
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-xs font-mono px-2 py-1 rounded-lg bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteTarget(null)}
                            className="text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:border-slate-400 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteTarget(c.id)}
                          title="Eliminar"
                          className="text-xs font-mono w-7 h-7 rounded-lg border border-slate-200 text-slate-300 hover:border-red-300 hover:text-red-400 transition-colors flex items-center justify-center"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info técnica */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Swiss Ephemeris", sub: "±0.05° precisión" },
            { label: "12 planetas", sub: "Sol → Quirón" },
            { label: "Tránsitos", sub: "1–12 meses" },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-border rounded-xl p-3 shadow-card">
              <div className="text-xs font-semibold text-slate-700">{item.label}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
