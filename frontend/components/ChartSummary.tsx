"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChartSummary, HumanProSummary } from "@/lib/types";
import { useT } from "@/lib/i18n";
import type { TranslationKeys } from "@/lib/locales/es";

interface Props {
  summary: ChartSummary;
  human: HumanProSummary;
  name: string;
  onClose: () => void;
}

const ELEMENT_COLOR: Record<string, { color: string; bg: string }> = {
  Fuego:  { color: "#EF4444", bg: "#FEF2F2" },
  Tierra: { color: "#10B981", bg: "#F0FDF4" },
  Aire:   { color: "#D97706", bg: "#FFFBEB" },
  Agua:   { color: "#3B82F6", bg: "#EFF6FF" },
};

export default function ChartSummaryModal({ summary, human, name, onClose }: Props) {
  const { t } = useT();
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [techOpen, setTechOpen] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const elInfo = ELEMENT_COLOR[summary.dominant_element] ?? { color: "#6366F1", bg: "#EEF2FF" };
  const elKey = `summary.el.${summary.dominant_element}` as TranslationKeys;
  const modKey = `summary.mod.${summary.dominant_modality}` as TranslationKeys;
  const houseBody = t("summary.modal.tech_house_body")
    .replace("{n}", String(summary.house_emphasis.house))
    .replace("{count}", String(summary.house_emphasis.planet_count))
    .replace("{domain}", summary.house_emphasis.domain);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end"
      onClick={handleBackdrop}
    >
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      <div
        ref={panelRef}
        className="relative z-10 w-full sm:w-[560px] h-[92vh] sm:h-screen flex flex-col bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl transition-all duration-300 ease-out overflow-hidden"
        style={{
          transform: visible
            ? "translate(0, 0)"
            : window.innerWidth < 640 ? "translateY(100%)" : "translateX(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          className="px-6 pt-6 pb-5 border-b border-slate-100 flex-shrink-0"
          style={{ borderLeftColor: elInfo.color, borderLeftWidth: 3 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg text-slate-900 leading-tight">
                {t("summary.modal.title")}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">{name}</p>
              <p className="text-sm font-semibold mt-2 leading-snug" style={{ color: elInfo.color }}>
                {human.headline}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("summary.modal.close")}
              className="w-8 h-8 flex items-center justify-center rounded text-ink-3 hover:text-ink hover:bg-elev transition-colors flex-shrink-0 min-h-[44px] min-w-[44px]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <h3 className="text-xs uppercase tracking-widest text-ink-3 font-mono mb-2">
              {t("summary.modal.identity")}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{human.identity}</p>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-ink-3 font-mono mb-2">
              {t("summary.modal.emotion")}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{human.emotion}</p>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-ink-3 font-mono mb-2">
              {t("summary.modal.purpose")}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{human.purpose}</p>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest text-ink-3 font-mono mb-2">
              {t("summary.modal.emphasis")}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{human.emphasis}</p>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#10B981" }}>
              {t("summary.modal.strengths")}
            </h3>
            <ul className="space-y-2">
              {human.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#B45309" }}>
              {t("summary.modal.challenges")}
            </h3>
            <ul className="space-y-2">
              {human.challenges.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-widest text-blue-600 font-mono mb-2">
              {t("summary.modal.advice")}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{human.advice}</p>
          </section>

          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setTechOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 min-h-[44px] text-left"
              aria-expanded={techOpen}
            >
              <span className="text-xs uppercase tracking-widest text-ink-3 font-mono">
                {t("summary.modal.tech")}
              </span>
              <span className="text-ink-3 font-mono text-sm" aria-hidden>
                {techOpen ? "▴" : "▾"}
              </span>
            </button>

            {techOpen && (
              <div className="mt-3 space-y-4">
                <p className="text-xs font-mono text-slate-500">{summary.headline}</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: elInfo.bg, color: elInfo.color }}
                  >
                    {t(elKey)} · {t("summary.modal.tech_element")}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {t(modKey)} · {t("summary.modal.tech_modality")}
                  </span>
                  {summary.stelliums[0] && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                      {t("summary.modal.tech_stellium")} {summary.stelliums[0].sign}
                    </span>
                  )}
                </div>

                {summary.notable_aspects.length > 0 && (
                  <section>
                    <h4 className="text-xs uppercase tracking-widest text-ink-3 font-mono mb-2">
                      {t("summary.modal.tech_aspects")}
                    </h4>
                    <ul className="space-y-1.5">
                      {summary.notable_aspects.map((a) => (
                        <li
                          key={a}
                          className="text-xs font-mono text-slate-600 bg-slate-50 rounded px-3 py-1.5 border border-slate-100"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h4 className="text-xs uppercase tracking-widest text-ink-3 font-mono mb-2">
                    {t("summary.modal.tech_house")}
                  </h4>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {houseBody}
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-ink-3 text-center">
            {t("summary.modal.footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
