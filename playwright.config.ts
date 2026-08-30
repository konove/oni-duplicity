import { defineConfig, devices } from "@playwright/test";

// Screenshot tests run against the dev server, because that is the only build
// that exposes `loadMockSave()` (src/debug.ts) - without it every page past the
// overview redirects away and there is nothing to photograph.
export default defineConfig({
  testDir: "./e2e",

  // Baselines are per-platform: Chromium renders text differently on Windows
  // and Linux, so a baseline taken here will not match one taken elsewhere.
  // Playwright encodes the platform in the filename, which keeps that honest
  // rather than silently failing.
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}-{platform}{ext}",

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? "line" : "list",

  use: {
    baseURL: "http://localhost:8080",
    // Fixed viewport: a screenshot baseline is only meaningful at a fixed size.
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
  },

  expect: {
    toHaveScreenshot: {
      // MUI ripples and transitions would otherwise make every run a coin flip.
      animations: "disabled",
      // Deliberately strict. A ratio-based tolerance is a trap here: 1% of a
      // 1280x900 page is 11,520 pixels, which is enough to hide a control
      // moving or a table reflowing. Same-machine reruns are deterministic, so
      // allow only a hair of antialiasing noise and let real movement fail.
      maxDiffPixels: 50,
    },
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm start",
    url: "http://localhost:8080",
    // A cold webpack build is slow; the filesystem cache makes reruns quick.
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
  },
});
