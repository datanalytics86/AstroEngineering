"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BirthDataForm from "@/components/BirthDataForm";
import type { BirthData, ChartResponse } from "@/lib/types";

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
      // Guardar en sessionStorage para pasar entre páginas sin URL params gigantes
      sessionStorage.setItem("astro_chart", JSON.stringify(chart));
      sessionStorage.setItem("astro_birthdata", JSON.stringify(data));
      router.push("/carta/resultado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al calcular la carta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">✦</div>
          <h1 className="font-serif text-4xl text-gold mb-3">AstroEngine Pro</h1>
          <p className="text-gray-400 leading-relaxed">
            Carta natal con precisión astronómica real (Swiss Ephemeris).<br />
            Tránsitos futuros calculados día a día.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-space-card border border-space-border rounded-2xl p-6 shadow-xl">
          <BirthDataForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-800 rounded-lg p-4 text-sm text-red-400 font-mono">
            Error: {error}
          </div>
        )}

        {/* Info técnica */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "⚡", label: "Swiss Ephemeris", sub: "±0.01° precisión" },
            { icon: "🪐", label: "12 planetas", sub: "Sol → Quirón" },
            { icon: "📅", label: "Tránsitos", sub: "1–12 meses" },
          ].map((item) => (
            <div key={item.label} className="bg-space-card border border-space-border rounded-xl p-4">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs font-mono text-gray-300">{item.label}</div>
              <div className="text-xs text-gray-600">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
