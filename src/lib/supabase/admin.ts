import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// This client bypasses RLS — use ONLY in server-side code where full access is required.
// Never expose the service role key to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
