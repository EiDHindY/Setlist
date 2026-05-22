// GET /api/library/setlists/[userId]
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    const admin = createAdminClient();

    // 1. Fetch Folders
    const { data: folders, error: fError } = await admin
      .from('Folders')
      .select('*')
      .eq('OwnerId', userId)
      .order('CreatedAt', { ascending: true });

    if (fError) throw fError;

    // 2. Fetch Setlists
    const { data: setlists, error: sError } = await admin
      .from('Setlists')
      .select('*')
      .eq('OwnerId', userId)
      .order('UpdatedAt', { ascending: false });

    if (sError) throw sError;

    // Convert to camelCase frontend types
    const mappedFolders = (folders || []).map((f: any) => ({
      id: f.Id,
      name: f.Name,
      ownerId: f.OwnerId,
      parentFolderId: f.ParentFolderId ?? null,
      createdAt: f.CreatedAt,
    }));

    const mappedSetlists = (setlists || []).map((s: any) => ({
      id: s.Id,
      name: s.Name,
      description: s.Description ?? null,
      folderId: s.FolderId ?? null,
      ownerId: s.OwnerId,
      isPublic: s.IsPublic ?? false,
      createdAt: s.CreatedAt,
      updatedAt: s.UpdatedAt,
    }));

    return Response.json({ folders: mappedFolders, setlists: mappedSetlists });
  } catch (err) {
    console.error('[GET /api/library/setlists] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
