import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Service-role client. NOT for use in Route Handlers or any user-facing
// request path -- every other part of this app uses per-request,
// RLS-scoped clients (see lib/supabase/server.ts) so multi-tenant isolation
// is enforced by the database, not application code. This client bypasses
// RLS entirely and exists only for the offline eval script (eval/run.ts),
// which writes to eval_runs -- a table with no end-user access policies at
// all, so nothing else can write to it.
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
