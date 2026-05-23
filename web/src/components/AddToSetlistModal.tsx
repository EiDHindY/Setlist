import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Search from 'lucide-react/dist/esm/icons/search';
import X from 'lucide-react/dist/esm/icons/x';
import ListMusic from 'lucide-react/dist/esm/icons/list-music';
import Check from 'lucide-react/dist/esm/icons/check';

import { useSetlistStore } from '@/store/setlistStore';
import type { Song } from '@/types/song';
import type { Setlist, Folder as FolderType } from '@/types/setlist';

interface AddToSetlistModalProps {
  song: Song;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function AddToSetlistModal({ song, onClose, onSuccess }: AddToSetlistModalProps) {
  const { setlists, folders, setlistSongs, setlistSongsLoaded, fetchSetlistSongs, addSongToSetlist } = useSetlistStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to build full path for a setlist
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return 'Root';
    const crumbs: string[] = [];
    let curr: string | null = folderId;
    while (curr) {
      const f = folders.find(f => f.id === curr);
      if (f) {
        crumbs.unshift(f.name);
        curr = f.parentFolderId;
      } else {
        break;
      }
    }
    return crumbs.length > 0 ? crumbs.join(' > ') : 'Root';
  };

  const setlistsWithPaths = useMemo(() => {
    return setlists.map(s => ({
      ...s,
      path: getFolderPath(s.folderId)
    }));
  }, [setlists, folders]);

  const filteredSetlists = useMemo(() => {
    if (!searchQuery.trim()) return setlistsWithPaths;
    const query = searchQuery.toLowerCase();
    return setlistsWithPaths.filter(s => 
      s.name.toLowerCase().includes(query) || s.path.toLowerCase().includes(query)
    );
  }, [setlistsWithPaths, searchQuery]);

  const handleSelectSetlist = async (setlist: Setlist & { path: string }) => {
    // We should fetch the setlist songs first to verify if it exists if it's not loaded yet
    if (!setlistSongsLoaded[setlist.id]) {
      await fetchSetlistSongs(setlist.id);
    }
    
    // Check if song exists in setlist
    const existingSongs = useSetlistStore.getState().setlistSongs[setlist.id] || [];
    if (existingSongs.some(s => s.id === song.id)) {
      onSuccess(`"${song.title}" is already in ${setlist.name}`);
      onClose();
      return;
    }

    const success = await addSongToSetlist(setlist.id, song);
    if (success) {
      onSuccess(`Added "${song.title}" to ${setlist.name}`);
    } else {
      onSuccess(`Failed to add to ${setlist.name}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-[var(--sol-base03)] sm:border border-white/10 sm:rounded-3xl rounded-t-3xl h-[70vh] sm:h-[65vh] flex flex-col shadow-2xl antialiased subpixel-antialiased overflow-hidden"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">
            Add to Setlist
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={20} className="text-[var(--sol-base01)]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sol-base01)] opacity-50" />
            <input
              autoFocus
              type="text"
              placeholder="Search setlists..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--sol-base3)] placeholder-[var(--sol-base01)]/50 focus:outline-none focus:border-[var(--sol-cyan)]/50 transition-colors font-[family-name:var(--font-montserrat)]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2">
          {filteredSetlists.length === 0 ? (
            <div className="text-center py-10 opacity-50 font-[family-name:var(--font-montserrat)] text-sm">
              No setlists found.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredSetlists.map(setlist => (
                <button
                  key={setlist.id}
                  onClick={() => handleSelectSetlist(setlist)}
                  className="flex items-center w-full text-left p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--sol-base01)]/10 flex items-center justify-center mr-3">
                    <ListMusic size={16} className="text-[var(--sol-base01)] group-hover:text-[var(--sol-cyan)] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)] truncate">
                      {setlist.name}
                    </p>
                    <p className="text-xs text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] truncate opacity-70 mt-0.5">
                      in {setlist.path}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
