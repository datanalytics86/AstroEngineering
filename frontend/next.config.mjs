/** @type {import('next').NextConfig} */
const BACKEND_PROD_URL = "https://astroengine-backend.onrender.com";
const STUB_API = "https://astroengine.onrender.com";

function resolveApiUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "").replace(/\/$/, "");
  if (raw) return raw;
  if (process.env.VERCEL_ENV === "production") return BACKEND_PROD_URL;
  if (process.env.VERCEL) return BACKEND_PROD_URL;
  return "http://localhost:8000";
}

const API_URL = resolveApiUrl();

// H-09: solo revienta en el deploy de producción de Vercel, no en `next start` local.
if (process.env.VERCEL_ENV === "production") {
  if (/localhost|127\.0\.0\.1/i.test(API_URL) || API_URL === STUB_API) {
    throw new Error(
      `NEXT_PUBLIC_API_URL inválida en VERCEL_ENV=production (${API_URL}). Usar ${BACKEND_PROD_URL}.`,
    );
  }
}

const nextConfig = {
  // Standalone solo en la imagen Docker. `next start` (CI e2e) no lo soporta.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" } : {}),
  transpilePackages: ["@react-pdf/renderer"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
