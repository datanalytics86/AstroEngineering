import { NextRequest, NextResponse } from "next/server";
import {
  PRO_AMOUNT_CENTS,
  PRO_CURRENCY,
  PRO_PRODUCT_NAME,
  getStripe,
  requestOrigin,
  sanitizeChartId,
} from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { detail: "checkout_unconfigured", enabled: false },
      { status: 503 },
    );
  }

  let body: { chartId?: unknown; email?: unknown };
  try {
    body = (await req.json()) as { chartId?: unknown; email?: unknown };
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }

  const chartId = sanitizeChartId(body.chartId);
  if (!chartId) {
    return NextResponse.json({ detail: "invalid_chart" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? body.email.trim().slice(0, 200)
      : undefined;

  const origin = requestOrigin(req);
  const success = `${origin}/carta/${encodeURIComponent(chartId)}?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancel = `${origin}/carta/${encodeURIComponent(chartId)}?checkout=cancel#pro-unlock-panel`;

  try {
    const priceId = process.env.STRIPE_PRICE_ID?.trim();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: success,
      cancel_url: cancel,
      client_reference_id: chartId,
      customer_email: email,
      metadata: { chartId, product: "astroengine_pro" },
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: PRO_CURRENCY,
                unit_amount: PRO_AMOUNT_CENTS,
                product_data: {
                  name: PRO_PRODUCT_NAME,
                  description:
                    "Year pulse + deeper natal reading. One-time, no subscription.",
                },
              },
            },
          ],
    });

    if (!session.url) {
      return NextResponse.json({ detail: "no_checkout_url" }, { status: 502 });
    }
    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "stripe_error";
    console.error(JSON.stringify({ event: "checkout.session.error", message }));
    return NextResponse.json({ detail: "checkout_failed" }, { status: 502 });
  }
}
