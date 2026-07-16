import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  const { data: dietLog, error } = await supabase
    .from("diet_logs")
    .update(body)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Diet log not found" }, { status: 404 })

  return NextResponse.json({ dietLog })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase.from("diet_logs").delete().eq("id", id).eq("user_id", user.id)

  if (error) return NextResponse.json({ error: "Diet log not found" }, { status: 404 })

  return NextResponse.json({ message: "Diet log deleted successfully" })
}
