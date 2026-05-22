export interface Folder {
  id: string;
  name: string;
  ownerId: string;
  parentFolderId: string | null; // For hierarchical folders
  createdAt: string;
}

export interface Setlist {
  id: string;
  name: string;
  description: string | null;
  folderId: string | null; // Null if it's at the root level
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper type for the UI tree structure
export interface FolderNode extends Folder {
  subFolders: FolderNode[];
  setlists: Setlist[];
}
