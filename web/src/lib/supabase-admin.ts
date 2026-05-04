// ── SUPABASE SERVER-SIDE ADMIN CLIENT ────────────────────────────────
// Uses the service_role key — NEVER expose this to the browser.
// Only used inside Next.js API routes (server-side only).

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,   // No cookies — this is a server-side client
      autoRefreshToken: false,
    },
  });
}
