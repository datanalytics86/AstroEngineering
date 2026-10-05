import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const frontend = join(here, "..", "..");

describe("no hardcoded $2.99", () => {
  it("locales and catalog copy do not include $2.99", () => {
    const files = [
      join(frontend, "lib", "locales", "es.ts"),
      join(frontend, "lib", "locales", "en.ts"),
      join(frontend, "lib", "stripe-server.ts"),
    ];
    for (const file of files) {
      const text = readFileSync(file, "utf-8");
      expect(text.includes("$2.99"), file).toBe(false);
      expect(text.includes("2,99"), file).toBe(false);
    }
  });
});
