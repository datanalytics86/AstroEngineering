"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ChartResponse, BirthData, ClickTarget } from "@/lib/types";
import { loadChart, saveTransits } from "@/lib/storage";
import ChartWheel from "@/components/ChartWheel";
import PlanetPositions from "@/components/PlanetPositions";
import AspectTable from "@/components/AspectTable";
import InterpretationModal from "@/components/InterpretationModal";

export default function CartaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [highlighted, setHighlighted] = useState<string | undefined>(undefined);
  const [loadingTransits, setLoadingTransits] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<ClickTarget | null>(null);

  useEffect(() => {
    if (!id) { router.push("/"); return; }
    const data = loadChart(id);
    if (!data) { router.push("/"); return; }
    setChart(data.chart);
    setBirthData(data.birthData);
  }, [id, router]);

  async function handleCalcTransits() {
    if (!chart || !birthData) return;
    setLoadingTransits(true);
    setTransitError(null);

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
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al calcular tránsitos" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      saveTransits(id, data);
      router.push(`/transitos/${id}`);
    } catch (e) {
      setTransitError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingTransits(false);
    }
  }

  if (!chart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gold text-3xl mb-3 animate-pulse">✦</div>
          <p className="text-gray-500 font-mono text-sm">Cargando carta natal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-gold">{chart.name}</h1>
          <p className="text-gray-500 font-mono text-sm mt-1">
            {chart.birth_date} · {chart.birth_time} ·{" "}
            <span className="text-gold">{chart.ascendant.sign}</span> Ascendente ·{" "}
            <span className="text-gray-400">MC {chart.midheaven.sign}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/")}
            className="border border-space-border text-gray-400 px-4 py-2 rounded-lg text-sm hover:border-gold hover:text-gold transition-colors font-mono"
          >
            ← Nueva carta
          </button>
          <button
            onClick={handleCalcTransits}
            disabled={loadingTransits}
            className="bg-gold text-space-bg px-6 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-50 font-mono flex items-center gap-2"
          >
            {loadingTransits ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-space-bg border-t-transparent rounded-full animate-spin" />
                Calculando tránsitos…
              </>
            ) : (
              "Ver Tránsitos 12 meses →"
            )}
          </button>
        </div>
      </div>

      {transitError && (
        <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4 text-sm text-red-400 font-mono">
          Error: {transitError}
        </div>
      )}

      {loadingTransits && (
        <div className="mb-6 bg-space-card border border-space-border rounded-xl p-5 text-center">
          <div className="text-gold text-2xl mb-2 animate-pulse">🪐</div>
          <p className="text-gray-300 text-sm font-mono mb-1">Calculando tránsitos para los próximos 12 meses…</p>
          <p className="text-gray-600 text-xs">Este proceso tarda 15-30 segundos. No cierres la ventana.</p>
          <div className="mt-4 w-full bg-space-bg rounded-full h-1 overflow-hidden">
            <div className="h-1 bg-gold rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Layout principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Rueda zodiacal */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl text-gray-300">Rueda Natal</h2>
          <ChartWheel
            planets={chart.planets}
            houses={chart.houses}
            ascendant={chart.ascendant}
            midheaven={chart.midheaven}
            aspects={chart.aspects}
            highlightedPlanet={highlighted}
            onPlanetClick={(name) => setHighlighted((prev) => (prev === name ? undefined : name))}
            onElementClick={(target) => setModalTarget(target)}
          />
          {highlighted && (
            <p className="text-xs text-center text-gold font-mono">
              {highlighted} — click de nuevo para deseleccionar
            </p>
          )}
          {!highlighted && (
            <p className="text-xs text-gray-600 text-center font-mono">
              Click en planeta, aspecto, casa o ángulo para ver interpretación
            </p>
          )}
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

      <InterpretationModal
        target={modalTarget}
        allAspects={chart.aspects}
        onClose={() => setModalTarget(null)}
      />
    </div>
  );
}
