import { proxyToBackend } from "@/lib/backend-proxy";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: import("next/server").NextRequest) {
  return proxyToBackend("/health", { method: "GET", req });
}
