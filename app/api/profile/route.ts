import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })

  return NextResponse.json({ profile })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  // id/email are owned by auth, not client-editable via this endpoint.
  const { id: _id, email: _email, ...updateData } = body

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })

  return NextResponse.json({ profile })
}
