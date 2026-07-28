import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchUsdaFoods } from "@/lib/usda"

// Real food search against USDA FoodData Central, exposed to the manual
// diet-logging UI. The AI coach reaches the same data via its searchNutrition
// tool; this route is the equivalent path for the non-AI "Add Food" form.
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")?.trim()
  if (!query) return NextResponse.json({ foods: [] })

  try {
    const foods = await searchUsdaFoods(query, 10)
    return NextResponse.json({ foods })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Food search failed"
    // Surface a config problem (missing USDA_API_KEY) distinctly from a
    // transient upstream failure so the client can show a useful message.
    const status = message.includes("USDA_API_KEY") ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
