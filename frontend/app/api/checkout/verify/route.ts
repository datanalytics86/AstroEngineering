import { NextRequest, NextResponse } from "next/server";
import { getStripe, sanitizeChartId } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ paid: false, reason: "unconfigured" }, { status: 503 });
  }

  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim() ?? "";
  const chartId = sanitizeChartId(req.nextUrl.searchParams.get("chart_id"));
  if (!sessionId.startsWith("cs_") || !chartId) {
    return NextResponse.json({ paid: false, reason: "invalid" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metaId = session.metadata?.chartId || session.client_reference_id || "";
    const paid =
      session.payment_status === "paid" && metaId === chartId && session.status !== "expired";
    return NextResponse.json({
      paid,
      chartId: paid ? chartId : null,
      sessionId: paid ? session.id : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "stripe_error";
    console.error(JSON.stringify({ event: "checkout.verify.error", message }));
    return NextResponse.json({ paid: false, reason: "verify_failed" }, { status: 502 });
  }
}
