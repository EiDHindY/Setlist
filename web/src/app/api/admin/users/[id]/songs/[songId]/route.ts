// GET /api/admin/users/[id]/songs/[songId]
// Returns the core song data + all versions this specific user has for it.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  const { id: userId, songId } = await params;

  try {
    const admin = createAdminClient();

    const [
      { data: song, error: songError },
      { data: userSong, error: usError },
      { data: versions, error: vError },
    ] = await Promise.all([
      // Core song data
      admin.from('Songs').select('*').eq('Id', songId).single(),
      // When this user added it
      admin.from('UserSongs').select('*').eq('UserId', userId).eq('SongId', songId).single(),
      // All versions this user has for this song
      admin
        .from('SongVersions')
        .select('*')
        .eq('UserId', userId)
        .eq('SongId', songId)
        .order('Id', { ascending: true }),
    ]);

    if (songError) throw songError;

    return Response.json({
      song,
      userSong: userSong ?? null,
      versions: versions ?? [],
    });
  } catch (err) {
    console.error(`[GET /api/admin/users/${userId}/songs/${songId}] Error:`, err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
