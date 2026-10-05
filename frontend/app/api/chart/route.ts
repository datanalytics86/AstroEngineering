import { NextRequest } from "next/server";
import { invalidJsonResponse, proxyToBackend, tooLargeResponse } from "@/lib/backend-proxy";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > 64 * 1024) return tooLargeResponse();
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
    req,
  });
}
