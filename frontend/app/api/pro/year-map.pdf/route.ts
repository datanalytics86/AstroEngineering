import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { loadYearMapForCustomer } from "@/lib/pro/load-year-map";
import { renderYearMapPdf, yearMapFilename } from "@/lib/pdf/server-year-map";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ detail: "unauthorized" }, { status: 401 });
  const chartId = req.nextUrl.searchParams.get("chart_id");
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? "en" : "es";
  const result = await loadYearMapForCustomer(session.customerId, {
    chartId,
    lang,
    req,
  });
  if ("error" in result) return NextResponse.json({ detail: result.error }, { status: result.status });
  try {
    const buf = await renderYearMapPdf(result.map, result.lang);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${yearMapFilename(result.lang, result.map.window.start)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ detail: "pdf_failed" }, { status: 500 });
  }
}
