import { test, expect } from "@playwright/test"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Cross-user isolation, proved at the database layer.
//
// The route handlers already add `.eq("user_id", user.id)` to every query, so
// hitting `/api/workouts/<other user's id>` only proves the *route filter*
// works. These tests instead talk to PostgREST directly with each user's own
// JWT and no user_id filter at all -- so the only thing that can deny a read,
// insert, update or delete is the row-level security policy itself. The last
// test then checks the app surface on top of that, for defence in depth.
//
// This runs in the same CI job as the rest of the e2e suite, against the
// ephemeral Supabase stack with all migrations applied.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type TestUser = { id: string; email: string; db: SupabaseClient }

// A signed-in client carrying this user's JWT. The anon key alone grants
// nothing here -- every table below has RLS on, so the policies see whatever
// auth.uid() the token resolves to.
async function signUpUser(label: string): Promise<TestUser> {
  const email = `rls-${label}+${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await db.auth.signUp({ email, password: "password123" })
  expect(error, `signUp failed for ${label}`).toBeNull()
  expect(data.session, "local Supabase should return a session immediately (confirmations off)").not.toBeNull()

  return { id: data.user!.id, email, db }
}

// Every user-scoped row user A owns, so user B has something concrete to fail
// to reach. Returns the ids B will try (and fail) to read, update and delete.
async function seedUserData(user: TestUser) {
  const { data: workout, error: workoutError } = await user.db
    .from("workouts")
    .insert([{ user_id: user.id, name: "A's Leg Day", type: "strength", duration: 60 }])
    .select()
    .single()
  expect(workoutError, "owner should be able to insert their own workout").toBeNull()

  const { data: exercise, error: exerciseError } = await user.db
    .from("exercises")
    .insert([{ workout_id: workout.id, name: "A's Squats", sets: 3, reps: 10 }])
    .select()
    .single()
  expect(exerciseError, "owner should be able to insert into their own workout").toBeNull()

  const { data: dietLog } = await user.db
    .from("diet_logs")
    .insert([{ user_id: user.id, food_name: "A's Oatmeal", calories: 300, meal_type: "breakfast" }])
    .select()
    .single()

  const { data: goals } = await user.db
    .from("nutrition_goals")
    .insert([{ user_id: user.id, daily_calories: 2400, weight_goal: "maintain" }])
    .select()
    .single()

  const { data: progress } = await user.db
    .from("progress_tracking")
    .insert([{ user_id: user.id, weight: 80.5, progress_notes: "A's check-in" }])
    .select()
    .single()

  const { data: chat } = await user.db
    .from("chat_history")
    .insert([{ user_id: user.id, user_message: "A's question", ai_response: "A's answer" }])
    .select()
    .single()

  const { data: event } = await user.db
    .from("events")
    .insert([{ user_id: user.id, event_type: "workout_logged" }])
    .select()
    .single()

  const { data: plan } = await user.db
    .from("ai_plans")
    .insert([{ user_id: user.id, plan_type: "workout", payload: { title: "A's plan" } }])
    .select()
    .single()

  return {
    workout: workout.id,
    exercise: exercise.id,
    dietLog: dietLog!.id,
    goals: goals!.id,
    progress: progress!.id,
    chat: chat!.id,
    event: event!.id,
    plan: plan!.id,
  }
}

let alice: TestUser
let bob: TestUser
let aliceRows: Awaited<ReturnType<typeof seedUserData>>

test.beforeAll(async () => {
  expect(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL must be set to run the RLS suite").toBeTruthy()
  expect(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY must be set to run the RLS suite").toBeTruthy()

  alice = await signUpUser("alice")
  bob = await signUpUser("bob")
  aliceRows = await seedUserData(alice)
})

// SELECT policies: an unfiltered read as B must not surface any of A's rows.
const READ_CASES = [
  { table: "workouts", ownedId: () => aliceRows.workout },
  { table: "exercises", ownedId: () => aliceRows.exercise },
  { table: "diet_logs", ownedId: () => aliceRows.dietLog },
  { table: "nutrition_goals", ownedId: () => aliceRows.goals },
  { table: "progress_tracking", ownedId: () => aliceRows.progress },
  { table: "chat_history", ownedId: () => aliceRows.chat },
  { table: "events", ownedId: () => aliceRows.event },
  { table: "ai_plans", ownedId: () => aliceRows.plan },
] as const

for (const { table, ownedId } of READ_CASES) {
  test(`select policy hides ${table} rows owned by another user`, async () => {
    // Deliberately unfiltered: no .eq("user_id", ...). Only the policy stands
    // between Bob and Alice's rows.
    const { data, error } = await bob.db.from(table).select("id")

    expect(error, `unfiltered select on ${table} should not error, just return nothing`).toBeNull()
    expect(data!.map((row) => row.id)).not.toContain(ownedId())

    // Targeting the row by primary key doesn't help either.
    const { data: byId } = await bob.db.from(table).select("id").eq("id", ownedId())
    expect(byId).toEqual([])
  })
}

test("select policy hides other users' profiles", async () => {
  const { data, error } = await bob.db.from("profiles").select("id")

  expect(error).toBeNull()
  expect(data!.map((row) => row.id)).not.toContain(alice.id)
  expect(data!.map((row) => row.id)).toEqual([bob.id])
})

// INSERT policies: the with-check clause must reject a row stamped with
// someone else's user_id, even though the client is authenticated.
// `expectRlsCode` is false only for nutrition_goals: it also has a UNIQUE
// constraint on user_id and Alice already holds that row, so the rejection
// could in principle surface as 23505 rather than the policy's 42501. The
// insert is still refused either way, which is what the test asserts.
const INSERT_CASES = [
  { table: "workouts", expectRlsCode: true, row: () => ({ user_id: alice.id, name: "forged", type: "strength" }) },
  {
    table: "diet_logs",
    expectRlsCode: true,
    row: () => ({ user_id: alice.id, food_name: "forged", calories: 1, meal_type: "snack" }),
  },
  { table: "progress_tracking", expectRlsCode: true, row: () => ({ user_id: alice.id, weight: 99 }) },
  {
    table: "chat_history",
    expectRlsCode: true,
    row: () => ({ user_id: alice.id, user_message: "forged", ai_response: "forged" }),
  },
  { table: "events", expectRlsCode: true, row: () => ({ user_id: alice.id, event_type: "workout_logged" }) },
  { table: "ai_plans", expectRlsCode: true, row: () => ({ user_id: alice.id, plan_type: "workout", payload: {} }) },
  { table: "nutrition_goals", expectRlsCode: false, row: () => ({ user_id: alice.id, daily_calories: 1 }) },
] as const

for (const { table, expectRlsCode, row } of INSERT_CASES) {
  test(`insert policy rejects a ${table} row stamped with another user's id`, async () => {
    const { error } = await bob.db.from(table).insert([row()])

    expect(error, `RLS should have rejected the forged ${table} insert`).not.toBeNull()
    if (expectRlsCode) {
      expect(error!.code).toBe("42501") // insufficient_privilege -- the with-check clause
    }

    // And nothing landed: Alice, who *can* see her own rows, still holds only
    // the single row the seed created for this table.
    const { data: aliceRowsForTable } = await alice.db.from(table).select("id").eq("user_id", alice.id)
    expect(aliceRowsForTable, `a forged row reached ${table}`).toHaveLength(1)
  })
}

