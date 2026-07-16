import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: goals, error } = await supabase
    .from("nutrition_goals")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: "Failed to fetch nutrition goals" }, { status: 500 })

  return NextResponse.json({ goals })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  const { data: goals, error } = await supabase
    .from("nutrition_goals")
    .upsert({ ...body, user_id: user.id }, { onConflict: "user_id" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Failed to save nutrition goals" }, { status: 500 })

  return NextResponse.json({ goals })
}
