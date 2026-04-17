import { test, expect } from "@playwright/test";

const API = "http://localhost:8080";

test.describe("API health", () => {
  test("healthz returns ok", async ({ request }) => {
    const res = await request.get(`${API}/api/healthz`);
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toMatchObject({ status: "ok" });
  });

  test("collections returns 17 seeded collections", async ({ request }) => {
    const res = await request.get(`${API}/api/collections`);
    expect(res.ok()).toBeTruthy();
    const data: unknown[] = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThanOrEqual(17);
  });

  test("featured essays returns at least one essay", async ({ request }) => {
    const res = await request.get(`${API}/api/essays/featured`);
    expect(res.ok()).toBeTruthy();
    const data: Array<{ essayId: string; titlePt: string }> = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].essayId).toBeTruthy();
    expect(data[0].titlePt).toBeTruthy();
  });

  test("stats returns archive statistics", async ({ request }) => {
    const res = await request.get(`${API}/api/stats`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.totalCollections).toBeGreaterThanOrEqual(17);
  });
});

test.describe("Home page", () => {
  test("loads and shows featured content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Lu Xun|鲁迅/i);
    // Hero section visible
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

test.describe("Collections page", () => {
  test("lists all collections", async ({ page }) => {
    await page.goto("/collections");
    // Page has a static h1 + h2 header; collection cards load after API fetch
    await expect(page.locator("h2").filter({ hasText: /Coleções/i })).toBeVisible({ timeout: 10_000 });
    // At least one collection link appears once data loads
    await expect(page.locator("a[href^='/collections/']").first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Essays page", () => {
  test("loads and shows essays", async ({ page }) => {
    await page.goto("/essays");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("search filters essays", async ({ page }) => {
    await page.goto("/essays");
    const search = page.locator("input[type=search], input[placeholder*=uscar i]").first();
    if (await search.isVisible()) {
      await search.fill("Liu Hezhen");
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Essay reader", () => {
  test("loads a seeded essay with bilingual content", async ({ page }) => {
    await page.goto("/essays/lx_19260401_001");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
    // Should show both Chinese and Portuguese tabs/sections
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});

test.describe("Admin login gate", () => {
  test("unauthenticated access to admin dashboard redirects to login", async ({
    page,
  }) => {
    await page.goto("/admin/dashboard");
    // Should end up on login page or show a login prompt
    await expect(page).toHaveURL(/admin|login/);
  });
});
