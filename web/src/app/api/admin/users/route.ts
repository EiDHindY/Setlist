// GET /api/admin/users
// Returns all users with their song count. Server-side only via service role key.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: users, error } = await admin
      .from('Users')
      .select('Id, DisplayName, Email, CreatedAt')
      .order('CreatedAt', { ascending: false });

    if (error) throw error;

    // Get song counts per user in one query
    const { data: songCounts, error: scError } = await admin
      .from('UserSongs')
      .select('UserId');

    if (scError) throw scError;

    const countMap: Record<string, number> = {};
    for (const row of songCounts ?? []) {
      countMap[row.UserId] = (countMap[row.UserId] ?? 0) + 1;
    }

    const result = (users ?? []).map((u: any) => ({
      ...u,
      songCount: countMap[u.Id] ?? 0,
    }));

    return Response.json(result);
  } catch (err) {
    console.error('[GET /api/admin/users] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
