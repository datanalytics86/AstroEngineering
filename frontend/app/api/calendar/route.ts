import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

// Mismo patrón defensivo: cold start + cache no-store (vía proxyToBackend).
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json({ detail: "Faltan parámetros year/month" }, { status: 400 });
  }

  const qs = `year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;
  return proxyToBackend(`/api/calendar?${qs}`, { method: "GET" });
}
