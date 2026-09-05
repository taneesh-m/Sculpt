import { defineConfig } from "@playwright/test"
import { config } from "dotenv"

// The RLS spec talks to Supabase directly (with each test user's own JWT), so
// the test process itself needs the project URL/anon key -- not just the dev
// server Next boots for us. CI puts them in the environment already; locally
// they come from .env.local.
config({ path: ".env.local" })

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
