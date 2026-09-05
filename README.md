# Sculpt — AI Fitness & Nutrition Coach

A full-stack fitness and nutrition app whose AI coach reads and writes the
user's real training and diet data. Single Next.js application (App Router)
backed by Supabase (Postgres + Auth) and OpenAI.

This README describes how the code is organized and why. For the eval
methodology see [`eval/README.md`](eval/README.md).

---

## Architecture at a glance

```
Browser
  │  React 19 · React Query (lib/hooks/*) · shadcn/ui
  │
  ▼
middleware.ts ──────────────────────────────────────────────┐
  refreshes the Supabase session on every request           │
  redirects: unauthenticated → /login                       │
             onboarding incomplete → /onboarding            │
  deliberately passes /api/** straight through              │
  │                                                          │
  ▼                                                          │
app/api/**  ·  16 route handlers, 25 method handlers         │
  │  all business logic lives here — no separate backend     │
  │                                                          │
  ▼                                                          │
lib/supabase/server.ts                                       │
  request-scoped client carrying the user's JWT              │
  │                                                          │
  ▼                                                          │
Postgres (Supabase)                                          │
  31 RLS policies decide what this request may see or write ◄┘
  + table GRANTs, a security_invoker view, a streak function
```

The chat route additionally streams from OpenAI and exposes 8 typed tools,
each closed over that same request-scoped client:

```
app/api/chat/route.ts
  streamText(model: gpt-5.5, tools: buildTools(supabase, userId))
  stopWhen: stepCountIs(5)          ← caps the tool-call chain
  onFinish: persist to chat_history, emit an analytics event
  → toUIMessageStreamResponse()     → useChat() on the client
```

---

## The security model

This is the load-bearing design decision, so it comes first.

**Authorization lives in the database, not in application code.** Every route
handler runs as the signed-in user, and Postgres decides what that user may
touch. A handler that forgets to filter by owner still cannot leak data.

Three Supabase clients exist, and the distinction between them is deliberate:

| Client | Used by | Runs as |
|---|---|---|
| `lib/supabase/client.ts` | Browser components | The signed-in user (anon key + JWT) |
| `lib/supabase/server.ts` | **Every route handler & server component** | The signed-in user, per request, from cookies |
| `lib/supabase/admin.ts` | `eval/run.ts` only | `service_role` — bypasses RLS entirely |

`admin.ts` is the single exception in the codebase and carries a comment
saying so. It exists because `eval_runs` has no end-user access policies at
all, so nothing but the offline eval script can write to it.

### Two independent layers: GRANT and RLS

RLS decides *which rows* a role may touch. But PostgREST also requires a
table-level `GRANT` before the role may attempt the operation **at all**.
Supabase auto-grants for tables created through the dashboard, but not for
tables created by raw migrations — so `0006_grants.sql` does it explicitly.

`eval_runs` demonstrates both layers: it is granted to nobody except
`service_role`, so an authenticated request is refused with
`42501 permission denied for table` *before RLS is ever consulted*. RLS is
still enabled on it with zero policies, which would deny-all on its own if a
grant were ever added.

### The 31 policies

Most tables get four (select / insert / update / delete). The gaps are
intentional:

| Table | Policies | Shape |
|---|:--:|---|
| `workouts` | 4 | `auth.uid() = user_id` |
| `exercises` | 4 | no `user_id` — policies reach through `workout_id` (below) |
| `diet_logs` | 4 | `auth.uid() = user_id` |
| `nutrition_goals` | 4 | `auth.uid() = user_id` |
| `progress_tracking` | 4 | `auth.uid() = user_id` |
| `profiles` | 3 | keys on `auth.uid() = id` — the row *is* the user; no delete (cascades from `auth.users`) |
| `chat_history` | 3 | no update — transcripts aren't rewritable |
| `ai_plans` | 3 | no update — plans are immutable once generated |
| `events` | 2 | select + insert only — append-only activity log |
| `eval_runs` | 0 | deny-all; service role only |
| | **31** | |

`exercises` has no owner column of its own, so its policies traverse to the
parent workout:

