# Sculpt - AI Fitness & Nutrition Coach

A full-stack fitness and nutrition app with a tool-calling AI coach that can
read and log a user's real workout/diet history, built as a single Next.js
application backed by Supabase (Postgres + Auth) and OpenAI.

## Architecture

- **Single Next.js app** (App Router) -- no separate backend service. All
  business logic lives in Route Handlers under `app/api/**`.
- **Supabase** for auth (email/password + Google OAuth) and Postgres data,
  with Row Level Security enforcing per-user data isolation at the database
  layer -- every table's RLS policy checks `auth.uid() = user_id`, and every
  Route Handler runs with a request-scoped, cookie-authenticated Supabase
  client (`lib/supabase/server.ts`), not a service-role key. The one
  exception is the offline eval script (see below), which needs to write to
  a table with no end-user access at all.
- **AI SDK v5 + OpenAI (`gpt-4o`)** for the chat coach, with real
  tool-calling: the model can call `getUserProfile`, `getWorkoutHistory`,
  `getDietLogs`, `logWorkout`, `logDietEntry`, `searchNutrition` (real USDA
  FoodData Central lookups), and `generateWorkoutPlan`/`generateMealPlan`
  (structured output via zod, persisted to the `ai_plans` table) -- see
  `lib/ai/tools.ts`. Responses stream to the client via `useChat`.
- **React Query** for client-side data fetching/caching (`lib/hooks/*`).

## Features

- Real authentication (email/password + Google OAuth), gated by middleware
  and RLS, not a client-side check.
- Workout and diet logging backed by Postgres, not localStorage.
- An AI coach that actually knows what you logged and can log things for
  you, instead of guessing from a static system prompt.
- Real nutrition lookups against USDA FoodData Central, not a hardcoded
  4-item mock dictionary.
- A measured personalization eval (`eval/`) comparing a generic prompt
  against the real profile-conditioned one, scored by an LLM judge against
  a fixed rubric -- see `eval/README.md` for methodology.
- Progress badges and an analytics dashboard computed from real logged
  data and a Postgres streak function, not hardcoded placeholders.
- Unit, integration, component, and e2e tests; CI on every PR.

## Prerequisites

- Node.js 20+ and pnpm
- A [Supabase](https://supabase.com) project (or the Supabase CLI +
  Docker for local development)
- An [OpenAI](https://platform.openai.com) API key
- A free [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup)
  API key

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment variables** -- copy `env.example` to `.env.local` and fill
   in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   OPENAI_API_KEY=...
   USDA_API_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # only used by the offline eval script
   ```
   Google OAuth is configured in the Supabase dashboard (Authentication ->
   Providers -> Google), not read from an env var.

3. **Database**: either point at a hosted Supabase project and run
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   or run everything locally with the Supabase CLI + Docker:
   ```bash
   supabase start   # prints local URL/anon key -- put them in .env.local
   supabase db reset   # applies supabase/migrations/ from scratch
   ```

4. **Run it**
   ```bash
   pnpm dev
   ```
   Visit `http://localhost:3000` -- you'll be redirected to `/signup`.

## Testing

```bash
pnpm test        # unit + integration + component tests (vitest)
pnpm test:e2e    # end-to-end (Playwright) -- needs the dev server + a Supabase instance running
pnpm typecheck
pnpm lint
```

CI (`.github/workflows/ci.yml`) runs two jobs on every PR: `test`
(lint/typecheck/unit) and `e2e`, which spins up an ephemeral Supabase
stack on the runner (via the Supabase CLI + Docker), applies all
migrations, and runs the full Playwright suite against it -- hermetic, so
it never touches a hosted database. Separately, `.github/workflows/smoke.yml`
runs a lightweight smoke test (login page renders, unauthenticated API
returns 401) against each successful Vercel deployment via its
`deployment_status` webhook.

## Personalization eval

```bash
pnpm eval           # runs the eval suite, writes results to eval_runs
pnpm eval:report    # prints the latest run's summary + a 95% CI
```

See `eval/README.md` for the full methodology.

## Project structure

```
sculpt/
├── app/
│   ├── api/                 # Route Handlers (workouts, diet, chat, profile, analytics, progress...)
│   ├── login/, signup/      # Auth pages
│   ├── auth/callback/       # OAuth callback
│   └── page.tsx             # Dashboard (auth-gated Server Component)
├── components/               # UI components (dashboard tabs, chat, auth)
├── lib/
│   ├── ai/                  # Tool definitions, schemas, shared prompt-building
│   ├── supabase/            # Browser/server/middleware Supabase clients
│   ├── hooks/                # React Query hooks
│   ├── analytics/            # Event tracking
│   └── progress/              # Streak/badge helper logic
├── supabase/migrations/      # Versioned SQL migrations (schema, RLS, grants, functions)
├── eval/                     # Personalization eval harness
├── e2e/                      # Playwright tests
└── middleware.ts              # Session refresh + auth gating
```

## Deployment

1. Push to GitHub, import the repo into [Vercel](https://vercel.com).
2. Set the same env vars from `.env.local` in the Vercel project settings.
3. Point your Supabase project's Auth settings (Site URL, Redirect URLs)
   at the Vercel production domain, and add that domain to the Google
   OAuth client's authorized redirect URIs.
4. Run `supabase db push` against the production project before first
   deploy (or after adding new migrations).

## License

MIT
