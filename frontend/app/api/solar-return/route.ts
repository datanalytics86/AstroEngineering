import { NextRequest, NextResponse } from "next/server";

// Cubre el cold start del backend (Render free tier, ~50s) sin cortar por el
// límite de duración por defecto de la función de Vercel.
export const maxDuration = 60;

const BACKEND = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BACKEND}/api/solar-return`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
