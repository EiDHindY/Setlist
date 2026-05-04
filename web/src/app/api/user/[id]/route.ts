// GET /api/user/[id]
// Replaces: GET /api/user/{id} from .NET UserController

export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('Users')
      .select('*')
      .eq('Id', id)
      .single();

    if (error || !data) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(data);
  } catch (err) {
    console.error('[GET /api/user] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
