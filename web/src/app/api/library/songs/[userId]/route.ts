// GET /api/library/songs/[userId]
// Replaces: GET /api/library/songs/{userId} from .NET LibraryController

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const admin = createAdminClient();

    // Step 1: Get user's song IDs + Song metadata
    const { data: userSongs, error: usError } = await admin
      .from('UserSongs')
      .select('SongId, AddedAt, Songs:Songs(Id, Title, Artist, AlbumArtUrl, Duration, Url)')
      .eq('UserId', userId)
      .order('AddedAt', { ascending: false });

    if (usError) throw usError;
    if (!userSongs || userSongs.length === 0) return Response.json([]);

    // Step 2: Get all user's versions in one query
    const songIds = userSongs.map((us: any) => us.SongId);
    const { data: versions, error: vError } = await admin
      .from('SongVersions')
      .select('Id, SongId, YouTubeId, Title, ChannelName, ThumbnailUrl, Duration')
      .eq('UserId', userId)
      .in('SongId', songIds);

    if (vError) throw vError;

    // Step 3: Merge — attach versions to their songs
    const versionsBySongId: Record<string, any[]> = {};
    for (const v of (versions ?? [])) {
      if (!versionsBySongId[v.SongId]) versionsBySongId[v.SongId] = [];
      versionsBySongId[v.SongId].push({
        id: v.Id,
        youTubeId: v.YouTubeId,
        title: v.Title,
        channelName: v.ChannelName ?? null,
        thumbnailUrl: v.ThumbnailUrl ?? null,
        duration: v.Duration ?? 0,
      });
    }

    const result = userSongs.map((us: any) => {
      const s = us.Songs as any;
      return {
        id: s.Id,
        title: s.Title,
        artist: s.Artist,
        albumArtUrl: s.AlbumArtUrl ?? null,
        duration: s.Duration ?? 0,
        url: s.Url ?? null,
        versions: versionsBySongId[s.Id] ?? [],
      };
    });

    return Response.json(result);
  } catch (err) {
    console.error('[GET /api/library/songs] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
