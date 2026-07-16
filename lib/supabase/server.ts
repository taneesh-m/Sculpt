import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Request-scoped, cookie-authenticated client for Route Handlers and Server
// Components. Every query made with this client runs as the signed-in user,
// so RLS policies (auth.uid() = user_id) enforce isolation naturally -- no
// service-role key or manual per-query user filtering is required for
// correctness, though handlers still add .eq('user_id', user.id) explicitly
// as defense in depth.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component render -- session refresh is
            // handled by middleware instead, so this can be safely ignored.
          }
        },
      },
    },
  )
}
