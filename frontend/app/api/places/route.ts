import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ detail: "q mínimo 2 caracteres" }, { status: 422 });
  }
  const lang = searchParams.get("lang") === "en" ? "en" : "es";
  const limit = searchParams.get("limit") || "8";
  const qs = `q=${encodeURIComponent(q)}&lang=${lang}&limit=${encodeURIComponent(limit)}`;
  return proxyToBackend(`/api/places?${qs}`, { method: "GET", req });
}
