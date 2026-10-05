import { afterEach, describe, expect, it } from "vitest";
import { CANONICAL_SITE_URL, isAllowedOrigin, siteUrl } from "./site";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("isAllowedOrigin", () => {
  it("accepts the canonical production host", () => {
    expect(isAllowedOrigin(CANONICAL_SITE_URL)).toBe(true);
  });

  it("rejects arbitrary vercel.app previews", () => {
    expect(isAllowedOrigin("https://evil.vercel.app")).toBe(false);
    expect(isAllowedOrigin("https://astro-engineering-git-hack.vercel.app")).toBe(false);
  });

  it("accepts this deployment preview only via VERCEL_URL", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "astro-engineering-git-feat-abc.vercel.app";
    expect(isAllowedOrigin("https://astro-engineering-git-feat-abc.vercel.app")).toBe(true);
    expect(isAllowedOrigin("https://other.vercel.app")).toBe(false);
  });
});

describe("siteUrl", () => {
  it("falls back to canonical", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SITE_URL;
    expect(siteUrl()).toBe(CANONICAL_SITE_URL);
  });
});
