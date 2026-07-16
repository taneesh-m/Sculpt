import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DAYS = 14

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: nutrition, error: nutritionError }, { data: workouts, error: workoutsError }] = await Promise.all([
    supabase
      .from("user_daily_nutrition_summary")
      .select("day, total_calories")
      .eq("user_id", user.id)
      .gte("day", since)
      .order("day", { ascending: true }),
    supabase.from("workouts").select("created_at").eq("user_id", user.id).gte("created_at", since),
  ])

  if (nutritionError || workoutsError) {
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }

  // Build a dense day-by-day series (including zero days) so the chart
  // doesn't silently skip days with no activity.
  const days: string[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  const caloriesByDay = new Map((nutrition ?? []).map((row) => [row.day.slice(0, 10), row.total_calories]))
  const workoutsByDay = new Map<string, number>()
  for (const w of workouts ?? []) {
    const day = w.created_at.slice(0, 10)
    workoutsByDay.set(day, (workoutsByDay.get(day) ?? 0) + 1)
  }

  const series = days.map((day) => ({
    day,
    calories: Math.round(caloriesByDay.get(day) ?? 0),
    workouts: workoutsByDay.get(day) ?? 0,
  }))

  return NextResponse.json({ series })
}
