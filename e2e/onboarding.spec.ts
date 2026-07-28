import { test, expect } from "@playwright/test"

// Completes the initial profiling wizard. Assumes the signup landed the user
// on /onboarding (middleware forces new users here until onboarding_completed).
async function completeOnboarding(page: import("@playwright/test").Page) {
  await page.waitForURL("/onboarding")

  // Step 1 -- Your goals
  await page.getByRole("combobox", { name: "Fitness goals" }).click()
  await page.getByRole("option", { name: "General fitness" }).click()
  await page.keyboard.press("Escape")
  await page.getByRole("combobox", { name: "Weight goal" }).click()
  await page.getByRole("option", { name: "Maintain weight" }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 2 -- About you
  await page.getByRole("combobox", { name: "Gender" }).click()
  await page.getByRole("option", { name: "Male", exact: true }).click()
  await page.fill("#age", "30")
  await page.fill("#height", "180")
  await page.fill("#weight", "80")
  await page.getByRole("combobox", { name: "Current fitness level" }).click()
  await page.getByRole("option", { name: "Intermediate" }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 3 -- Training
  await page.getByRole("combobox", { name: "Available equipment" }).click()
  await page.getByRole("option", { name: "Dumbbells" }).click()
  await page.keyboard.press("Escape")
  await page.getByRole("combobox", { name: "Workout duration" }).click()
  await page.getByRole("option", { name: "45 minutes" }).click()
  await page.getByRole("combobox", { name: "Workout frequency" }).click()
  await page.getByRole("option", { name: "3 days / week" }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 4 -- Nutrition
  await page.getByRole("combobox", { name: "Dietary preferences" }).click()
  await page.getByRole("option", { name: "High protein" }).click()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: /finish/i }).click()
}

test("sign up, complete onboarding, log a workout via the form, see it persist", async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`

  await page.goto("/signup")
  await page.fill("#name", "E2E Test User")
  await page.fill("#email", email)
  await page.fill("#password", "password123")
  await page.click('button[type="submit"]')

  await completeOnboarding(page)

  await page.waitForURL("/")
  await expect(page.getByRole("tab", { name: "Chat" })).toBeVisible()

  await page.getByRole("tab", { name: /workout/i }).click()
  await page.fill("#workout-name", "E2E Leg Day")
  await page.getByRole("combobox").first().click()
  await page.getByRole("option", { name: "Strength Training" }).click()
  await page.fill("#exercise-name", "Squats")
  await page.getByRole("button", { name: "Add Exercise" }).click()
  await page.getByRole("button", { name: "Save Workout" }).click()

  await expect(page.getByText("E2E Leg Day")).toBeVisible()

  // Persistence: reload and confirm it's still there (came from Postgres,
  // not component state).
  await page.reload()
  await page.getByRole("tab", { name: /workout/i }).click()
  await expect(page.getByText("E2E Leg Day")).toBeVisible()
})

test("logged-out visitors are redirected to /login", async ({ page }) => {
  await page.goto("/")
  await page.waitForURL("/login")
  await expect(page.getByText(/welcome back/i)).toBeVisible()
})
