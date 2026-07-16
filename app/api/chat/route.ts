import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"

import { createClient } from "@/lib/supabase/server"
import { buildTools } from "@/lib/ai/tools"
import { trackEvent } from "@/lib/analytics/track-event"
import { buildProfileConditionedSystemPrompt } from "@/lib/ai/generate-response"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const systemPrompt = `${buildProfileConditionedSystemPrompt(profile)}

You have tools to look up and log the user's real data -- use them instead of guessing:
- getUserProfile / getWorkoutHistory / getDietLogs to see what's actually true about this user before advising them
- logWorkout / logDietEntry when the user describes something they did and wants it recorded
- searchNutrition to look up real nutrition facts for a food instead of estimating
- generateWorkoutPlan / generateMealPlan to create and save a structured plan when the user asks for one -- always use these tools for plans rather than just describing a plan in prose, so it gets saved to their account`

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: buildTools(supabase, user.id),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
      const userText = lastUserMessage?.parts.find((p) => p.type === "text")?.text ?? ""

      await supabase.from("chat_history").insert([{ user_id: user.id, user_message: userText, ai_response: text }])
      await trackEvent(supabase, user.id, "chat_message_sent")
    },
  })

  return result.toUIMessageStreamResponse()
}
