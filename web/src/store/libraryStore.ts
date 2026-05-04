import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Song } from '@/types/song';
import { fetchLibrarySongs as fetchFromApi, removeSongFromLibrary as removeFromApi } from '@/services/library';

interface LibraryState {
  songs: Song[];
  isLoaded: boolean;        // True if we have loaded at least once from local storage
  isSyncing: boolean;       // True if currently fetching from API
  lastSynced: number | null; // Timestamp of last API sync
  
  // Actions
  fetchLibrary: (userId: string, force?: boolean) => Promise<void>;
  removeSong: (userId: string, songId: string) => Promise<boolean>;
  addSongOptimistic: (song: Song) => void;
  updateSongOptimistic: (song: Song) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      songs: [],
      isLoaded: false,
      isSyncing: false,
      lastSynced: null,

      fetchLibrary: async (userId: string, force = false) => {
        const { isSyncing, lastSynced } = get();
        
        // Don't sync if already syncing
        if (isSyncing) return;
        
        // Don't auto-sync if we synced less than 5 minutes ago (unless forced)
        const fiveMinutes = 5 * 60 * 1000;
        const now = Date.now();
        if (!force && lastSynced && (now - lastSynced < fiveMinutes)) {
          return;
        }

        set({ isSyncing: true, isLoaded: true });

        try {
          const freshSongs = await fetchFromApi(userId);
          
          // Only update if the API request succeeds and returns data
          // (We don't want an API error to wipe out the local cache)
          set({ 
            songs: freshSongs, 
            lastSynced: Date.now(),
            isSyncing: false 
          });
        } catch (error) {
          console.error('Failed to sync library:', error);
          set({ isSyncing: false });
        }
      },

      removeSong: async (userId: string, songId: string) => {
        // Optimistic UI update: instantly remove from UI
        const previousSongs = get().songs;
        set({ songs: previousSongs.filter(s => s.id !== songId) });

        // Background API call
        const success = await removeFromApi(userId, songId);
        
        // Rollback if failed
        if (!success) {
          set({ songs: previousSongs });
        }
        
        return success;
      },

      addSongOptimistic: (song: Song) => {
        set((state) => {
          // Check if it already exists to avoid duplicates
          if (state.songs.some(s => s.id === song.id)) return state;
          // Add to beginning of the array
          return { songs: [song, ...state.songs] };
        });
      },

      updateSongOptimistic: (updatedSong: Song) => {
        set((state) => ({
          songs: state.songs.map(s => s.id === updatedSong.id ? updatedSong : s)
        }));
      }
    }),
    {
      name: 'setlist-library-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ 
        songs: state.songs, 
        lastSynced: state.lastSynced,
        // We persist isLoaded as true so when they reload the page, the UI instantly shows the cached songs
        isLoaded: true 
      }),
    }
  )
);
