/** @type {import('next').NextConfig} */
const PROD_API = "https://astroengine-backend.onrender.com";
const STUB_API = "https://astroengine.onrender.com";

function resolveApiUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "").replace(/\/$/, "");
  if (raw) return raw;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return PROD_API;
  return "http://localhost:8000";
}

const API_URL = resolveApiUrl();

if (process.env.NODE_ENV === "production") {
  if (
    /localhost|127\.0\.0\.1/i.test(API_URL) ||
    API_URL === STUB_API
  ) {
    throw new Error(
      `NEXT_PUBLIC_API_URL inválida en producción (${API_URL}). Usar ${PROD_API} (sin trailing slash; nunca el stub astroengine.onrender.com).`,
    );
  }
}

// CSP pragmática: self + Google Fonts + Nominatim (geocoding cliente) + backend Render.
// Las llamadas de cálculo van por proxies same-origin (/api/*); connect-src al BE
// cubre defensa en profundidad y previews que apunten directo al origen público.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://astroengine-backend.onrender.com https://checkout.stripe.com https://api.stripe.com https://nominatim.openstreetmap.org https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig = {
  output: "standalone",
  transpilePackages: ["@react-pdf/renderer"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  // Headers de seguridad HTTP (GAP_ANALYSIS_DEPLOY.md A-6 + Tier-1 CSP)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
};
export default nextConfig;
