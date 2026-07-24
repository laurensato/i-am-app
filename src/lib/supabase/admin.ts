import { createClient } from '@supabase/supabase-js'

// Service-role client for privileged operations (e.g. deleting a user's auth account) that
// the anon-key client cannot perform. Server-only — never import this from client code.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
