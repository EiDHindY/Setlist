export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

// DELETE /api/library/setlists/[setlistId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ setlistId: string }> }
) {
  const { setlistId } = await params;

  try {
    const admin = createAdminClient();

    // In a real scenario, you might also want to delete SetlistSongs (the link between songs and setlists)
    // assuming Supabase cascade delete handles it, or we delete it here manually.
    const { error: songsError } = await admin
      .from('SetlistSongs')
      .delete()
      .eq('SetlistId', setlistId);
      
    if (songsError) throw songsError;

    const { error: delError } = await admin
      .from('Setlists')
      .delete()
      .eq('Id', setlistId);

    if (delError) throw delError;

    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/library/setlists] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
