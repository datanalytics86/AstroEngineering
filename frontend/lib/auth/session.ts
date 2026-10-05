import { cookies } from "next/headers";
import { signPayload, verifySigned } from "@/lib/db/crypto";

export const SESSION_COOKIE = "ae_session";
export const PENDING_COOKIE = "ae_pending_order";
const MAX_AGE = 30 * 24 * 60 * 60;

export interface SessionPayload {
  customerId: string;
  email: string;
  exp: number;
}

export function encodeSession(s: SessionPayload): string {
  return signPayload(Buffer.from(JSON.stringify(s), "utf8").toString("base64url"));
}

export function decodeSession(raw: string | undefined | null): SessionPayload | null {
  if (!raw) return null;
  const payload = verifySigned(raw);
  if (!payload) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (!s.customerId || !s.email || !s.exp) return null;
    if (s.exp * 1000 < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return decodeSession(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}

export function pendingCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 48 * 60 * 60,
  };
}
