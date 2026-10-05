import { expect, test } from "@playwright/test";

test("home renders", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});

test("legal pages render with placeholders, not invented identity", async ({ page }) => {
  for (const path of ["/privacidad", "/terminos", "/reembolsos", "/contacto"]) {
    const res = await page.goto(path);
    expect(res?.ok(), path).toBeTruthy();
    const text = await page.locator("body").innerText();
    expect(text).toContain("{{LEGAL_NAME}}");
    expect(text.toLowerCase()).not.toContain("nicolás andrade spa");
  }
});

test("source code link is in the footer", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: /c[oó]digo fuente|source code/i });
  await expect(link).toHaveAttribute("href", /github.com\/datanalytics86\/AstroEngineering/);
});