```sql
create policy "Users can view exercises from own workouts" on exercises
for select using (
  exists (select 1 from workouts
          where workouts.id = exercises.workout_id
            and workouts.user_id = auth.uid())
);
```

### `security_invoker` on the summary view

`user_daily_nutrition_summary` is created `with (security_invoker = true)`.
Without it, Postgres evaluates a view with the *view owner's* privileges —
and migrations run as a role that bypasses RLS. The view would have returned
every user's nutrition data to every user, while each underlying table still
had correct policies. The boundary would have leaked around the side.

### Why middleware skips `/api`

Page requests get redirected to `/login` or `/onboarding`. API requests
cannot be — a `fetch()` caller expects JSON, and handing it an HTML login page
breaks the client. Route handlers return their own `401` instead.

---

## The AI layer

### Tools

`lib/ai/tools.ts` exports `buildTools(supabase, userId)`, constructed
per-request and closed over the already-authenticated client. There is no code
path by which a tool can reach another user's data: a tool call is just
another RLS-scoped query. If the model invents an ID, the query returns
nothing.

| Tool | Kind | Touches |
|---|---|---|
| `getUserProfile` | read | `profiles` |
| `getWorkoutHistory` | read | `workouts` + joined `exercises` |
| `getDietLogs` | read | `diet_logs`, optional date filter |
| `logWorkout` | write | `workouts` + `exercises`; emits `workout_logged` |
| `logDietEntry` | write | `diet_logs`; emits `diet_logged` |
| `searchNutrition` | external | USDA FoodData Central (`lib/usda.ts`) |
| `generateWorkoutPlan` | structured | zod schema → `ai_plans`; emits `plan_generated` |
| `generateMealPlan` | structured | zod schema → `ai_plans`; emits `plan_generated` |

### Structured output instead of post-hoc parsing

The plan-generating tools take a zod schema (`lib/ai/schemas.ts`) as their
*input schema*, so the model commits to the structure as it generates and the
result is persisted directly. This replaced an earlier approach that generated
prose and scraped structure out of it afterwards — removing a whole class of
parser-drift bugs.

### Shared prompt and model constants

Two pieces of shared state exist specifically to prevent drift between the
live app and the offline eval:

- `lib/ai/generate-response.ts` — `buildProfileConditionedSystemPrompt()` is
  used by **both** the chat route and `eval/run.ts`, so the eval measures the
  exact prompt production sends, not a reimplementation.
- `lib/ai/models.ts` — `CHAT_MODEL` / `JUDGE_MODEL`. An eval is only
  meaningful if it tests the model actually served.

---

## Data model

10 tables, one view, one function. See `supabase/migrations/`.

**User data** — `profiles`, `workouts`, `exercises` (many-to-one on workouts),
`diet_logs`, `nutrition_goals` (unique per user), `progress_tracking`

**App data** — `chat_history`, `ai_plans`

**Instrumentation** — `events`, `eval_runs`

### Aggregation happens in Postgres

Two deliberate pushdowns, rather than pulling rows to the app and looping:

- **`user_daily_nutrition_summary`** (`0003`) — per-day calorie/macro rollup
  backed by a composite `(user_id, created_at)` index matching the view's
  access pattern. Read by `/api/diet/summary`.
- **`get_user_streaks(uuid)`** (`0009`) — current and longest consecutive-day
  activity streaks, computed with the gaps-and-islands technique (consecutive
  days share the same `day - row_number()` value). Returns two integers
  instead of every event row.

### Analytics events are append-only

`trackEvent()` (`lib/analytics/track-event.ts`) is fire-and-forget by design —
analytics must never fail the request it's attached to, so it logs and
swallows errors. The tradeoff: a bad write is silent, so `event_type` is
constrained by a `CHECK` and that constraint has to be widened whenever a new
event type is introduced (see `0012`).

### Migrations

