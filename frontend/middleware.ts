import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const HOUR_MS = 60 * 60_000;

const PER_MINUTE: Record<string, number> = {
  "/api/chart": 20,
  "/api/transits": 5,
  "/api/places": 30,
  "/api/billing/checkout": 10,
  "/api/solar-return": 10,
  "/api/mundane": 5,
};

const PER_HOUR: Record<string, number> = {
  "/api/auth/magic-link": 10,
};

type Bucket = Map<string, number[]>;

const g = globalThis as typeof globalThis & { __aeBuckets: { min: Bucket; hour: Bucket } };
g.__aeBuckets = g.__aeBuckets || { min: new Map(), hour: new Map() };

function prune(ts: number[], windowMs: number, now: number): number[] {
  return ts.filter((t) => now - t < windowMs);
}

function take(bucket: Bucket, key: string, limit: number, windowMs: number, now: number): boolean {
  const next = prune(bucket.get(key) || [], windowMs, now);
  if (next.length >= limit) {
    bucket.set(key, next);
    return false;
  }
  next.push(now);
  bucket.set(key, next);
  return true;
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

function matchLimit(pathname: string, table: Record<string, number>): number | undefined {
  for (const [prefix, n] of Object.entries(table)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return n;
  }
  return undefined;
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://checkout.stripe.com https://api.stripe.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
    "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = Date.now();
  const ip = clientIp(request);

  const perMin = matchLimit(pathname, PER_MINUTE);
  if (perMin !== undefined) {
    if (!take(g.__aeBuckets.min, `${pathname}|${ip}`, perMin, WINDOW_MS, now)) {
      return new NextResponse(JSON.stringify({ detail: "Too Many Requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      });
    }
  }
  const perHour = matchLimit(pathname, PER_HOUR);
  if (perHour !== undefined) {
    if (!take(g.__aeBuckets.hour, `${pathname}|${ip}`, perHour, HOUR_MS, now)) {
      return new NextResponse(JSON.stringify({ detail: "Too Many Requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "3600",
        },
      });
    }
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const csp = buildCsp(nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.VERCEL_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|fonts/).*)"],
};
