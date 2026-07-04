import { NextResponse } from "next/server";

// Lista de países disponibles para el modo "impacto por país" — fuente única
// de verdad (backend/astro/national.py). Mismo patrón defensivo que el resto
// de proxies mundane/transits/chart: cold start del backend (Render free
// tier) puede tardar ~50s en despertar.
export const maxDuration = 60;

const BACKEND = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET() {
  try {
    const upstream = await fetch(`${BACKEND}/api/mundane/countries`, {
      method: "GET",
      signal: AbortSignal.timeout(55_000),
    });

    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = { detail: "Respuesta no válida del servidor" };
    }
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { detail: "El servidor está despertando. Reintenta en unos segundos.", code: "backend_waking" },
      { status: 503 },
    );
  }
}
