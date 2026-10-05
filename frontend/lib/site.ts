/**
 * Única fuente de SITE_URL (H-10, H-07).
 * Hasta D3 el canónico es astro-engineering.vercel.app.
 */

export const CANONICAL_SITE_URL = "https://astro-engineering.vercel.app";
export const BACKEND_PROD_URL = "https://astroengine-backend.onrender.com";
export const SOURCE_CODE_URL = "https://github.com/datanalytics86/AstroEngineering";

export function siteUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    CANONICAL_SITE_URL
  ).replace(/\/$/, "");
  return raw || CANONICAL_SITE_URL;
}

export function backendUrl(): string {
  const raw = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");
  if (raw) return raw;
  if (process.env.VERCEL_ENV === "production") return BACKEND_PROD_URL;
  return "http://localhost:8000";
}

/** Success/cancel del checkout y requestOrigin: nunca `*.vercel.app`. */
export function isAllowedOrigin(origin: string): boolean {
  const o = (origin || "").replace(/\/$/, "");
  if (!o) return false;
  if (o === siteUrl() || o === CANONICAL_SITE_URL) return true;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    if (o === `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) return true;
  }
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "development") {
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o)) return true;
  }
  return false;
}

export function requestOriginFrom(req: Request): string {
  const origin = (req.headers.get("origin") || "").replace(/\/$/, "");
  if (isAllowedOrigin(origin)) return origin;
  return siteUrl();
}
