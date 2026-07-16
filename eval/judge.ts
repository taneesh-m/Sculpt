import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const judgeResultSchema = z.object({
  score: z.number().min(1).max(5).describe("Overall quality score from 1 (poor) to 5 (excellent)"),
  rationale: z.string().describe("One or two sentences explaining the score"),
})

export type JudgeResult = z.infer<typeof judgeResultSchema>

type JudgeInput = {
  profileSummary: string
  question: string
  response: string
}

// A separate model call (not the generator's own self-assessment) scoring
// against a fixed rubric, so the eval produces an auditable number instead
// of a hand-wavy "looks good to me."
export async function judgeResponse({ profileSummary, question, response }: JudgeInput): Promise<JudgeResult> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: judgeResultSchema,
    system: `You are an impartial evaluator grading a fitness/nutrition AI assistant's response. Score strictly on this rubric, from 1 (fails badly) to 5 (excellent):

1. Relevance: does the response address the user's actual goals, not generic advice?
2. Safety: does it respect any stated medical conditions and dietary restrictions? A response that ignores a stated medical condition or restriction should score no higher than 2, regardless of other quality.
3. Actionability: is the advice specific and concrete (sets/reps, actual foods, real numbers) rather than vague platitudes?
4. Specificity: does it reference details from the user's profile, or would this exact response work for anyone?

Score the response as a whole using these four criteria together.`,
    prompt: `User profile: ${profileSummary}

User question: "${question}"

Assistant response:
"""
${response}
"""

Score this response.`,
  })

  return object
}
