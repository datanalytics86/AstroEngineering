/**
 * Helper compartido para proxies App Router → backend FastAPI.
 * - timeouts razonables (55s) bajo maxDuration 60
 * - cache: "no-store" (evita respuestas stale, p.ej. calendario)
 * - parseo defensivo JSON
 * - 503 backend_waking en cold start / red
 * - sin filtrar stack traces al cliente
 */

import { NextResponse } from "next/server";
import { logProxyUpstreamError } from "@/lib/observability";

/** Timeout de fetch al backend (debe ser < maxDuration=60 de cada route). */
export const UPSTREAM_TIMEOUT_MS = 55_000;

const WAKING_BODY = {
  detail: "El servidor está despertando. Reintenta en unos segundos.",
  code: "backend_waking",
} as const;

export function backendBase(): string {
  const raw =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

function parseUpstreamJson(text: string, fallback: unknown): unknown {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return { detail: "Respuesta no válida del servidor" };
  }
}

export async function proxyToBackend(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: string;
    headers?: Record<string, string>;
  },
): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${backendBase()}${path}`, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });

    const text = await upstream.text();
    const data = parseUpstreamJson(text, init.method === "GET" ? {} : {});

    if (upstream.status >= 500) {
      logProxyUpstreamError(path, upstream.status);
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    const detail = err instanceof Error ? err.name : "unknown";
    logProxyUpstreamError(path, 503, detail);
    return NextResponse.json(WAKING_BODY, { status: 503 });
  }
}

export function invalidJsonResponse(): NextResponse {
  return NextResponse.json({ detail: "Solicitud inválida" }, { status: 400 });
}
