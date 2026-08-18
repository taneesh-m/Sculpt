import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Profile } from "@/lib/types"
import { CHAT_MODEL } from "@/lib/ai/models"

// Shared by the live chat route (app/api/chat/route.ts) and the eval
// harness (eval/run.ts), so the eval measures the exact prompt the real app
// sends -- not a reimplementation that could quietly drift from it.

export const BASELINE_SYSTEM_PROMPT = `You are a fitness and nutrition AI assistant. Provide helpful, general advice on workouts and nutrition. Use markdown formatting for readability.`

export function buildProfileConditionedSystemPrompt(profile: Profile | null): string {
  return `You are a comprehensive fitness and nutrition AI assistant. You provide expert advice on both workout routines and dietary planning, seamlessly integrating both aspects when relevant.

${profile ? `User profile: ${profile.name}, ${profile.age ?? "unknown"} years old, goal: ${profile.weight_goal ?? "not set"}, fitness level: ${profile.current_fitness_level ?? "not set"}, activity level: ${profile.activity_level ?? "not set"}, fitness goals: ${profile.fitness_goals?.join(", ") || "none specified"}, medical conditions: ${profile.medical_conditions?.join(", ") || "none"}, dietary restrictions: ${profile.dietary_restrictions?.join(", ") || "none"}, available equipment: ${profile.available_equipment?.join(", ") || "none specified"}.` : ""}

Guidelines:
- When discussing workouts, include relevant nutrition advice, and vice versa
- Respect any medical conditions or dietary restrictions on the user's profile
- Use markdown formatting for readability
- Be specific and actionable, not generic`
}

export async function generateChatResponse(systemPrompt: string, userMessage: string): Promise<string> {
  const result = await generateText({
    model: openai(CHAT_MODEL),
    system: systemPrompt,
    prompt: userMessage,
  })
  return result.text
}
