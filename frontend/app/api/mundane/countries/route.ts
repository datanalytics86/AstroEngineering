import { proxyToBackend } from "@/lib/backend-proxy";

// Lista de países (modo impacto por país). Mismo patrón cold-start.
export const maxDuration = 60;

export async function GET() {
  return proxyToBackend("/api/mundane/countries", { method: "GET" });
}
