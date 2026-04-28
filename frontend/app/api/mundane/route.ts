import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const upstream = await fetch(`${BACKEND}/api/mundane`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Mundane calculations can be slow (full 12-month transit scan)
    signal: AbortSignal.timeout(180_000),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
