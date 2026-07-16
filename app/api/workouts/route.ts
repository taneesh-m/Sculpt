import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/analytics/track-event"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("*, exercises (id, name, sets, reps, weight, duration, notes)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: "Failed to fetch workouts" }, { status: 500 })

  return NextResponse.json({ workouts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { name, type, duration, notes, exercises } = body as {
    name: string
    type: string
    duration?: number
    notes?: string
    exercises?: Array<{ name: string; sets?: number; reps?: number; weight?: number; duration?: number; notes?: string }>
  }

  if (!name || !type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 })
  }

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert([{ user_id: user.id, name, type, duration, notes }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Failed to create workout" }, { status: 500 })

  if (exercises && exercises.length > 0) {
    const { error: exercisesError } = await supabase
      .from("exercises")
      .insert(exercises.map((ex) => ({ ...ex, workout_id: workout.id })))

    if (exercisesError) {
      return NextResponse.json({ error: "Workout created but failed to add exercises" }, { status: 500 })
    }
  }

  await trackEvent(supabase, user.id, "workout_logged", { workout_id: workout.id })

  return NextResponse.json({ workout }, { status: 201 })
}
