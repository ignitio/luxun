import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @workspace/api-server run dev",
      url: "http://localhost:8080/api/healthz",
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: "8080",
        NODE_ENV: "development",
      },
      timeout: 60_000,
    },
    {
      command: "pnpm --filter @workspace/lu-xun-essays run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: "3000",
        BASE_PATH: "/",
      },
      timeout: 60_000,
    },
  ],
});
