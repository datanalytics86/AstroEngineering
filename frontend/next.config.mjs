/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (process.env.NODE_ENV === "production" && !API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL es obligatoria en producción");
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
  "connect-src 'self' https://astroengine-backend.onrender.com https://astroengine.onrender.com https://nominatim.openstreetmap.org https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: API_URL ?? "http://localhost:8000",
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
