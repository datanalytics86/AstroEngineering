"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BirthDataForm from "@/components/BirthDataForm";
import type { BirthData, ChartResponse } from "@/lib/types";
import { saveChart, listCharts, deleteChart, type SavedChartMeta } from "@/lib/storage";
import { postWithWakingRetry } from "@/lib/api-fetch";
import { useT } from "@/lib/i18n";
import { trackLearning } from "@/lib/learning";
import { decodeSharePayload } from "@/lib/share";

const SIGN_COLORS: Record<string, string> = {
  Aries: "#EF4444", Tauro: "#16A34A", "Géminis": "#EAB308", "Cáncer": "#2563EB",
  Leo: "#F97316", Virgo: "#65A30D", Libra: "#06B6D4", Escorpio: "#7C3AED",
  Sagitario: "#DC2626", Capricornio: "#64748B", Acuario: "#0EA5E9", Piscis: "#8B5CF6",
};

export default function NuevaCartaPage() {
  const router = useRouter();
  const { t } = useT();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [saved, setSaved]           = useState<SavedChartMeta[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [fromHint, setFromHint] = useState<string | null>(null);
  const [preset, setPreset] = useState<"einstein" | BirthData | null>(null);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  useEffect(() => {
    setSaved(listCharts());
    try {
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      if (from === "pdf_pro" || from === "pro_sample_pdf") setFromHint(from);
      if (params.get("demo") === "1") {
        setPreset("einstein");
        return;
      }
      const share = params.get("share");
      if (share) {
        const data = decodeSharePayload(share);
        if (data) {
          const appliedKey = `astro_share_applied:${share}`;
          const already = sessionStorage.getItem(appliedKey);
          setPreset(data);
          if (!already) {
            sessionStorage.setItem(appliedKey, "1");
            setAutoSubmit(true);
            setShareBusy(true);
          }
        } else {
          setError(t("nueva.share.invalid"));
        }
      }
    } catch {
      /* ignore */
    }
  }, [t]);

  async function handleSubmit(data: BirthData) {
    setLoading(true);
    setError(null);
    try {
      const res = await postWithWakingRetry("/api/chart", data, () =>
        setError(t("common.error.waking")),
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const chart: ChartResponse = await res.json();
      const id = saveChart(chart, data);
      trackLearning("chart_created");
      router.push(`/carta/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al calcular la carta");
    } finally {
      setLoading(false);
      setShareBusy(false);
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
            {t("nueva.title")}
          </h1>
          <p className="text-slate-500 leading-relaxed text-sm whitespace-pre-line">
            {t("nueva.subtitle")}
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-3">
            {t("nueva.trust")}
          </p>
          {fromHint && (
            <p className="mt-4 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 leading-relaxed">
              {fromHint === "pro_sample_pdf"
                ? t("nueva.from_sample")
                : t("nueva.from_pdf")}
            </p>
          )}
        </div>

        {/* Formulario */}
        {shareBusy && (
          <p className="mb-4 text-sm text-slate-500 text-center">{t("nueva.share.calculating")}</p>
        )}

        <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
          <BirthDataForm
            onSubmit={handleSubmit}
            loading={loading}
            preset={preset}
            autoSubmit={autoSubmit}
          />
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Cartas guardadas ── */}
        {saved.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest font-mono mb-3">
              {t("nueva.saved.title")}
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
                          className="text-xs font-mono px-2 py-1 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors min-h-[44px]"
                        >
                          {t("nueva.saved.transits")}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          trackLearning("returned_same_chart");
                          router.push(`/carta/${c.id}`);
                        }}
                        className="text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors min-h-[44px]"
                      >
                        {t("nueva.saved.view")}
                      </button>
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-xs font-mono px-2 py-1 rounded-lg bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            {t("nueva.saved.confirm_delete")}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(null)}
                            className="text-xs font-mono px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:border-slate-400 transition-colors"
                          >
                            {t("nueva.saved.cancel")}
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
            { label: t("nueva.features.ephemeris"), sub: t("nueva.features.ephemeris.sub") },
            { label: t("nueva.features.planets"), sub: t("nueva.features.planets.sub") },
            { label: t("nueva.features.transits"), sub: t("nueva.features.transits.sub") },
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
