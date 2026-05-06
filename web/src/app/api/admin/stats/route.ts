// GET /api/admin/stats
// Uses the service role key to fetch aggregate stats across all tables.
// Server-side ONLY — never call this from client-side code directly.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    const [
      { count: totalSongs },
      { count: totalUsers },
      { count: totalSets },
      { count: totalVersions },
      { data: recentSongs },
      { data: recentUsers },
    ] = await Promise.all([
      admin.from('Songs').select('*', { count: 'exact', head: true }),
      admin.from('Users').select('*', { count: 'exact', head: true }),
      admin.from('Setlists').select('*', { count: 'exact', head: true }),
      admin.from('SongVersions').select('*', { count: 'exact', head: true }),
      admin.from('Songs').select('Id, Title, Artist, CreatedAt').order('CreatedAt', { ascending: false }).limit(5),
      admin.from('Users').select('Id, DisplayName, Email, CreatedAt').order('CreatedAt', { ascending: false }).limit(5),
    ]);

    return Response.json({
      totalSongs: totalSongs ?? 0,
      totalUsers: totalUsers ?? 0,
      totalSets: totalSets ?? 0,
      totalVersions: totalVersions ?? 0,
      recentSongs: recentSongs ?? [],
      recentUsers: recentUsers ?? [],
    });
  } catch (err) {
    console.error('[GET /api/admin/stats] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
