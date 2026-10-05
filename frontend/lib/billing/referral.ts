/** Referral codes from `?ref=`. Real provider coupons wait on D1. */

export const REF_COOKIE = "ae_ref";
export const REF_MAX_AGE = 60 * 24 * 60 * 60;

export function sanitizeRef(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().slice(0, 32);
  if (!/^[a-zA-Z0-9_-]{2,32}$/.test(v)) return null;
  return v;
}

/** Mock / local coupon label. Lemon Squeezy coupon ids are 🛑 D1. */
export function mockCouponForRef(ref: string): string {
  return `REF_${ref.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`;
}

export function refCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REF_MAX_AGE,
  };
}
