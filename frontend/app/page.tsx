"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BirthDataForm from "@/components/BirthDataForm";
import type { BirthData, ChartResponse } from "@/lib/types";
import { saveChart } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-base">
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

        {/* Mundane link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/mundial")}
            className="text-xs font-mono text-slate-400 hover:text-blue-500 transition-colors underline underline-offset-2"
          >
            🌍 Astrología Mundial → tránsitos sobre cartas nacionales
          </button>
        </div>

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
