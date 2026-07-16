import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  // Sequential: parallel workers hitting the dev server's on-demand route
  // compilation simultaneously causes spurious timeouts on first hit.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
