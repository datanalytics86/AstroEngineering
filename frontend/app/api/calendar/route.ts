import { NextRequest, NextResponse } from "next/server";

// Mismo patrón defensivo que el resto de proxies (chart/transits/mundane):
// el backend en Render (free tier) hiberna tras inactividad, la primera
// petición puede tardar ~50s en despertar.
export const maxDuration = 60;

const BACKEND = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json({ detail: "Faltan parámetros year/month" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `${BACKEND}/api/calendar?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`,
      { method: "GET", signal: AbortSignal.timeout(55_000) },
    );

    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
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
