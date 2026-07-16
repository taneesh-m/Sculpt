import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const planType = searchParams.get("type")

  let query = supabase.from("ai_plans").select("*").eq("user_id", user.id)
  if (planType) query = query.eq("plan_type", planType)

  const { data: plans, error } = await query.order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: "Failed to fetch AI plans" }, { status: 500 })

  return NextResponse.json({ plans })
}
