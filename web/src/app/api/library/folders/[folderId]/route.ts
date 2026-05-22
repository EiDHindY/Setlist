export const runtime = 'edge';

import { createAdminClient } from '@/lib/supabase-admin';

// DELETE /api/library/folders/[folderId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params;

  try {
    const admin = createAdminClient();

    // 1. Check if folder has subfolders
    const { count: subFolderCount, error: checkSubError } = await admin
      .from('Folders')
      .select('*', { count: 'exact', head: true })
      .eq('ParentFolderId', folderId);

    if (checkSubError) throw checkSubError;

    // 2. Check if folder has setlists
    const { count: setlistCount, error: checkSetlistError } = await admin
      .from('Setlists')
      .select('*', { count: 'exact', head: true })
      .eq('FolderId', folderId);

    if (checkSetlistError) throw checkSetlistError;

    // 3. Prevent deletion if not empty
    if ((subFolderCount ?? 0) > 0 || (setlistCount ?? 0) > 0) {
      return Response.json(
        { error: 'Folder is not empty. Please remove all contents before deleting.' },
        { status: 400 }
      );
    }

    // 4. Delete the folder
    const { error: delError } = await admin
      .from('Folders')
      .delete()
      .eq('Id', folderId);

    if (delError) throw delError;

    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/library/folders] Error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
