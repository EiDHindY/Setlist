// POST /api/library/save/version
// Replaces: POST /api/library/save/version from .NET LibraryController
// Attaches a new YouTube version to a master song.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, songId, youTubeId, versionTitle, channelName, thumbnailUrl, duration } = body;

    if (!userId || !songId || !youTubeId) {
      return Response.json({ error: 'userId, songId, and youTubeId are required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check if this version already exists for this user + song
    const { data: existing } = await admin
      .from('SongVersions')
      .select('*')
      .eq('SongId', songId)
      .eq('UserId', userId)
      .eq('YouTubeId', youTubeId)
      .single();

    if (existing) {
      return Response.json({
        id: existing.Id,
        youTubeId: existing.YouTubeId,
        title: existing.Title,
        channelName: existing.ChannelName ?? null,
        thumbnailUrl: existing.ThumbnailUrl ?? null,
        duration: existing.Duration ?? 0,
      });
    }

    const { data: version, error } = await admin
      .from('SongVersions')
      .insert({
        Id: crypto.randomUUID(),
        SongId: songId,
        UserId: userId,
        YouTubeId: youTubeId,
        Title: versionTitle ?? 'Unknown Version',
        ChannelName: channelName ?? null,
        ThumbnailUrl: thumbnailUrl ?? null,
        Duration: duration ?? 0,
        AddedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      id: version.Id,
      youTubeId: version.YouTubeId,
      title: version.Title,
      channelName: version.ChannelName ?? null,
      thumbnailUrl: version.ThumbnailUrl ?? null,
      duration: version.Duration ?? 0,
    });
  } catch (err) {
    console.error('[POST /api/library/save/version] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
