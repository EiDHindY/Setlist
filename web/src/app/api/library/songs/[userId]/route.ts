// GET /api/library/songs/[userId]
// Replaces: GET /api/library/songs/{userId} from .NET LibraryController

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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
      .select(`
        SongId, 
        AddedAt, 
        PlayCount, 
        TotalPlaySeconds, 
        LastPlayedAt,
        Songs:Songs(Id, Title, Artist, AlbumArtUrl, Duration, Url)
      `)
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

    // Step 2.5: Get credits for all user's songs
    const { data: creditsData, error: cError } = await admin
      .from('SongCredits')
      .select('SongId, CreditsData')
      .in('SongId', songIds);

    if (cError) throw cError;

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

    const creditsBySongId: Record<string, any> = {};
    for (const c of (creditsData ?? [])) {
      creditsBySongId[c.SongId] = c.CreditsData;
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
        playCount: us.PlayCount || 0,
        totalPlaySeconds: us.TotalPlaySeconds || 0,
        lastPlayedAt: us.LastPlayedAt ?? null,
        addedAt: us.AddedAt,
        credits: creditsBySongId[s.Id] ?? undefined,
        versions: versionsBySongId[s.Id] ?? [],
      };
    });

    return Response.json(result);
  } catch (err) {
    console.error('[GET /api/library/songs] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
