import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// This is the main chat orchestrator that decides which agent to use
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    // Determine which agent to use based on the message content
    let agentType = "orchestrator"

    if (message.toLowerCase().includes("workout") || message.toLowerCase().includes("exercise")) {
      agentType = "workout"
    } else if (
      message.toLowerCase().includes("diet") ||
      message.toLowerCase().includes("nutrition") ||
      message.toLowerCase().includes("food")
    ) {
      agentType = "diet"
    }

    // Route to the appropriate agent
    let response

    if (agentType === "workout") {
      response = await callWorkoutAgent(message)
    } else if (agentType === "diet") {
      response = await callDietAgent(message)
    } else {
      // Default orchestrator response
      response = await generateText({
        model: openai("gpt-4o"),
        prompt: message,
        system:
          "You are a helpful fitness and nutrition assistant. Your job is to guide users to the workout or diet agent based on their questions. For workout questions, mention the workout agent. For nutrition questions, mention the diet agent. Keep responses brief and helpful.",
      })
    }

    return NextResponse.json({
      content: response.text,
      agent: agentType,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}

async function callWorkoutAgent(message: string) {
  return generateText({
    model: openai("gpt-4o"),
    prompt: message,
    system:
      "You are a workout specialist AI agent. Provide expert advice on exercises, workout routines, and fitness goals. Keep responses concise and actionable. Focus only on workout-related topics.",
  })
}

async function callDietAgent(message: string) {
  return generateText({
    model: openai("gpt-4o"),
    prompt: message,
    system:
      "You are a nutrition specialist AI agent with access to USDA nutrition data. Provide expert advice on diet, nutrition, and meal planning. Include specific nutritional information when relevant. Keep responses concise and actionable. Focus only on nutrition-related topics.",
  })
}