| | |
|---|---|
| `0001` | Core schema, RLS enabled, 26 policies, `handle_new_user` trigger |
| `0002` | `events` table + 2 policies |
| `0003` | Daily nutrition view (`security_invoker`) + composite index |
| `0004` | `eval_runs` — RLS on, no policies |
| `0005` | `ai_plans` + 3 policies |
| `0006` | Table GRANTs to `authenticated` (deliberately excluding `eval_runs`) |
| `0007` | Array-column defaults + backfill (`handle_new_user` left them null) |
| `0008` | GRANTs to `service_role` |
| `0009` | `get_user_streaks()` |
| `0010` | `onboarding_completed` flag + backfill |
| `0011` | `unit_system` preference (display only — storage stays cm/kg) |
| `0012` | Allow `progress_logged` in the `events` check constraint |

---

## Client-side data flow

React Query hooks in `lib/hooks/*` own all server state — one hook per
resource (`use-workouts`, `use-diet`, `use-profile`, `use-progress`,
`use-analytics`, `use-ai-plans`, `use-chat-history`). Mutations invalidate
their query keys on success rather than hand-patching the cache.

`lib/units.ts` handles the metric/imperial split: the database always stores
centimetres and kilograms, and conversion happens at the UI boundary only,
driven by `profiles.unit_system`.

---

## Verification

The architecture makes claims; these are what hold them to account.

### Tests

```
vitest      28 tests   route handlers (chainable Supabase builder mock),
                       pure logic (streaks, schemas), components
playwright  35 tests   against a real, ephemeral Supabase
```

### RLS verification — `e2e/rls.spec.ts`

Worth reading, because the obvious version of this test proves nothing.

Every route handler already adds `.eq("user_id", user.id)` as defence in
depth, so asserting through the API as the wrong user tests the *route
filter*, not the *policy* — that test would still pass with every policy
deleted. So the spec signs up two users and drives PostgREST **directly with
each one's JWT and no `user_id` filter**, leaving the policy as the only thing
that can deny the operation.

32 tests cover select/insert/update/delete across every user-scoped table, the
subquery-based `exercises` policies, the deny-all `eval_runs` table, an
owner-side control (so a green suite can't be explained by seed data never
existing), and finally the app's own endpoints.

### CI — `.github/workflows/ci.yml`

Two jobs on every PR:

- **`test`** — lint, typecheck, vitest
- **`e2e`** — `supabase start` on the runner (Docker), all 12 migrations
  applied from scratch, production build, full Playwright suite

Hermetic: it never touches a hosted database. The Supabase CLI version is
pinned rather than floating, because resolving `latest` goes through the
unauthenticated GitHub API and rate-limits per runner IP.

### Personalization eval — `eval/`

Measures whether profile-conditioning the system prompt actually improves
responses, rather than asserting it: 18 synthetic profiles × 3 questions,
scored 1–5 by an LLM judge against a fixed rubric, reported as a paired
per-case difference with a 95% CI. Results persist to `eval_runs`. Full
methodology and honesty caveats in [`eval/README.md`](eval/README.md).

---

## Project structure

```
app/
  api/                  16 route handlers — all server-side business logic
  auth/callback/        OAuth callback
  onboarding/           Initial profiling wizard (gated by middleware)
  page.tsx              Auth-gated dashboard
components/             Dashboard tabs, chat, auth, settings (+ ui/ primitives)
lib/
  ai/                   Tools, zod schemas, shared prompt builder, model IDs
  supabase/             The three clients (browser / server / admin) + middleware
  hooks/                React Query hooks, one per resource
  analytics/            Fire-and-forget event tracking
  progress/             Streak/badge helpers
  units.ts              Metric ↔ imperial at the UI boundary
  usda.ts               USDA FoodData Central client
supabase/migrations/    12 versioned SQL migrations
eval/                   Personalization eval harness
e2e/                    Playwright specs (onboarding, RLS)
middleware.ts           Session refresh + auth/onboarding gating
```

---

## Commands

```bash
pnpm dev          # dev server
pnpm test         # vitest
pnpm test:e2e     # playwright (needs a running Supabase)
pnpm typecheck
pnpm lint
pnpm eval         # personalization eval  → eval_runs
pnpm eval:report  # paired diff + 95% CI
```

Environment variables are listed in `env.example`. Google OAuth is configured
in the Supabase dashboard, not via env var.

## License

MIT
