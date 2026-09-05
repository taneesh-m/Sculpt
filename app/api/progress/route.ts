import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/analytics/track-event"

// Body composition / measurement check-ins. Weight and muscle mass are stored
// canonically in kilograms (same convention as profiles.weight_kg); the client
// converts for display when the user prefers imperial.
type ProgressEntryInput = {
  weight?: number
  body_fat_percentage?: number
  muscle_mass?: number
  measurements?: Record<string, number>
  progress_notes?: string
}

const MEASURABLE_FIELDS = ["weight", "body_fat_percentage", "muscle_mass", "measurements"] as const

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") ?? "", 10)

  let query = supabase
    .from("progress_tracking")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (Number.isFinite(limit) && limit > 0) query = query.limit(limit)

  const { data: entries, error } = await query

  if (error) return NextResponse.json({ error: "Failed to fetch progress entries" }, { status: 500 })

  return NextResponse.json({ entries })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body: ProgressEntryInput = await request.json()

  // Notes alone aren't a check-in -- require at least one actual measurement,
  // otherwise the history fills with rows that can't be charted or compared.
  const hasMeasurement = MEASURABLE_FIELDS.some((field) => {
    const value = body[field]
    return value !== undefined && value !== null && !(typeof value === "object" && Object.keys(value).length === 0)
  })

  if (!hasMeasurement) {
    return NextResponse.json(
      { error: "At least one of weight, body_fat_percentage, muscle_mass, or measurements is required" },
      { status: 400 },
    )
  }

  const { data: entry, error } = await supabase
    .from("progress_tracking")
    .insert([{ ...body, user_id: user.id }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Failed to create progress entry" }, { status: 500 })

  await trackEvent(supabase, user.id, "progress_logged")

  return NextResponse.json({ entry }, { status: 201 })
}
