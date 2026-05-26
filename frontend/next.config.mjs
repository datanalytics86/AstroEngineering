/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (process.env.NODE_ENV === "production" && !API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL es obligatoria en producción");
}
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: API_URL ?? "http://localhost:8000",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
