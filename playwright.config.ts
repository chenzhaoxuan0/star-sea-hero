import { defineConfig, devices } from "@playwright/test";

const webServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
  ? undefined
  : {
      command: "npm run dev",
      url: "http://127.0.0.1:4010",
      reuseExistingServer: true,
      timeout: 120_000,
    };

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:4010",
    trace: "retain-on-failure",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer,
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
