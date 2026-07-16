import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workoutId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: workout } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .single()

  if (!workout) return NextResponse.json({ error: "Workout not found" }, { status: 404 })

  const body = await request.json()
  const { name, sets, reps, weight, duration, notes } = body as {
    name: string
    sets?: number
    reps?: number
    weight?: number
    duration?: number
    notes?: string
  }

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const { data: exercise, error } = await supabase
    .from("exercises")
    .insert([{ workout_id: workoutId, name, sets, reps, weight, duration, notes }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Failed to add exercise" }, { status: 500 })

  return NextResponse.json({ exercise }, { status: 201 })
}
