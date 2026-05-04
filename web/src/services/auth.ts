// ── AUTH SERVICE ────────────────────────────────────────────────────
// Port of mobile/lib/services/auth_service.dart
// Syncs the Supabase identity with the C# backend

import { supabase } from '@/utils/supabase';

/**
 * Syncs the current Supabase user with the C# Backend.
 * This takes the Supabase Identity and registers it in our central database.
 */
export async function syncUserWithBackend(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const user = session.user;

  const userData = {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Rockstar',
    avatarUrl: user.user_metadata?.avatar_url ?? '',
  };

  try {
    console.log('🛰️ Sending Sync Request to Backend:', `/api/user/sync`);

    const response = await fetch(`/api/user/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      signal: AbortSignal.timeout(10000), // 🛡️ Safety Timeout (10s to handle cold starts)
    });

    if (response.ok) {
      console.log('✅ Backend Sync Successful: User Identity Locked! 🏯');
    } else {
      console.error(`❌ Backend Sync Failed: ${response.status} - ${await response.text()}`);
    }
  } catch (e) {
    console.error('🛑 Sync Hub Error:', e);
  }
}

/**
 * Signs out from Supabase
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
