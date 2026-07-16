import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasConsecutiveDays } from "@/lib/progress/streaks"

export type BadgeStatus = {
  id: string
  name: string
  description: string
  earned: boolean
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [{ count: workoutCount }, { data: profile }, { data: streaks }, { data: dietLogs }, { count: monthlyWorkouts }] =
    await Promise.all([
      supabase.from("workouts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("profiles").select("workout_frequency").eq("id", user.id).single(),
      supabase.rpc("get_user_streaks", { p_user_id: user.id }),
      supabase
        .from("diet_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

  const dietDays = new Set((dietLogs ?? []).map((log) => log.created_at.slice(0, 10)))
  const currentStreak = streaks?.[0]?.current_streak_days ?? 0
  const monthlyTarget = (profile?.workout_frequency ?? 3) * 4

  const badges: BadgeStatus[] = [
    {
      id: "first-workout",
      name: "First Workout",
      description: "Completed your first workout",
      earned: (workoutCount ?? 0) > 0,
    },
    {
      id: "nutrition-master",
      name: "Nutrition Master",
      description: "Tracked meals for 7 consecutive days",
      earned: hasConsecutiveDays(dietDays, 7),
    },
    {
      id: "streak-warrior",
      name: "Streak Warrior",
      description: "Used the app for 14 consecutive days",
      earned: currentStreak >= 14,
    },
    {
      id: "monthly-champion",
      name: "Monthly Champion",
      description: "Completed all workout goals for a month",
      earned: (monthlyWorkouts ?? 0) >= monthlyTarget,
    },
  ]

  return NextResponse.json({ badges })
}
