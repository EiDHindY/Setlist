export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

// GET /api/library/setlists/[setlistId]/songs
export async function GET(
  req: Request,
  { params }: { params: Promise<{ setlistId: string }> }
) {
  const { setlistId } = await params;

  try {
    const admin = createAdminClient();

    // Fetch the setlist to check OwnerId
    const { data: setlist, error: sError } = await admin
      .from('Setlists')
      .select('OwnerId')
      .eq('Id', setlistId)
      .single();

    if (sError || !setlist) {
      return Response.json({ error: 'Setlist not found' }, { status: 404 });
    }

    const userId = setlist.OwnerId;

    // Fetch SetlistSongs
    const { data: setlistSongs, error: ssError } = await admin
      .from('SetlistSongs')
      .select(`
        SongId,
        Position,
        AddedAt,
        Songs:Songs(Id, Title, Artist, AlbumArtUrl, Duration, Url)
      `)
      .eq('SetlistId', setlistId)
      .order('Position', { ascending: true });

    if (ssError) throw ssError;
    if (!setlistSongs || setlistSongs.length === 0) return Response.json([]);

    const songIds = setlistSongs.map((ss: any) => ss.SongId);

    // Fetch versions
    const { data: versions, error: vError } = await admin
      .from('SongVersions')
      .select('Id, SongId, YouTubeId, Title, ChannelName, ThumbnailUrl, Duration')
      .eq('UserId', userId)
      .in('SongId', songIds);

    if (vError) throw vError;

    // Fetch credits
    const { data: creditsData, error: cError } = await admin
      .from('SongCredits')
      .select('SongId, CreditsData')
      .in('SongId', songIds);

    if (cError) throw cError;

    // Merge
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

    const result = setlistSongs.map((ss: any) => {
      const s = ss.Songs as any;
      if (!s) return null;
      return {
        id: s.Id,
        title: s.Title,
        artist: s.Artist,
        albumArt: s.AlbumArtUrl ?? null,
        duration: s.Duration ?? 0,
        url: s.Url ?? null,
        addedAt: ss.AddedAt,
        position: ss.Position,
        credits: creditsBySongId[s.Id] ?? undefined,
        versions: versionsBySongId[s.Id] ?? [],
      };
    }).filter(Boolean);

    return Response.json(result);
  } catch (err) {
    console.error('[GET /api/library/setlists/[setlistId]/songs] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/library/setlists/[setlistId]/songs
export async function POST(
  req: Request,
  { params }: { params: Promise<{ setlistId: string }> }
) {
  const { setlistId } = await params;

  try {
    const { songId } = await req.json();
    if (!songId) {
      return Response.json({ error: 'Missing songId' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get current max position
    const { data: maxPosData, error: maxError } = await admin
      .from('SetlistSongs')
      .select('Position')
      .eq('SetlistId', setlistId)
      .order('Position', { ascending: false })
      .limit(1);

    if (maxError) throw maxError;
    const maxPosition = maxPosData && maxPosData.length > 0 ? (maxPosData[0].Position ?? 0) : 0;

    const { error: insertError } = await admin
      .from('SetlistSongs')
      .insert({
        SetlistId: setlistId,
        SongId: songId,
        Position: maxPosition + 1,
        AddedAt: new Date().toISOString()
      });

    if (insertError) {
      // Check if it's unique constraint violation (already in setlist)
      if (insertError.code === '23505') {
        return Response.json({ error: 'Song already in setlist' }, { status: 400 });
      }
      throw insertError;
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[POST /api/library/setlists/[setlistId]/songs] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/library/setlists/[setlistId]/songs
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ setlistId: string }> }
) {
  const { setlistId } = await params;
  const { searchParams } = new URL(req.url);
  const songId = searchParams.get('songId');

  if (!songId) {
    return Response.json({ error: 'Missing songId' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { error: deleteError } = await admin
      .from('SetlistSongs')
      .delete()
      .eq('SetlistId', setlistId)
      .eq('SongId', songId);

    if (deleteError) throw deleteError;

    // Optional: Re-index remaining songs' positions to avoid gaps
    const { data: remaining, error: selectError } = await admin
      .from('SetlistSongs')
      .select('SongId')
      .eq('SetlistId', setlistId)
      .order('Position', { ascending: true });

    if (!selectError && remaining && remaining.length > 0) {
      // Perform updates
      for (let i = 0; i < remaining.length; i++) {
        await admin
          .from('SetlistSongs')
          .update({ Position: i + 1 })
          .eq('SetlistId', setlistId)
          .eq('SongId', remaining[i].SongId);
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/library/setlists/[setlistId]/songs] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
