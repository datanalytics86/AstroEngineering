import type { BirthData } from "./types";

const SITE = "https://astro-engineering.vercel.app";

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(raw: string): string {
  const pad = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSharePayload(data: BirthData): string {
  const compact = [
    data.name,
    data.birth_date,
    data.birth_time,
    String(data.latitude),
    String(data.longitude),
    String(data.timezone_offset),
    data.city ?? "",
  ].join("|");
  return toBase64Url(compact);
}

export function decodeSharePayload(raw: string): BirthData | null {
  try {
    const compact = fromBase64Url(raw);
    const [name, birth_date, birth_time, lat, lng, tz, city] = compact.split("|");
    const latitude = Number(lat);
    const longitude = Number(lng);
    const timezone_offset = Number(tz);
    if (!name || !birth_date || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    return {
      name,
      birth_date,
      birth_time: birth_time || "12:00",
      latitude,
      longitude,
      timezone_offset: Number.isFinite(timezone_offset) ? timezone_offset : 0,
      city: city || undefined,
    };
  } catch {
    return null;
  }
}

export function shareChartUrl(data: BirthData): string {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE;
  return `${origin}/nueva?share=${encodeURIComponent(encodeSharePayload(data))}`;
}
