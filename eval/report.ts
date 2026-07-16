import { config } from "dotenv"
import { join } from "node:path"

config({ path: join(__dirname, "..", ".env") })
config({ path: join(__dirname, "..", ".env.local"), override: true })

import { createAdminClient } from "@/lib/supabase/admin"

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function stdDev(xs: number[], m: number): number {
  return Math.sqrt(xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1))
}

async function main() {
  const supabase = createAdminClient()

  const { data: latestRow } = await supabase.from("eval_runs").select("run_at").order("run_at", { ascending: false }).limit(1).single()

  if (!latestRow) {
    console.log("No eval runs found. Run `pnpm eval` first.")
    return
  }

  const { data: rows, error } = await supabase.from("eval_runs").select("*").eq("run_at", latestRow.run_at)

  if (error || !rows) {
    console.error("Failed to load eval_runs:", error?.message)
    return
  }

  const baseline = rows.filter((r) => r.variant === "baseline")
  const treatment = rows.filter((r) => r.variant === "profile_conditioned")

  const baselineScores = baseline.map((r) => r.score)
  const treatmentScores = treatment.map((r) => r.score)

  const baselineMean = mean(baselineScores)
  const treatmentMean = mean(treatmentScores)

  // Paired difference: match by eval_case_id since the same question was
  // run under both variants.
  const pairedDiffs: number[] = []
  for (const b of baseline) {
    const t = treatment.find((r) => r.eval_case_id === b.eval_case_id)
    if (t) pairedDiffs.push(t.score - b.score)
  }
  const diffMean = mean(pairedDiffs)
  const diffStdDev = stdDev(pairedDiffs, diffMean)
  const standardError = diffStdDev / Math.sqrt(pairedDiffs.length)
  const ci95 = [diffMean - 1.96 * standardError, diffMean + 1.96 * standardError]

  console.log(`Eval run: ${latestRow.run_at}`)
  console.log(`Cases: ${pairedDiffs.length} paired (baseline vs. profile_conditioned)\n`)

  console.log(`Baseline           mean score: ${baselineMean.toFixed(2)} (n=${baselineScores.length})`)
  console.log(`Profile-conditioned mean score: ${treatmentMean.toFixed(2)} (n=${treatmentScores.length})`)
  console.log(`\nMean paired improvement: ${diffMean >= 0 ? "+" : ""}${diffMean.toFixed(2)} points`)
  console.log(`Relative improvement: ${baselineMean > 0 ? ((diffMean / baselineMean) * 100).toFixed(1) : "n/a"}%`)
  console.log(`95% CI on the difference: [${ci95[0].toFixed(2)}, ${ci95[1].toFixed(2)}]`)
  console.log(
    ci95[0] > 0
      ? "-> Improvement is unlikely to be pure noise (CI excludes 0)."
      : "-> Not statistically distinguishable from no difference at this sample size (CI includes 0).",
  )
}

main()
