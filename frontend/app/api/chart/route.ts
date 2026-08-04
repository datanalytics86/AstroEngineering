import { NextRequest } from "next/server";
import { invalidJsonResponse, proxyToBackend } from "@/lib/backend-proxy";

// Cubre el cold start del backend (Render free tier, ~50s).
// maxDuration debe ser literal (Next.js no resuelve identificadores importados).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return invalidJsonResponse();
  }

  return proxyToBackend("/api/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
