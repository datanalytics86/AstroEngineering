import Stripe from "stripe";
import { CATALOG } from "./catalog";
import type { BillingEvent, BillingProvider } from "./provider";

function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export const stripeProvider: BillingProvider = {
  id: "stripe",
  enabled() {
    return Boolean(process.env.STRIPE_SECRET_KEY?.trim()) && process.env.BILLING_PROVIDER === "stripe";
  },
  async createCheckout(i) {
    const client = stripe();
    if (!client) throw new Error("stripe_disabled");
    const product = CATALOG[i.sku];
    const amount = product.prices[i.currency] ?? product.prices.USD ?? 0;
    const session = await client.checkout.sessions.create({
      mode: "payment",
      success_url: i.successUrl,
      cancel_url: i.cancelUrl,
      customer_email: i.email,
      locale: i.locale === "en" ? "en" : "es",
      client_reference_id: i.orderId,
      metadata: { orderId: i.orderId, sku: i.sku, ref: i.ref || "", coupon: i.coupon || "" },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: i.currency.toLowerCase(),
            unit_amount: amount,
            product_data: { name: `AstroEngine ${i.sku}` },
          },
        },
      ],
    });
    if (!session.url) throw new Error("stripe_no_url");
    return { url: session.url };
  },
  async verifyAndParseWebhook(req) {
    const client = stripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!client || !secret) return null;
    const sig = req.headers.get("stripe-signature");
    if (!sig) return null;
    const raw = await req.text();
    let event: Stripe.Event;
    try {
      event = client.webhooks.constructEvent(raw, sig, secret);
    } catch {
      return null;
    }
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = (s.client_reference_id || s.metadata?.orderId || "").trim();
      if (!orderId) return null;
      return {
        eventId: event.id,
        type: "paid",
        orderId,
        providerOrderId: String(s.id),
        email: (s.customer_email || s.customer_details?.email || "").toLowerCase(),
        amountMinor: s.amount_total ?? 0,
        currency: (s.currency || "usd").toUpperCase(),
      };
    }
    if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const obj = event.data.object as { id?: string; metadata?: { orderId?: string } };
      const orderId = obj.metadata?.orderId;
      if (!orderId) return null;
      return {
        eventId: event.id,
        type: event.type === "charge.refunded" ? "refunded" : "chargeback",
        orderId,
        providerOrderId: String(obj.id || event.id),
        email: "",
        amountMinor: 0,
        currency: "USD",
      };
    }
    return null;
  },
};
