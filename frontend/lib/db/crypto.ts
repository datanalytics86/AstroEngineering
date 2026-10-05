import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ALGO = "aes-256-gcm";

function keyFromEnv(name: string, fallback: string): Buffer {
  const raw = (process.env[name] || "").trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
      throw new Error(`${name} missing`);
    }
    return scryptSync(fallback, "astroengine-v1", 32);
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const b = Buffer.from(raw, "base64");
  if (b.length === 32) return b;
  return scryptSync(raw, "astroengine-v1", 32);
}

export function dataKey(): Buffer {
  return keyFromEnv("DATA_ENC_KEY", "dev-data-enc-key");
}

export function chartPepper(): Buffer {
  return keyFromEnv("CHART_PEPPER", "dev-chart-pepper");
}

export function sessionSecret(): Buffer {
  return keyFromEnv("SESSION_SECRET", "dev-session-secret");
}

export function encryptJson(obj: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, dataKey(), iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptJson<T>(blob: string): T {
  const buf = Buffer.from(blob, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, dataKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString("utf8")) as T;
}

export function fingerprintBirth(input: {
  birth_date: string;
  birth_time: string;
  latitude: number;
  longitude: number;
  tz_name?: string | null;
}): string {
  const lat = Number(input.latitude).toFixed(4);
  const lon = Number(input.longitude).toFixed(4);
  const tz = (input.tz_name || "").trim();
  const msg = `${input.birth_date}|${input.birth_time}|${lat}|${lon}|${tz}`;
  return createHmac("sha256", chartPepper()).update(msg).digest("hex");
}

export function sha256Hex(value: string): string {
  return createHmac("sha256", "token").update(value).digest("hex");
}

export function hashToken(token: string): string {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function signPayload(payload: string): string {
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySigned(raw: string): string | null {
  const i = raw.lastIndexOf(".");
  if (i <= 0) return null;
  const payload = raw.slice(0, i);
  const sig = raw.slice(i + 1);
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return payload;
}
