import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: chatHistory, error } = await supabase
    .from("chat_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 })

  return NextResponse.json({ chatHistory })
}

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase.from("chat_history").delete().eq("user_id", user.id)

  if (error) return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 })

  return NextResponse.json({ message: "Chat history cleared successfully" })
}
