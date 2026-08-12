import Stripe from "stripe";

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

/** Origin of the page that started checkout (preview-safe). */
export function requestOrigin(req: Request): string {
  const origin = req.headers.get("origin")?.replace(/\/$/, "") ?? "";
  if (
    origin === "https://astro-engineering.vercel.app" ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
  ) {
    return origin;
  }
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`.replace(/\/$/, "");
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://astro-engineering.vercel.app"
  );
}

export function sanitizeChartId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (!id || id.length > 80) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return id;
}
