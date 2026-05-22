export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

// POST /api/library/folders
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, ownerId, parentFolderId } = body;

    if (!id || !name || !ownerId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from('Folders')
      .insert({
        Id: id,
        Name: name,
        OwnerId: ownerId,
        ParentFolderId: parentFolderId ?? null,
        CreatedAt: new Date().toISOString()
      });

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error('[POST /api/library/folders] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
