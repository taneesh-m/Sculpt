import { test, expect } from "@playwright/test"

test("sign up, land on dashboard, log a workout via the form, see it persist", async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`

  await page.goto("/signup")
  await page.fill("#name", "E2E Test User")
  await page.fill("#email", email)
  await page.fill("#password", "password123")
  await page.click('button[type="submit"]')

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
