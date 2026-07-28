import { defineConfig } from "@playwright/test"

const isCI = !!process.env.CI

export default defineConfig({
  testDir: "./e2e",
  // Sequential: parallel workers hitting the dev server's on-demand route
  // compilation simultaneously causes spurious timeouts on first hit.
  fullyParallel: false,
  workers: 1,
  // One retry in CI to absorb cold-start jitter; none locally so flakes surface.
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    // In CI, build + start a production server: `next dev`'s on-demand
    // compilation makes the first hit to each route flaky. Locally, reuse a
    // dev server that's already running for a fast edit-test loop.
    command: isCI ? "pnpm build && pnpm start" : "pnpm dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !isCI,
    timeout: isCI ? 180_000 : 60_000,
  },
})
