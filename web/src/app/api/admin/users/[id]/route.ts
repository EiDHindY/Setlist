// GET /api/admin/users/[id]
// Returns a single user's full profile, their songs, and their setlists.

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const admin = createAdminClient();

    const [
      { data: user, error: uError },
      { data: userSongs, error: usError },
      { data: setlists, error: slError },
    ] = await Promise.all([
      admin.from('Users').select('*').eq('Id', id).single(),
      admin
        .from('UserSongs')
        .select('AddedAt, Songs:Songs(Id, Title, Artist, Duration)')
        .eq('UserId', id)
        .order('AddedAt', { ascending: false }),
      admin
        .from('Setlists')
        .select('Id, Name, CreatedAt')
        .eq('UserId', id)
        .order('CreatedAt', { ascending: false }),
    ]);

    if (uError) throw uError;

    return Response.json({
      user,
      songs: (userSongs ?? []).map((us: any) => ({
        ...us.Songs,
        addedAt: us.AddedAt,
      })),
      setlists: setlists ?? [],
    });
  } catch (err) {
    console.error(`[GET /api/admin/users/${id}] Error:`, err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
