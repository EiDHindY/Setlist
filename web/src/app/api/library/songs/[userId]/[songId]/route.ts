// DELETE /api/library/songs/[userId]/[songId]
// Replaces: DELETE /api/library/songs/{userId}/{songId} from .NET LibraryController

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string; songId: string }> }
) {
  const { userId, songId } = await params;

  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from('UserSongs')
      .delete()
      .eq('UserId', userId)
      .eq('SongId', songId);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/library/songs] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
