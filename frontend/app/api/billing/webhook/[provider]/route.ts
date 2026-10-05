import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/billing";
import { fulfillPaid, fulfillRevoke } from "@/lib/billing/fulfill";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const adapter = getProvider();
  if (adapter.id !== provider && !(provider === "mock" && adapter.id === "mock")) {
    return NextResponse.json({ detail: "provider_mismatch" }, { status: 400 });
  }
  const event = await adapter.verifyAndParseWebhook(req);
  if (!event) return NextResponse.json({ detail: "invalid" }, { status: 400 });
  try {
    if (event.type === "paid") await fulfillPaid(event, adapter.id);
    else await fulfillRevoke(event, adapter.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fulfill_failed";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
