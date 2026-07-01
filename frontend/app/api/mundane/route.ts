import { NextRequest, NextResponse } from "next/server";

// El backend en Render (free tier) hiberna tras inactividad: la primera petición
// puede tardar ~50s en despertar. Permitimos que la función de Vercel espere hasta
// 60s en lugar del límite por defecto (que provocaba un 500/timeout en frío).
export const maxDuration = 60;

const BACKEND = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Solicitud inválida" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${BACKEND}/api/mundane`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Falla con gracia antes del corte duro de Vercel (60s) para devolver un JSON limpio.
      signal: AbortSignal.timeout(55_000),
    });

    // Leer como texto y parsear defensivamente: un cold start puede devolver una
    // página de error (no-JSON) del gateway, que rompería upstream.json().
    const text = await upstream.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: "Respuesta no válida del servidor" };
    }
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    // Timeout o fallo de red: casi siempre el backend (free tier) está despertando.
    return NextResponse.json(
      {
        detail: "El servidor está despertando. Reintenta en unos segundos.",
        code: "backend_waking",
      },
      { status: 503 },
    );
  }
}
