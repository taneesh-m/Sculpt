import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Reads the pre-aggregated user_daily_nutrition_summary view instead of
// pulling every raw diet_logs row to the server on each dashboard load.
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("start_date")
  const endDate = searchParams.get("end_date")

  let query = supabase.from("user_daily_nutrition_summary").select("*").eq("user_id", user.id)

  if (startDate) query = query.gte("day", startDate)
  if (endDate) query = query.lte("day", endDate)

  const { data: summary, error } = await query.order("day", { ascending: false })

  if (error) return NextResponse.json({ error: "Failed to fetch nutrition summary" }, { status: 500 })

  return NextResponse.json({ summary })
}
