// PATCH /api/library/songs/metadata
// Updates optional metadata like ISRC, BPM, Key, etc.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { songId, isrc, bpm, musicalKey, moodTags } = body;

    if (!songId) {
      return Response.json({ error: 'songId is required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const updates: any = {};
    if (isrc !== undefined) updates.ISRC = isrc;
    if (bpm !== undefined) updates.BPM = bpm;
    if (musicalKey !== undefined) updates.MusicalKey = musicalKey;
    if (moodTags !== undefined) updates.MoodTags = moodTags;

    if (Object.keys(updates).length === 0) {
      return Response.json({ message: 'No updates provided.' });
    }

    const { data, error } = await admin
      .from('Songs')
      .update(updates)
      .eq('Id', songId)
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      songId: data.Id,
      isrc: data.ISRC,
      bpm: data.BPM,
      musicalKey: data.MusicalKey,
      moodTags: data.MoodTags,
    });
  } catch (err: any) {
    console.error('[PATCH /api/library/songs/metadata] Error:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
