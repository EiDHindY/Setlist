export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

// POST /api/library/setlists
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, folderId, ownerId, isPublic } = body;

    if (!id || !name || !ownerId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { error } = await admin
      .from('Setlists')
      .insert({
        Id: id,
        Name: name,
        Description: description ?? null,
        FolderId: folderId ?? null,
        OwnerId: ownerId,
        IsPublic: isPublic ?? false,
        CreatedAt: now,
        UpdatedAt: now
      });

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error('[POST /api/library/setlists] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
