/**
 * Helper compartido para proxies App Router → backend FastAPI.
 * - timeouts razonables (55s) bajo maxDuration 60
 * - cache: "no-store" (evita respuestas stale, p.ej. calendario)
 * - parseo defensivo JSON
 * - 503 backend_waking en cold start / red
 * - sin filtrar stack traces al cliente
 * - A2-1: X-Astro-Proxy-Key + X-Astro-Client-IP
 */

import { NextRequest, NextResponse } from "next/server";
import { logProxyUpstreamError } from "@/lib/observability";
import { backendUrl } from "@/lib/site";

/** Timeout de fetch al backend (debe ser < maxDuration=60 de cada route). */
export const UPSTREAM_TIMEOUT_MS = 55_000;

const WAKING_BODY = {
  detail: "El servidor está despertando. Reintenta en unos segundos.",
  code: "backend_waking",
} as const;

export function backendBase(): string {
  return backendUrl();
}

function parseUpstreamJson(text: string, fallback: unknown): unknown {
  try {
    return text ? JSON.parse(text) : fallback;
  } catch {
    return { detail: "Respuesta no válida del servidor" };
  }
}

function clientIp(req?: NextRequest): string {
  if (!req) return "";
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "";
}

export function proxyHeaders(
  req?: NextRequest,
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = { ...(extra || {}) };
  const key =
    process.env.BACKEND_PROXY_KEY?.trim() ||
    process.env.BACKEND_INTERNAL_SECRET?.trim() ||
    "";
  if (key) headers["X-Astro-Proxy-Key"] = key;
  const ip = clientIp(req);
  if (ip) headers["X-Astro-Client-IP"] = ip;
  return headers;
}

export async function proxyToBackend(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: string;
    headers?: Record<string, string>;
    req?: NextRequest;
  },
): Promise<NextResponse> {
  try {
    const upstream = await fetch(`${backendBase()}${path}`, {
      method: init.method,
      headers: proxyHeaders(init.req, init.headers),
      body: init.body,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: "no-store",
    });

    const text = await upstream.text();
    const data = parseUpstreamJson(text, init.method === "GET" ? {} : {});

    if (upstream.status >= 500) {
      logProxyUpstreamError(path, upstream.status);
    }

    const res = NextResponse.json(data, { status: upstream.status });
    const cacheControl = upstream.headers.get("cache-control");
    if (cacheControl) res.headers.set("Cache-Control", cacheControl);
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) res.headers.set("Retry-After", retryAfter);
    return res;
  } catch (err) {
    const detail = err instanceof Error ? err.name : "unknown";
    logProxyUpstreamError(path, 503, detail);
    return NextResponse.json(WAKING_BODY, { status: 503 });
  }
}

export function invalidJsonResponse(): NextResponse {
  return NextResponse.json({ detail: "Solicitud inválida" }, { status: 400 });
}

export function tooLargeResponse(): NextResponse {
  return NextResponse.json({ detail: "Payload too large" }, { status: 413 });
}
