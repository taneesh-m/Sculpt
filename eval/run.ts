import { readFileSync } from "node:fs"
import { join } from "node:path"
import { config } from "dotenv"

// Next.js's own env-loading (.env.local overriding .env) doesn't apply to a
// plain script run via tsx, so load both explicitly, most-specific last.
config({ path: join(__dirname, "..", ".env") })
config({ path: join(__dirname, "..", ".env.local"), override: true })

import { BASELINE_SYSTEM_PROMPT, buildProfileConditionedSystemPrompt, generateChatResponse } from "@/lib/ai/generate-response"
import { judgeResponse } from "./judge"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Profile } from "@/lib/types"

type SyntheticProfile = Pick<
  Profile,
  "name" | "age" | "weight_goal" | "current_fitness_level" | "activity_level" | "fitness_goals" | "medical_conditions" | "dietary_restrictions" | "available_equipment"
>

type EvalCase = {
  id: string
  profile: SyntheticProfile
  questions: string[]
}

function toProfile(p: SyntheticProfile): Profile {
  // Fill in the DB-only fields the prompt builder doesn't use, so the
  // synthetic case satisfies the Profile type without a real signup.
  return {
    ...p,
    id: "eval",
    email: "eval@example.com",
    avatar_url: null,
    height_cm: 0,
    weight_kg: 0,
    gender: "other",
    preferred_workout_duration: 0,
    workout_frequency: 0,
    target_weight: 0,
    body_fat_percentage: 0,
    muscle_mass: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function profileSummary(p: SyntheticProfile): string {
  return `${p.name}, ${p.age} years old, goal: ${p.weight_goal}, fitness level: ${p.current_fitness_level}, activity level: ${p.activity_level}, fitness goals: ${p.fitness_goals.join(", ")}, medical conditions: ${p.medical_conditions.join(", ") || "none"}, dietary restrictions: ${p.dietary_restrictions.join(", ") || "none"}, equipment: ${p.available_equipment.join(", ")}.`
}

async function main() {
  const cases: EvalCase[] = JSON.parse(readFileSync(join(__dirname, "cases.json"), "utf-8"))
  const supabase = createAdminClient()
  const runAt = new Date().toISOString()

  let completed = 0
  const total = cases.reduce((sum, c) => sum + c.questions.length, 0) * 2

  for (const evalCase of cases) {
    const profile = toProfile(evalCase.profile)
    const summary = profileSummary(evalCase.profile)

    for (const question of evalCase.questions) {
      for (const variant of ["baseline", "profile_conditioned"] as const) {
        const systemPrompt = variant === "baseline" ? BASELINE_SYSTEM_PROMPT : buildProfileConditionedSystemPrompt(profile)

        const evalCaseId = `${evalCase.id}-${question.slice(0, 20)}`
        try {
          const response = await generateChatResponse(systemPrompt, question)
          const { score, rationale } = await judgeResponse({ profileSummary: summary, question, response })

          await supabase.from("eval_runs").insert([
            {
              run_at: runAt,
              variant,
              eval_case_id: evalCaseId,
              score,
              judge_rationale: rationale,
              raw_response: response,
            },
          ])
        } catch (error) {
          console.error(`Failed on case ${evalCaseId} (${variant}):`, error instanceof Error ? error.message : error)
        }

        completed++
        process.stdout.write(`\r${completed}/${total} eval calls completed`)
      }
    }
  }

  console.log(`\nDone. Run report.ts to see results for run_at=${runAt}`)
}

main()
