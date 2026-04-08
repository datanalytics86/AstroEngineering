import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const upstream = await fetch(`${BACKEND}/api/transits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Los tránsitos pueden tardar varios segundos en calcularse
    signal: AbortSignal.timeout(120_000),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
