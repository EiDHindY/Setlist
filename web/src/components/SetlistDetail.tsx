import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Music from 'lucide-react/dist/esm/icons/music';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

import { useSetlistStore } from '@/store/setlistStore';
import { useLibraryStore } from '@/store/libraryStore';
import type { Song } from '@/types/song';
import type { Folder as FolderType, Setlist } from '@/types/setlist';

interface SetlistDetailProps {
  setlistId: string;
  onBack: () => void;
  onNavigateToFolder: (folderId: string | null) => void;
}

export default function SetlistDetail({ setlistId, onBack, onNavigateToFolder }: SetlistDetailProps) {
  const { setlists, folders, setlistSongs, setlistSongsLoaded, fetchSetlistSongs, removeSongFromSetlist, addSongToSetlist } = useSetlistStore();
  const { songs: allSongs, fetchLibrary } = useLibraryStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  
  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const setlist = useMemo(() => setlists.find(s => s.id === setlistId), [setlists, setlistId]);
  
  // Breadcrumbs for the setlist
  const breadcrumbs = useMemo(() => {
    const crumbs: FolderType[] = [];
    if (!setlist) return crumbs;
    let curr = setlist.folderId;
    while (curr) {
      const f = folders.find(f => f.id === curr);
      if (f) {
        crumbs.unshift(f);
        curr = f.parentFolderId;
      } else {
        break;
      }
    }
    return crumbs;
  }, [folders, setlist]);

  // Load setlist songs
  useEffect(() => {
    if (setlistId && !setlistSongsLoaded[setlistId]) {
      fetchSetlistSongs(setlistId);
    }
  }, [setlistId, setlistSongsLoaded, fetchSetlistSongs]);

  const currentSongs = setlistSongs[setlistId] || [];
  const currentSongIds = useMemo(() => new Set(currentSongs.map(s => s.id)), [currentSongs]);

  const handleRemove = async (songId: string) => {
    await removeSongFromSetlist(setlistId, songId);
  };

  const handleToggleSong = async (song: Song) => {
    if (currentSongIds.has(song.id)) {
      const success = await removeSongFromSetlist(setlistId, song.id);
      if (success) showToast(`Removed ${song.title}`);
    } else {
      const success = await addSongToSetlist(setlistId, song);
      if (success) showToast(`Added ${song.title}`);
    }
  };

  // Add Modal filtering
  const filteredLibrary = useMemo(() => {
    if (!searchQuery.trim()) return allSongs;
    const query = searchQuery.toLowerCase();
    return allSongs.filter(s => 
      s.title.toLowerCase().includes(query) || 
      (s.artist && s.artist.toLowerCase().includes(query))
    );
  }, [allSongs, searchQuery]);

  const visibleLibrary = filteredLibrary.slice(0, visibleCount);

  if (!setlist) return null;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-2 mb-4 px-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={20} className="text-[var(--sol-base01)]" />
          </button>
          <h2 className="text-xl font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)] truncate">
            {setlist.name}
          </h2>
          <div className="flex-1" />
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--sol-cyan)] text-[var(--sol-base03)] hover:opacity-90 transition-opacity font-[family-name:var(--font-montserrat)] cursor-pointer"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Songs</span>
          </button>
        </div>

        {/* Scrollable Breadcrumbs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 text-xs font-[family-name:var(--font-outfit)] text-[var(--sol-base01)] whitespace-nowrap opacity-80">
          <button 
            onClick={() => onNavigateToFolder(null)}
            className="hover:text-[var(--sol-cyan)] transition-colors"
          >
            Library
          </button>
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={12} className="text-[var(--sol-base01)]/50" />
              <button 
                onClick={() => onNavigateToFolder(crumb.id)}
                className="hover:text-[var(--sol-cyan)] transition-colors"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
          <ChevronRight size={12} className="text-[var(--sol-base01)]/50" />
          <span className="text-[var(--sol-cyan)] truncate max-w-[150px]">{setlist.name}</span>
        </div>
      </div>

      {/* Setlist Songs Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 pr-2">
        {currentSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 pb-10 opacity-70">
            <Music size={48} className="text-[var(--sol-cyan)] mb-4" />
            <h3 className="text-xl font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">This setlist is empty</h3>
            <p className="text-sm text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] mt-2">Add some tracks to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {currentSongs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center p-3 bg-[var(--sol-base02)]/30 border border-white/5 rounded-2xl group hover:bg-white/5 transition-colors"
                >
                  {song.albumArt ? (
                    <img src={song.albumArt} alt="Art" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[var(--sol-base01)]/10 flex items-center justify-center">
                      <Music size={16} className="text-[var(--sol-base01)] opacity-50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 ml-3">
                    <p className="text-sm font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)] truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] truncate opacity-80 mt-0.5">
                      {song.artist || 'Unknown Artist'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRemove(song.id)}
                    className="p-2 rounded-full hover:bg-[var(--sol-red)]/10 transition-colors md:opacity-0 group-hover:opacity-100"
                    title="Remove from setlist"
                  >
                    <Trash2 size={16} className="text-[var(--sol-red)]" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Songs Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setSearchQuery('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[var(--sol-base03)] sm:border border-white/10 sm:rounded-3xl rounded-t-3xl h-[85vh] sm:h-[80vh] flex flex-col shadow-2xl antialiased subpixel-antialiased overflow-hidden"
              style={{ transform: "translateZ(0)", willChange: "transform" }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h2 className="text-lg font-bold text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">
                  Add Songs
                </h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 transition-colors"
                >
                  <X size={20} className="text-[var(--sol-base01)]" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sol-base01)] opacity-50" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search by title or artist..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--sol-base3)] placeholder-[var(--sol-base01)]/50 focus:outline-none focus:border-[var(--sol-cyan)]/50 transition-colors font-[family-name:var(--font-montserrat)]"
                  />
                </div>
              </div>

              {/* Songs List */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                {visibleLibrary.length === 0 ? (
                  <div className="text-center py-10 opacity-50 font-[family-name:var(--font-montserrat)] text-sm">
                    No songs found.
                  </div>
                ) : (
                  visibleLibrary.map((song) => {
                    const isInSetlist = currentSongIds.has(song.id);
                    return (
                      <div 
                        key={song.id}
                        onClick={() => handleToggleSong(song)}
                        className="flex items-center p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group"
                      >
                        {song.albumArt ? (
                          <img src={song.albumArt} alt="Art" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[var(--sol-base01)]/10 flex items-center justify-center">
                            <Music size={16} className="text-[var(--sol-base01)] opacity-50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 ml-3 mr-3">
                          <p className={`text-sm font-bold font-[family-name:var(--font-outfit)] truncate transition-colors ${isInSetlist ? 'text-[var(--sol-cyan)]' : 'text-[var(--sol-base3)]'}`}>
                            {song.title}
                          </p>
                          <p className="text-xs text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] truncate opacity-80 mt-0.5">
                            {song.artist || 'Unknown Artist'}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isInSetlist ? 'bg-[var(--sol-cyan)] border-[var(--sol-cyan)]' : 'border-[var(--sol-base01)]/30 group-hover:border-[var(--sol-cyan)]/50'}`}>
                          {isInSetlist && <Check size={14} className="text-[var(--sol-base03)]" />}
                        </div>
                      </div>
                    );
                  })
                )}

                {filteredLibrary.length > visibleCount && (
                  <div className="p-4 flex justify-center">
                    <button 
                      onClick={() => setVisibleCount(v => v + 50)}
                      className="px-6 py-2 rounded-full text-xs font-bold text-[var(--sol-base01)] border border-[var(--sol-base01)]/30 hover:bg-white/5 hover:text-[var(--sol-base3)] transition-colors font-[family-name:var(--font-montserrat)]"
                    >
                      Show More
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-[var(--sol-cyan)] text-[var(--sol-base03)] px-5 py-3 rounded-full shadow-2xl font-bold text-sm font-[family-name:var(--font-montserrat)] flex items-center gap-2 whitespace-nowrap"
          >
            <Check size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
