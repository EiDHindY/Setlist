// POST /api/library/save
// Replaces: POST /api/library/save from .NET LibraryController
// Find-or-create a global Song, then link it to the user's library.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, artist, albumArtUrl, appleTrackId, deezerTrackId, duration, videoId, videoTitle, channelName, thumbnailUrl } = body;

    if (!userId || !title || !artist) {
      return Response.json({ error: 'userId, title, and artist are required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Ensure user exists
    const { data: existingUser } = await admin
      .from('Users')
      .select('Id')
      .eq('Id', userId)
      .single();

    if (!existingUser) {
      await admin.from('Users').insert({
        Id: userId,
        Email: 'unknown@setlist.app',
        FullName: 'Unknown User',
        DisplayName: 'Unknown User',
        ExperiencePoints: 0,
        Level: 1,
        IsPremium: false,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        LastActiveAt: new Date().toISOString(),
      });
    }

    // 2. Find or create the global master song
    let song: any = null;

    if (appleTrackId) {
      const { data } = await admin
        .from('Songs')
        .select('*')
        .eq('AppleTrackId', appleTrackId)
        .maybeSingle();
      song = data;
    }

    if (!song && deezerTrackId) {
      const { data } = await admin
        .from('Songs')
        .select('*')
        .eq('DeezerTrackId', deezerTrackId)
        .maybeSingle();
      song = data;
    }

    if (!song) {
      const { data } = await admin
        .from('Songs')
        .select('*')
        .eq('Title', title)
        .eq('Artist', artist)
        .maybeSingle();
      song = data;
    }

    // 2.5 Merge metadata if missing
    if (song) {
      const updates: any = {};
      if (appleTrackId && !song.AppleTrackId) updates.AppleTrackId = appleTrackId;
      if (deezerTrackId && !song.DeezerTrackId) updates.DeezerTrackId = deezerTrackId;
      
      if (Object.keys(updates).length > 0) {
        const { data: updatedSong } = await admin
          .from('Songs')
          .update(updates)
          .eq('Id', song.Id)
          .select()
          .single();
        if (updatedSong) song = updatedSong;
      }
    }

    if (!song) {
      const { data: newSong, error: insertErr } = await admin
        .from('Songs')
        .insert({
          Id: crypto.randomUUID(),
          Title: title,
          Artist: artist,
          AlbumArtUrl: albumArtUrl ?? null,
          AppleTrackId: appleTrackId ?? null,
          DeezerTrackId: deezerTrackId ?? null,
          Duration: duration ?? 0,
          CreatedBy: userId,
          CreatedAt: new Date().toISOString(),
          PlayCount: 0,
          TotalPlaySeconds: 0,
          CollectionCount: 0,
          MatchesWon: 0,
          TournamentsWon: 0,
          WinRate: 0,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      song = newSong;
    }

    // 3. Link song to user's library (if not already there)
    const { data: existingUserSong } = await admin
      .from('UserSongs')
      .select('SongId')
      .eq('UserId', userId)
      .eq('SongId', song.Id)
      .maybeSingle();

    if (!existingUserSong) {
      await admin.from('UserSongs').insert({
        UserId: userId,
        SongId: song.Id,
        AddedAt: new Date().toISOString(),
        PlayCount: 0,
        TotalPlaySeconds: 0,
        MatchesWon: 0,
        TournamentsWon: 0,
        WinRate: 0,
        UserRating: 0,
        MasteryLevel: 0,
      });
    }

    // 4. Return the song with its versions
    const { data: versions } = await admin
      .from('SongVersions')
      .select('Id, YouTubeId, Title, ChannelName, ThumbnailUrl, Duration')
      .eq('SongId', song.Id)
      .eq('UserId', userId);

    return Response.json({
      id: song.Id,
      title: song.Title,
      artist: song.Artist,
      albumArtUrl: song.AlbumArtUrl ?? null,
      duration: song.Duration ?? 0,
      url: song.Url ?? null,
      isrc: song.ISRC ?? null,
      bpm: song.BPM ?? null,
      musicalKey: song.MusicalKey ?? null,
      moodTags: song.MoodTags ?? null,
      versions: (versions ?? []).map((v: any) => ({
        id: v.Id,
        youTubeId: v.YouTubeId,
        title: v.Title,
        channelName: v.ChannelName ?? null,
        thumbnailUrl: v.ThumbnailUrl ?? null,
        duration: v.Duration ?? 0,
      })),
    });
  } catch (err: any) {
    console.error('[POST /api/library/save] Error:', err);
    return Response.json({ error: err.message || JSON.stringify(err) }, { status: 500 });
  }
}
