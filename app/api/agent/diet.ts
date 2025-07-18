import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// This would be a real API call in production
async function fetchNutritionData(food: string) {
  // In a real app, this would call the USDA API
  // const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(food)}&api_key=${process.env.USDA_API_KEY}`)
  // return response.json()

  // Mock data for demonstration
  const mockData = {
    "chicken breast": {
      calories: 165,
      protein: 31,
      fat: 3.6,
      carbs: 0,
    },
    "brown rice": {
      calories: 112,
      protein: 2.6,
      fat: 0.9,
      carbs: 23.5,
    },
    broccoli: {
      calories: 34,
      protein: 2.8,
      fat: 0.4,
      carbs: 6.6,
    },
    salmon: {
      calories: 206,
      protein: 22.1,
      fat: 13.4,
      carbs: 0,
    },
  }

  // Default to chicken breast if food not found
  return mockData[food.toLowerCase()] || mockData["chicken breast"]
}

export async function POST(req: NextRequest) {
  try {
    const { message, userProfile } = await req.json()

    // Extract food items mentioned in the message
    const foodKeywords = ["chicken", "rice", "broccoli", "salmon"]
    const mentionedFoods = foodKeywords.filter((food) => message.toLowerCase().includes(food))

    // Fetch nutrition data for mentioned foods
    const nutritionData = {}
    for (const food of mentionedFoods) {
      nutritionData[food] = await fetchNutritionData(food)
    }

    // Create a nutrition context string
    let nutritionContext = ""
    if (Object.keys(nutritionData).length > 0) {
      nutritionContext = "Nutrition data for mentioned foods:\n"
      for (const [food, data] of Object.entries(nutritionData)) {
        nutritionContext += `${food}: ${JSON.stringify(data)}\n`
      }
    }

    const response = await generateText({
      model: openai("gpt-4o"),
      prompt: message,
      system: `You are a nutrition specialist AI agent with access to USDA nutrition data. Provide expert advice on diet, nutrition, and meal planning.
      
      Keep responses concise, actionable, and evidence-based.
      
      When providing nutrition advice, consider:
      - Balanced macronutrient intake
      - Micronutrient needs
      - Portion control
      - Dietary preferences and restrictions
      
      Use the following nutrition data when relevant:
      ${nutritionContext}
      
      Focus only on nutrition-related topics and provide specific, actionable advice.`,
    })

    return NextResponse.json({ content: response.text })
  } catch (error) {
    console.error("Diet agent error:", error)
    return NextResponse.json({ error: "Failed to process nutrition request" }, { status: 500 })
  }
}
