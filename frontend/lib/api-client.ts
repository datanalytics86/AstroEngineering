import type { BirthData, ChartResponse, TransitRequest, TransitResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchChart(data: BirthData): Promise<ChartResponse> {
  return post<ChartResponse>("/api/chart", data);
}

export async function fetchTransits(data: TransitRequest): Promise<TransitResponse> {
  return post<TransitResponse>("/api/transits", data);
}