test("insert policy rejects an exercise attached to another user's workout", async () => {
  // exercises has no user_id -- its policies reach through workout_id, so this
  // checks the subquery form of the policy specifically.
  const { error } = await bob.db
    .from("exercises")
    .insert([{ workout_id: aliceRows.workout, name: "forged", sets: 1, reps: 1 }])

  expect(error).not.toBeNull()
  expect(error!.code).toBe("42501")
})

// UPDATE / DELETE policies: PostgREST reports success with zero rows affected
// when the using-clause filters the target out, so assert on the returned set.
const WRITE_CASES = [
  { table: "workouts", id: () => aliceRows.workout, patch: { name: "hijacked" } },
  { table: "exercises", id: () => aliceRows.exercise, patch: { name: "hijacked" } },
  { table: "diet_logs", id: () => aliceRows.dietLog, patch: { food_name: "hijacked" } },
  { table: "nutrition_goals", id: () => aliceRows.goals, patch: { daily_calories: 1 } },
  { table: "progress_tracking", id: () => aliceRows.progress, patch: { weight: 1 } },
] as const

for (const { table, id, patch } of WRITE_CASES) {
  test(`update policy blocks writes to another user's ${table} row`, async () => {
    const { data, error } = await bob.db.from(table).update(patch).eq("id", id()).select()

    expect(error).toBeNull()
    expect(data, `RLS should have matched no ${table} rows for the non-owner`).toEqual([])
  })
}

