import { NextRequest, NextResponse } from "next/server";

// Cubre el cold start del backend (Render free tier, ~50s).
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
    const upstream = await fetch(`${BACKEND}/api/transits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Los tránsitos pueden tardar varios segundos; falla con gracia antes del corte de Vercel.
      signal: AbortSignal.timeout(55_000),
    });

    // Parseo defensivo: un gateway en frío puede devolver contenido no-JSON.
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
