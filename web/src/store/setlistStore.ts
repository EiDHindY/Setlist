import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Folder, Setlist } from '@/types/setlist';
import type { Song } from '@/types/song';

interface SetlistState {
  folders: Folder[];
  setlists: Setlist[];
  setlistSongs: Record<string, Song[]>;
  setlistSongsLoaded: Record<string, boolean>;
  isLoaded: boolean;
  isSyncing: boolean;

  fetchSetlists: (userId: string, force?: boolean) => Promise<void>;
  createFolder: (folder: Folder) => Promise<boolean>;
  deleteFolder: (folderId: string) => Promise<{ success: boolean; error?: string }>;
  createSetlist: (setlist: Setlist) => Promise<boolean>;
  deleteSetlist: (setlistId: string) => Promise<boolean>;
  fetchSetlistSongs: (setlistId: string, force?: boolean) => Promise<void>;
  addSongToSetlist: (setlistId: string, song: Song) => Promise<boolean>;
  removeSongFromSetlist: (setlistId: string, songId: string) => Promise<boolean>;
}

export const useSetlistStore = create<SetlistState>()(
  persist(
    (set, get) => ({
      folders: [],
      setlists: [],
      setlistSongs: {},
      setlistSongsLoaded: {},
      isLoaded: false,
      isSyncing: false,

      fetchSetlists: async (userId: string, force = false) => {
        if (get().isSyncing) return;
        set({ isSyncing: true });

        try {
          const res = await fetch(`/api/library/setlists/user/${userId}`);
          if (res.ok) {
            const data = await res.json();
            set({ folders: data.folders, setlists: data.setlists, isLoaded: true });
          }
        } catch (error) {
          console.error('Failed to sync setlists:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      createFolder: async (folder: Folder) => {
        // Optimistic
        set((state) => ({ folders: [...state.folders, folder] }));
        try {
          const res = await fetch('/api/library/folders', {
            method: 'POST',
            body: JSON.stringify(folder),
          });
          if (!res.ok) throw new Error();
          return true;
        } catch (error) {
          // Rollback
          set((state) => ({ folders: state.folders.filter((f) => f.id !== folder.id) }));
          return false;
        }
      },

      deleteFolder: async (folderId: string) => {
        const original = get().folders;
        // Optimistic
        set((state) => ({ folders: state.folders.filter((f) => f.id !== folderId) }));
        
        try {
          const res = await fetch(`/api/library/folders/${folderId}`, {
            method: 'DELETE',
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete');
          }
          return { success: true };
        } catch (error: any) {
          // Rollback
          set({ folders: original });
          return { success: false, error: error.message };
        }
      },

      createSetlist: async (setlist: Setlist) => {
        // Optimistic
        set((state) => ({ setlists: [...state.setlists, setlist] }));
        try {
          const res = await fetch('/api/library/setlists', {
            method: 'POST',
            body: JSON.stringify(setlist),
          });
          if (!res.ok) throw new Error();
          return true;
        } catch (error) {
          // Rollback
          set((state) => ({ setlists: state.setlists.filter((s) => s.id !== setlist.id) }));
          return false;
        }
      },

      deleteSetlist: async (setlistId: string) => {
        const original = get().setlists;
        // Optimistic
        set((state) => ({ setlists: state.setlists.filter((s) => s.id !== setlistId) }));
        
        try {
          const res = await fetch(`/api/library/setlists/${setlistId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error();
          return true;
        } catch (error) {
          // Rollback
          set({ setlists: original });
          return false;
        }
      },

      fetchSetlistSongs: async (setlistId: string, force = false) => {
        if (!force && get().setlistSongsLoaded[setlistId]) return;

        try {
          const res = await fetch(`/api/library/setlists/${setlistId}/songs`);
          if (res.ok) {
            const songs = await res.json();
            set((state) => ({
              setlistSongs: {
                ...state.setlistSongs,
                [setlistId]: songs,
              },
              setlistSongsLoaded: {
                ...state.setlistSongsLoaded,
                [setlistId]: true,
              },
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch songs for setlist ${setlistId}:`, error);
        }
      },

      addSongToSetlist: async (setlistId: string, song: Song) => {
        const originalSongs = get().setlistSongs[setlistId] || [];

        // Check if already in the list
        if (originalSongs.some((s) => s.id === song.id)) {
          return true; // Already exists
        }

        // Optimistic update
        set((state) => ({
          setlistSongs: {
            ...state.setlistSongs,
            [setlistId]: [...originalSongs, song],
          },
        }));

        try {
          const res = await fetch(`/api/library/setlists/${setlistId}/songs`, {
            method: 'POST',
            body: JSON.stringify({ songId: song.id }),
          });
          if (!res.ok) throw new Error();
          return true;
        } catch (error) {
          // Rollback
          set((state) => ({
            setlistSongs: {
              ...state.setlistSongs,
              [setlistId]: originalSongs,
            },
          }));
          return false;
        }
      },

      removeSongFromSetlist: async (setlistId: string, songId: string) => {
        const originalSongs = get().setlistSongs[setlistId] || [];

        // Optimistic update
        set((state) => ({
          setlistSongs: {
            ...state.setlistSongs,
            [setlistId]: originalSongs.filter((s) => s.id !== songId),
          },
        }));

        try {
          const res = await fetch(`/api/library/setlists/${setlistId}/songs?songId=${songId}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error();
          return true;
        } catch (error) {
          // Rollback
          set((state) => ({
            setlistSongs: {
              ...state.setlistSongs,
              [setlistId]: originalSongs,
            },
          }));
          return false;
        }
      },
    }),
    {
      name: 'setlist-hierarchy-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        folders: state.folders,
        setlists: state.setlists,
        setlistSongs: state.setlistSongs,
        setlistSongsLoaded: state.setlistSongsLoaded,
        isLoaded: true,
      }),
    }
  )
);
