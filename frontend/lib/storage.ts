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

// Tránsitos cacheados por año calendario — clave: astro_transit_{id}_{year}
export function saveYearTransits(id: string, year: number, transits: TransitResponse): void {
  const key = `${PREFIX_TRANSIT}v2:${id}_${year}`;
  try {
    localStorage.setItem(key, JSON.stringify(transits));
  } catch {
    pruneStorage();
    try { localStorage.setItem(key, JSON.stringify(transits)); } catch { /* sin espacio: se usará solo en memoria */ }
  }
}

export function loadYearTransits(id: string, year: number): TransitResponse | null {
  try {
    const str = localStorage.getItem(`${PREFIX_TRANSIT}v2:${id}_${year}`);
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}

// ── Solar Return ──────────────────────────────────────────────────────────────

const PREFIX_SR = "astro_sr_";

export function saveSolarReturn(id: string, chart: ChartResponse): void {
  try {
    localStorage.setItem(PREFIX_SR + id, JSON.stringify(chart));
  } catch {
    pruneStorage();
    localStorage.setItem(PREFIX_SR + id, JSON.stringify(chart));
  }
}

export function loadSolarReturn(id: string): ChartResponse | null {
  try {
    const s = localStorage.getItem(PREFIX_SR + id);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

// ── Saved-chart list ─────────────────────────────────────────────────────────

export interface SavedChartMeta {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  ascendant: string;
  hasTransits: boolean;
}

export function listCharts(): SavedChartMeta[] {
  try {
    const ids = Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX_CHART))
      .map((k) => k.slice(PREFIX_CHART.length));

    return ids
      .map((id): SavedChartMeta | null => {
        try {
          const chartStr = localStorage.getItem(PREFIX_CHART + id);
          if (!chartStr) return null;
          const chart = JSON.parse(chartStr) as ChartResponse;
          return {
            id,
            name: chart.name,
            birth_date: chart.birth_date,
            birth_time: chart.birth_time,
            ascendant: chart.ascendant.sign,
            hasTransits: Object.keys(localStorage).some((k) => k.startsWith(PREFIX_TRANSIT + id)),
          };
        } catch {
          return null;
        }
      })
      .filter((x): x is SavedChartMeta => x !== null);
  } catch {
    return [];
  }
}

export function deleteChart(id: string): void {
  localStorage.removeItem(PREFIX_CHART + id);
  localStorage.removeItem(PREFIX_BIRTH + id);
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX_TRANSIT + id))
    .forEach((k) => localStorage.removeItem(k));
}

// ── Housekeeping ──────────────────────────────────────────────────────────────

function pruneStorage(): void {
  const keys = Object.keys(localStorage).filter(
    (k) => k.startsWith(PREFIX_CHART) || k.startsWith(PREFIX_TRANSIT) || k.startsWith(PREFIX_BIRTH)
  );
  // Eliminar las 5 entradas más antiguas
  keys.slice(0, 5).forEach((k) => localStorage.removeItem(k));
}
