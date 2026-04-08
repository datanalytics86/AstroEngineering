"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChartResponse, BirthData } from "@/lib/types";
import ChartWheel from "@/components/ChartWheel";
import PlanetPositions from "@/components/PlanetPositions";
import AspectTable from "@/components/AspectTable";

export default function CartaPage() {
  const router = useRouter();
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [highlighted, setHighlighted] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const chartStr = sessionStorage.getItem("astro_chart");
    const bdStr = sessionStorage.getItem("astro_birthdata");
    if (!chartStr || !bdStr) {
      router.push("/");
      return;
    }
    setChart(JSON.parse(chartStr));
    setBirthData(JSON.parse(bdStr));
  }, [router]);

  async function handleCalcTransits() {
    if (!chart || !birthData) return;
    setLoading(true);

    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    const req = {
      natal_planets: chart.planets,
      start_date: today.toISOString().slice(0, 10),
      end_date: nextYear.toISOString().slice(0, 10),
      latitude: birthData.latitude,
      longitude: birthData.longitude,
    };

    try {
      const res = await fetch("/api/transits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      sessionStorage.setItem("astro_transits", JSON.stringify(data));
      router.push("/transitos/resultado");
    } finally {
      setLoading(false);
    }
  }

  if (!chart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gold font-mono animate-pulse">Cargando carta natal…</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-gold">{chart.name}</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">
            {chart.birth_date} · {chart.birth_time} · {chart.ascendant.sign} Ascendente
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="border border-space-border text-gray-400 px-4 py-2 rounded-lg text-sm hover:border-gold hover:text-gold transition-colors font-mono"
          >
            ← Nueva carta
          </button>
          <button
            onClick={handleCalcTransits}
            disabled={loading}
            className="bg-gold text-space-bg px-6 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 font-mono"
          >
            {loading ? "Calculando…" : "Ver Tránsitos →"}
          </button>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Rueda zodiacal */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl text-gray-300">Rueda Natal</h2>
          <ChartWheel
            planets={chart.planets}
            houses={chart.houses}
            ascendant={chart.ascendant}
            aspects={chart.aspects}
            highlightedPlanet={highlighted}
            onPlanetClick={(name) => setHighlighted((prev) => (prev === name ? undefined : name))}
          />
          <p className="text-xs text-gray-600 text-center font-mono">
            Haz click en un planeta para resaltar sus aspectos
          </p>
        </div>

        {/* Tablas */}
        <div className="space-y-6">
          {/* Ángulos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-space-card border border-space-border rounded-xl p-4">
              <div className="text-xs text-gray-600 uppercase tracking-widest font-mono mb-1">Ascendente</div>
              <div className="text-gold font-mono text-lg">{chart.ascendant.sign}</div>
              <div className="text-gray-400 font-mono text-sm">{chart.ascendant.degree_display}</div>
            </div>
            <div className="bg-space-card border border-space-border rounded-xl p-4">
              <div className="text-xs text-gray-600 uppercase tracking-widest font-mono mb-1">Medio Cielo</div>
              <div className="text-gold font-mono text-lg">{chart.midheaven.sign}</div>
              <div className="text-gray-400 font-mono text-sm">{chart.midheaven.degree_display}</div>
            </div>
          </div>

          <PlanetPositions
            planets={chart.planets}
            highlightedPlanet={highlighted}
            onPlanetClick={(name) => setHighlighted((prev) => (prev === name ? undefined : name))}
          />

          <AspectTable aspects={chart.aspects} highlightedPlanet={highlighted} />
        </div>
      </div>
    </div>
  );
}
