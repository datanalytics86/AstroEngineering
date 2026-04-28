"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ClickTarget, NatalInterpretation, Aspect } from "@/lib/types";
import {
  getPlanetInSignInterpretation,
  getPlanetInHouseInterpretation,
  getAspectInterpretation,
  getHouseMeaning,
  getAngleMeaning,
} from "@/lib/natal-interpretations";


interface Props {
  target: ClickTarget | null;
  allAspects?: Aspect[];
  onClose: () => void;
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆",
  Plutón: "♇", "Nodo Norte": "☊", Quirón: "⚷",
};

const ASPECT_SYMBOLS: Record<string, string> = {
  Conjunción: "☌", Oposición: "☍", Cuadratura: "□",
  Trígono: "△", Sextil: "⚹", Quincuncio: "⚻",
  "Semi-sextil": "⚺", Sesquicuadratura: "⚼",
};

const NATURE_COLORS: Record<string, string> = {
  armonioso: "#10B981",
  tenso: "#EF4444",
  neutro: "#6366F1",
  menor: "#A78BFA",
};

function getInterpretation(target: ClickTarget): NatalInterpretation | null {
  switch (target.type) {
    case "planet":
      return getPlanetInSignInterpretation(target.planet.name, target.planet.sign);
    case "aspect":
      return getAspectInterpretation(
        target.aspect.planet1,
        target.aspect.aspect_name,
        target.aspect.planet2,
        target.aspect.orb,
      );
    case "house":
      return getHouseMeaning(target.house.number);
    case "angle":
      return getAngleMeaning(target.name, target.sign);
    default:
      return null;
  }
}

function getTitle(target: ClickTarget): { main: string; sub: string; icon: string } {
  switch (target.type) {
    case "planet": {
      const sym = PLANET_SYMBOLS[target.planet.name] ?? "★";
      return {
        icon: sym,
        main: `${target.planet.name} en ${target.planet.sign}`,
        sub: `Casa ${target.planet.house} · ${target.planet.degree_display}${target.planet.retrograde ? " ℞" : ""}`,
      };
    }
    case "aspect": {
      const sym = ASPECT_SYMBOLS[target.aspect.aspect_name] ?? "—";
      return {
        icon: sym,
        main: `${target.aspect.planet1} ${sym} ${target.aspect.planet2}`,
        sub: `${target.aspect.aspect_name} · orbe ${target.aspect.orb.toFixed(2)}° · ${target.aspect.applying ? "aplicante" : "separante"}`,
      };
    }
    case "house":
      return {
        icon: `${target.house.number}`,
        main: `Casa ${target.house.number}`,
        sub: `Cúspide en ${target.house.sign} · ${target.house.degree_display}`,
      };
    case "angle":
      return {
        icon: target.name,
        main: `${target.name} en ${target.sign}`,
        sub: target.degree_display,
      };
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs font-mono px-3 py-1.5 rounded border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

function AspectPills({ aspects, planetName }: { aspects: Aspect[]; planetName: string }) {
  if (!aspects.length) return null;
  const related = aspects
    .filter((a) => a.planet1 === planetName || a.planet2 === planetName)
    .slice(0, 6);
  if (!related.length) return null;
  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <p className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">Aspectos activos</p>
      <div className="flex flex-wrap gap-2">
        {related.map((a, i) => {
          const other = a.planet1 === planetName ? a.planet2 : a.planet1;
          const sym = ASPECT_SYMBOLS[a.aspect_name] ?? "—";
          const col = NATURE_COLORS[a.nature] ?? "#94A3B8";
          return (
            <span
              key={i}
              className="text-xs font-mono px-2 py-1 rounded border"
              style={{ borderColor: `${col}44`, color: col, backgroundColor: `${col}11` }}
            >
              {sym} {other} ({a.orb.toFixed(1)}°)
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function InterpretationModal({ target, allAspects = [], onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (target) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [target]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!target) return null;

  const interp = getInterpretation(target);
  const { icon, main, sub } = getTitle(target);

  const copyText = interp
    ? `${main}\n\n${interp.principal}\n\nFortalezas:\n${interp.strengths.map((s) => `• ${s}`).join("\n")}\n\nDesafíos:\n${interp.challenges.map((c) => `• ${c}`).join("\n")}\n\nCrecimiento:\n${interp.growth}\n\nFrase clave: "${interp.keyphrase}"`
    : main;

  const accentColor =
    target.type === "aspect"
      ? NATURE_COLORS[target.aspect.nature] ?? "#2563EB"
      : target.type === "angle"
        ? target.name === "ASC" || target.name === "DSC"
          ? "#2563EB"
          : "#0EA5E9"
        : "#2563EB";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end"
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full sm:w-[480px] h-[85vh] sm:h-screen flex flex-col bg-white border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl transition-all duration-300 ease-out overflow-hidden"
        style={{
          transform: visible
            ? "translate(0, 0)"
            : window.innerWidth < 640
              ? "translateY(100%)"
              : "translateX(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 border-b border-slate-100 flex-shrink-0"
          style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
              >
                {icon}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-slate-900 leading-tight">{main}</h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CopyButton text={copyText} />
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {interp && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {interp.keywords.map((k) => (
                <span
                  key={k}
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
                >
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {interp ? (
            <>
              {/* Frase clave */}
              <blockquote
                className="text-base font-serif italic leading-relaxed pl-4 border-l-2 text-slate-600"
                style={{ borderColor: accentColor }}
              >
                "{interp.keyphrase}"
              </blockquote>

              {/* Interpretación principal */}
              <section>
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
                  Interpretación
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{interp.principal}</p>
              </section>

              {/* Fortalezas */}
              <section>
                <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#10B981" }}>
                  Fortalezas
                </h3>
                <ul className="space-y-2">
                  {interp.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Desafíos */}
              <section>
                <h3 className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: "#EF4444" }}>
                  Desafíos
                </h3>
                <ul className="space-y-2">
                  {interp.challenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Crecimiento */}
              <section className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
                  Potencial de crecimiento
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{interp.growth}</p>
              </section>

              {/* House interpretation if planet */}
              {target.type === "planet" && (
                <section>
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">
                    En casa {target.planet.house}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {getPlanetInHouseInterpretation(target.planet.name, target.planet.house).principal}
                  </p>
                </section>
              )}

              {/* Aspects pills if planet */}
              {target.type === "planet" && (
                <AspectPills aspects={allAspects} planetName={target.planet.name} />
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">Interpretación no disponible para este elemento.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 font-mono text-center">
            Basado en Steven Forrest · Sue Tompkins · Howard Sasportas · Stephen Arroyo
          </p>
        </div>
      </div>
    </div>
  );
}
