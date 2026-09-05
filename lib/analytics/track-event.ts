import type { SupabaseClient } from "@supabase/supabase-js"

export type AppEventType =
  | "workout_logged"
  | "diet_logged"
  | "progress_logged"
  | "chat_message_sent"
  | "plan_generated"

// Fire-and-forget: analytics should never fail the request it's attached to.
export async function trackEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: AppEventType,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("events").insert([{ user_id: userId, event_type: eventType, metadata }])
  if (error) console.error(`Failed to track event ${eventType}:`, error.message)
}
