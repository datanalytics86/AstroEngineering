import type { ChartResponse, BirthData, TransitResponse } from "./types";

const PREFIX_CHART   = "astro_chart_";
const PREFIX_TRANSIT = "astro_transit_";
const PREFIX_BIRTH   = "astro_birth_";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Chart ─────────────────────────────────────────────────────────────────────

export function saveChart(chart: ChartResponse, birthData: BirthData): string {
  const id = uid();
  try {
    localStorage.setItem(PREFIX_CHART + id, JSON.stringify(chart));
    localStorage.setItem(PREFIX_BIRTH + id, JSON.stringify(birthData));
  } catch {
    // localStorage lleno — limpiar entradas viejas
    pruneStorage();
    localStorage.setItem(PREFIX_CHART + id, JSON.stringify(chart));
    localStorage.setItem(PREFIX_BIRTH + id, JSON.stringify(birthData));
  }
  return id;
}

export function loadChart(id: string): { chart: ChartResponse; birthData: BirthData } | null {
  try {
    const chartStr = localStorage.getItem(PREFIX_CHART + id);
    const birthStr = localStorage.getItem(PREFIX_BIRTH + id);
    if (!chartStr || !birthStr) return null;
    return { chart: JSON.parse(chartStr), birthData: JSON.parse(birthStr) };
  } catch {
    return null;
  }
}

// ── Transits ──────────────────────────────────────────────────────────────────

export function saveTransits(id: string, transits: TransitResponse): void {
  try {
    localStorage.setItem(PREFIX_TRANSIT + id, JSON.stringify(transits));
  } catch {
    pruneStorage();
    localStorage.setItem(PREFIX_TRANSIT + id, JSON.stringify(transits));
  }
}

export function loadTransits(id: string): TransitResponse | null {
  try {
    const str = localStorage.getItem(PREFIX_TRANSIT + id);
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

// ── Housekeeping ──────────────────────────────────────────────────────────────

function pruneStorage(): void {
  const keys = Object.keys(localStorage).filter(
    (k) => k.startsWith(PREFIX_CHART) || k.startsWith(PREFIX_TRANSIT) || k.startsWith(PREFIX_BIRTH)
  );
  // Eliminar las 5 entradas más antiguas
  keys.slice(0, 5).forEach((k) => localStorage.removeItem(k));
}
