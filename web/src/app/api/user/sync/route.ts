// POST /api/user/sync
// Replaces: POST /api/user/sync from .NET UserController
// Upserts the user profile after Google login.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, fullName, avatarUrl } = body;

    if (!id) {
      return Response.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('Users')
      .select('*')
      .eq('Id', id)
      .single();

    if (!existing) {
      // First login — create user
      const { data: newUser, error } = await admin
        .from('Users')
        .insert({
          Id: id,
          Email: email ?? '',
          FullName: fullName ?? null,
          DisplayName: fullName ?? null,
          AvatarUrl: avatarUrl ?? null,
          ExperiencePoints: 0,
          Level: 1,
          IsPremium: false,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          LastActiveAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return Response.json(newUser);
    } else {
      // Returning user — update last active + sync Google info
      const { data: updated, error } = await admin
        .from('Users')
        .update({
          FullName: fullName ?? existing.FullName,
          AvatarUrl: avatarUrl ?? existing.AvatarUrl,
          UpdatedAt: new Date().toISOString(),
          LastActiveAt: new Date().toISOString(),
        })
        .eq('Id', id)
        .select()
        .single();

      if (error) throw error;
      return Response.json(updated);
    }
  } catch (err) {
    console.error('[POST /api/user/sync] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
