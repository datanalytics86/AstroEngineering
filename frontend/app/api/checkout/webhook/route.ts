import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ detail: "webhook_unconfigured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ detail: "missing_signature" }, { status: 400 });
  }

  const raw = await req.text();
  try {
    const event = stripe.webhooks.constructEvent(raw, signature, secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.info(
        JSON.stringify({
          event: "checkout.paid",
          sessionId: session.id,
          chartId: session.metadata?.chartId ?? session.client_reference_id ?? null,
          amount: session.amount_total,
        }),
      );
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "bad_signature";
    console.error(JSON.stringify({ event: "checkout.webhook.error", message }));
    return NextResponse.json({ detail: "invalid_webhook" }, { status: 400 });
  }
}
