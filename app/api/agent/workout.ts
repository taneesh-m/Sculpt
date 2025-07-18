import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: NextRequest) {
  try {
    const { message, userProfile } = await req.json()

    // In a real app, you would use the userProfile to personalize the response
    // based on the user's fitness level, goals, etc.

    const response = await generateText({
      model: openai("gpt-4o"),
      prompt: message,
      system: `You are a workout specialist AI agent. Provide expert advice on exercises, workout routines, and fitness goals.
      
      Keep responses concise, actionable, and tailored to the user's fitness level.
      
      When recommending workouts, consider:
      - User's fitness level (beginner, intermediate, advanced)
      - Any injuries or limitations
      - Available equipment
      - Time constraints
      
      Focus only on workout-related topics and provide specific, actionable advice.`,
    })

    return NextResponse.json({ content: response.text })
  } catch (error) {
    console.error("Workout agent error:", error)
    return NextResponse.json({ error: "Failed to process workout request" }, { status: 500 })
  }
}
