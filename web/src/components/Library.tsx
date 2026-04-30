'use client';

// ── LIBRARY COMPONENT ───────────────────────────────────────────────
// Port of mobile/lib/screens/library_screen.dart
// Shows the user's song collection with pull-to-refresh equivalent

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Music, Trash2, MoreVertical, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import type { Song } from '@/types/song';
import { supabase } from '@/utils/supabase';
import { fetchLibrarySongs, removeSongFromLibrary } from '@/services/library';

interface LibraryProps {
  onOpenSearch: () => void;
  onSelectSong: (song: Song) => void;
}

export default function Library({ onOpenSearch, onSelectSong }: LibraryProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const loadSongs = useCallback(async (showRefresh = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const result = await fetchLibrarySongs(user.id);
    setSongs(result);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const handleDelete = async (songId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setDeletingSongId(songId);
    const success = await removeSongFromLibrary(user.id, songId);
    if (success) {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    }
    setDeletingSongId(null);
    setMenuOpenId(null);
  };

  // ── Empty State ───────────────────────────────────────────────────
  if (!loading && songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-10">
        <div className="w-28 h-28 rounded-full flex items-center justify-center border border-[var(--sol-base01)]/20 bg-[var(--sol-base02)]/50 mb-8">
          <Music size={56} className="text-[var(--sol-base01)]/60" strokeWidth={1.5} />
        </div>
        <h2 className="text-[var(--sol-base3)] text-2xl font-bold mb-3 font-[family-name:var(--font-outfit)]">
          Your Collections are Silent
        </h2>
        <p className="text-[var(--sol-base01)] text-center text-sm leading-relaxed mb-10 max-w-xs font-[family-name:var(--font-montserrat)]">
          Ready to start your next session?<br />
          Add some tracks to get the rhythm going.
        </p>
        <button
          onClick={onOpenSearch}
          className="px-8 py-3.5 rounded-full border border-[var(--sol-cyan)] bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)] font-bold tracking-widest text-sm transition-bounce hover:scale-105 hover:bg-[var(--sol-cyan)]/20 active:scale-95 cursor-pointer font-[family-name:var(--font-montserrat)]"
        >
          FIND SONGS
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="w-10" /> {/* Spacer for logo alignment */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSongs(true)}
            className={`p-2 rounded-full hover:bg-white/10 transition-smooth cursor-pointer ${refreshing ? 'animate-spin' : ''}`}
            disabled={refreshing}
          >
            <RefreshCw size={18} className="text-[var(--sol-base01)]" />
          </button>
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-full hover:bg-white/10 transition-smooth cursor-pointer"
          >
            <Search size={18} className="text-[var(--sol-base01)]" />
          </button>
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-full hover:bg-white/10 transition-smooth cursor-pointer"
          >
            <Plus size={18} className="text-[var(--sol-cyan)]" />
          </button>
        </div>
      </div>

      {/* ── Song List ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={40} className="text-[var(--sol-cyan)] animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <AnimatePresence mode="popLayout">
            {songs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="mb-2"
              >
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/5 hover:bg-[var(--sol-base02)]/70 transition-smooth cursor-pointer group relative"
                  onClick={() => onSelectSong(song)}
                >
                  {/* Album Art */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                    {song.albumArt ? (
                      <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[var(--sol-base01)]/10 flex items-center justify-center">
                        <Music size={16} className="text-[var(--sol-base01)]" />
                      </div>
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--sol-base3)] text-sm font-semibold truncate font-[family-name:var(--font-montserrat)]">
                      {song.title}
                    </p>
                    <p className="text-[var(--sol-base01)] text-xs truncate font-[family-name:var(--font-montserrat)]">
                      {song.artist}
                    </p>
                  </div>

                  {/* Version count */}
                  <span
                    className={`text-xs mr-1 font-[family-name:var(--font-montserrat)] ${
                      song.versions.length > 0
                        ? 'text-[var(--sol-cyan)]/70 font-semibold'
                        : 'text-[var(--sol-base01)]'
                    }`}
                  >
                    {song.versions.length} Version{song.versions.length !== 1 ? 's' : ''}
                  </span>

                  {/* Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === song.id ? null : song.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <MoreVertical size={16} className="text-[var(--sol-base01)]" />
                    </button>

                    <AnimatePresence>
                      {menuOpenId === song.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          className="absolute right-0 top-full mt-1 z-50 bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(song.id);
                            }}
                            disabled={deletingSongId === song.id}
                            className="flex items-center gap-3 w-full px-4 py-3 text-[var(--sol-red)] hover:bg-[var(--sol-red)]/10 transition-colors text-sm font-[family-name:var(--font-montserrat)] cursor-pointer"
                          >
                            {deletingSongId === song.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                            Remove
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={14} className="text-[var(--sol-base01)]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
