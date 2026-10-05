import Stripe from "stripe";
import { requestOriginFrom } from "@/lib/site";

export const PRO_AMOUNT_CENTS = 299;
export const PRO_CURRENCY = "usd";
export const PRO_PRODUCT_NAME = "AstroEngine Pro";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

/** Origin of the page that started checkout. Allowlist SITE_URL (H-07). */
export function requestOrigin(req: Request): string {
  return requestOriginFrom(req);
}

export function sanitizeChartId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (!id || id.length > 80) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return id;
}
