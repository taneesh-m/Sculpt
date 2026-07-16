# Personalization Eval

Measures whether injecting the user's real profile into the system prompt
actually improves response quality, replacing an unmeasured "it's more
personalized" claim with an earned number.

## Methodology

- **Cases** (`cases.json`): 18 synthetic user profiles x 3 questions each
  (54 cases) -- one workout-leaning, one diet-leaning, one mixed question
  per profile. Profiles vary across age, fitness level, goals, medical
  conditions, dietary restrictions, and equipment, deliberately including
  cases where ignoring a stated restriction would produce an unsafe answer
  (e.g. a knee condition, a food allergy), so the rubric's safety criterion
  has something to actually catch.
- **Variants**: `baseline` (a generic system prompt, no profile) vs.
  `profile_conditioned` (the exact prompt-building function the live app
  uses -- `buildProfileConditionedSystemPrompt` in
  `lib/ai/generate-response.ts` -- so the eval measures production behavior,
  not a reimplementation that could drift from it).
- **Generation**: `generateChatResponse` (same file) calls `gpt-4o` with
  each system prompt against the case's question. No tools are involved --
  synthetic profiles have no real backing data to query, and the question
  under test is specifically whether profile text in the prompt changes
  response quality, not tool-use behavior (which is exercised separately in
  the live app).
- **Scoring**: a separate `gpt-4o` call (`judge.ts`) scores each response
  1-5 against a fixed rubric: relevance to the stated goals, safety
  (respecting medical conditions/dietary restrictions -- capped at 2 if
  violated, regardless of other quality), actionability, and specificity to
  the profile. The judge call is a distinct prompt/framing from the
  generator to reduce self-grading bias, and returns structured output
  (`generateObject` + zod), not free text you'd have to eyeball.
- **Storage**: every (case, variant) result is written to the `eval_runs`
  table (score, rationale, raw response, timestamp) via the service-role
  client -- the one place in this app that uses one, since `eval_runs` has
  no end-user RLS policies at all. Results are durable and queryable, not
  just script stdout.
- **Reporting** (`report.ts`): mean score per variant, the paired
  per-case difference (profile_conditioned minus baseline, matched by
  question), and a 95% CI on that difference so the reported number comes
  with an honest sense of whether it's noise at this sample size.

## Running it

Requires `OPENAI_API_KEY` (and Supabase env vars) to be set -- see root
`env.example`. Each run costs ~108 OpenAI calls (54 cases x 2 variants,
plus a judge call per generation).

```bash
pnpm eval          # runs all cases, writes to eval_runs
pnpm eval:report   # prints the latest run's summary
```

## Honesty note

This is a pilot-scale eval (54 cases), not a large-scale study --
appropriately hedged as such. Whatever number it produces should be
reported as-is, including if it's smaller than you'd like, since the whole
point is replacing an invented metric with a real, defensible one.
