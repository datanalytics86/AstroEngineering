import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { loadYearMapForCustomer } from "@/lib/pro/load-year-map";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  let body: { chart_id?: string; lang?: "es" | "en"; sku?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }
  const result = await loadYearMapForCustomer(session.customerId, {
    chartId: body.chart_id,
    lang: body.lang,
    sku: body.sku,
    req,
  });
  if ("error" in result) return NextResponse.json({ detail: result.error }, { status: result.status });
  return NextResponse.json(result.map);
}