const DELETE_CASES = [
  { table: "workouts", id: () => aliceRows.workout },
  { table: "exercises", id: () => aliceRows.exercise },
  { table: "diet_logs", id: () => aliceRows.dietLog },
  { table: "nutrition_goals", id: () => aliceRows.goals },
  { table: "progress_tracking", id: () => aliceRows.progress },
  { table: "chat_history", id: () => aliceRows.chat },
  { table: "ai_plans", id: () => aliceRows.plan },
] as const

for (const { table, id } of DELETE_CASES) {
  test(`delete policy blocks deleting another user's ${table} row`, async () => {
    const { data, error } = await bob.db.from(table).delete().eq("id", id()).select()

    expect(error).toBeNull()
    expect(data).toEqual([])
  })
}

test("alice's rows all survived bob's attempts", async () => {
  // The flip side of the write tests: confirm the owner still sees everything,
  // so a passing suite can't be explained by the seed data never existing.
  for (const [table, id] of [
    ["workouts", aliceRows.workout],
    ["exercises", aliceRows.exercise],
    ["diet_logs", aliceRows.dietLog],
    ["nutrition_goals", aliceRows.goals],
    ["progress_tracking", aliceRows.progress],
    ["chat_history", aliceRows.chat],
    ["ai_plans", aliceRows.plan],
  ] as const) {
    const { data } = await alice.db.from(table).select("id").eq("id", id)
    expect(data, `owner lost visibility of their own ${table} row`).toHaveLength(1)
  }
})

test("eval_runs is unreachable by any signed-in user", async () => {
  // RLS enabled with zero policies is deny-all for anon and authenticated:
  // reads come back empty rather than erroring, writes are refused outright.
  // Only the offline eval script's service-role key can touch this table.
  const { data, error } = await bob.db.from("eval_runs").select("id")

  expect(error).toBeNull()
  expect(data).toEqual([])

  const { error: insertError } = await bob.db
    .from("eval_runs")
    .insert([{ variant: "baseline", eval_case_id: "forged", score: 1 }])

  expect(insertError, "a table with no policies must reject writes").not.toBeNull()
  expect(insertError!.code).toBe("42501")
})

test("the API surface never returns another user's rows", async ({ page }) => {
  // Defence in depth on top of the policies: sign a third user in through the
  // real UI and read the app's own endpoints with their session cookies.
  const email = `rls-web+${Date.now()}@example.com`
  await page.goto("/signup")
  await page.fill("#name", "RLS Web User")
  await page.fill("#email", email)
  await page.fill("#password", "password123")
  await page.click('button[type="submit"]')
  await page.waitForURL("/onboarding")

  const workouts = await page.request.get("/api/workouts")
  expect(workouts.ok()).toBe(true)
  const workoutIds = ((await workouts.json()).workouts ?? []).map((w: { id: string }) => w.id)
  expect(workoutIds).not.toContain(aliceRows.workout)

  // Alice's workout id is a valid uuid the caller simply doesn't own.
  const single = await page.request.get(`/api/workouts/${aliceRows.workout}`)
  expect(single.status()).toBe(404)

  const progress = await page.request.get("/api/progress")
  expect(progress.ok()).toBe(true)
  const progressIds = ((await progress.json()).entries ?? []).map((e: { id: string }) => e.id)
  expect(progressIds).not.toContain(aliceRows.progress)
})
