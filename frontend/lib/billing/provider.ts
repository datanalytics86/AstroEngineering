import type { Currency, Sku } from "./catalog";

export type ProviderId = "stripe" | "lemonsqueezy" | "mercadopago" | "mock";

export interface BillingEvent {
  eventId: string;
  type: "paid" | "refunded" | "chargeback";
  orderId: string;
  providerOrderId: string;
  email: string;
  amountMinor: number;
  currency: string;
}

export interface BillingProvider {
  id: ProviderId;
  enabled(): boolean;
  createCheckout(i: {
    orderId: string;
    sku: Sku;
    currency: Currency;
    email?: string;
    locale: "es" | "en";
    successUrl: string;
    cancelUrl: string;
    coupon?: string;
    ref?: string;
  }): Promise<{ url: string }>;
  verifyAndParseWebhook(req: Request): Promise<BillingEvent | null>;
}
