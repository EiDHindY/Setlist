export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, songId, seconds, incrementPlayCount } = body;

    if (!userId || !songId || !seconds || seconds <= 0) {
      return Response.json({ error: 'userId, songId, and positive seconds are required.' }, { status: 400 });
    }

    console.log(`[DEBUG Playback] Song: ${songId}, Seconds: ${seconds}, IncrementPlayCount: ${incrementPlayCount}`);
    const admin = createAdminClient();

    const { error } = await admin.rpc('increment_song_play_stats', {
      p_song_id: songId,
      p_user_id: userId,
      p_seconds: Math.floor(seconds),
      p_increment_play_count: !!incrementPlayCount
    });

    if (error) {
      console.error('[POST /api/library/playback] RPC Error:', error);
      throw error;
    }

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('[POST /api/library/playback] Error:', err);
    return Response.json({ error: err.message || JSON.stringify(err) }, { status: 500 });
  }
}
