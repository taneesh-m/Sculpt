import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/analytics/track-event"

type DietLogInput = {
  food_name: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  serving_size?: string
  notes?: string
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  let query = supabase.from("diet_logs").select("*").eq("user_id", user.id)

  if (date) {
    query = query.gte("created_at", `${date}T00:00:00`).lt("created_at", `${date}T23:59:59`)
  }

  const { data: dietLogs, error } = await query.order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: "Failed to fetch diet logs" }, { status: 500 })

  return NextResponse.json({ dietLogs })
}

// Accepts either a single entry or an array, so the client can commit a whole
// staged "today's foods" list as one batch insert.
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const entries: DietLogInput[] = Array.isArray(body) ? body : [body]

  if (entries.length === 0) {
    return NextResponse.json({ error: "At least one diet log entry is required" }, { status: 400 })
  }

  for (const entry of entries) {
    if (!entry.food_name || entry.calories === undefined || !entry.meal_type) {
      return NextResponse.json(
        { error: "food_name, calories, and meal_type are required for every entry" },
        { status: 400 },
      )
    }
  }

  const { data: dietLogs, error } = await supabase
    .from("diet_logs")
    .insert(entries.map((entry) => ({ ...entry, user_id: user.id })))
    .select()

  if (error) return NextResponse.json({ error: "Failed to create diet log" }, { status: 500 })

  await trackEvent(supabase, user.id, "diet_logged", { count: dietLogs.length })

  return NextResponse.json({ dietLogs }, { status: 201 })
}
