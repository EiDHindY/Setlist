'use client';

// ── LIBRARY COMPONENT ───────────────────────────────────────────────
// Port of mobile/lib/screens/library_screen.dart
// Shows the user's song collection with pull-to-refresh equivalent

// Shows the user's song collection with pull-to-refresh equivalent

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Music, Trash2, MoreVertical, ChevronRight, Loader2, RefreshCw, Mic2, Disc3, BarChart3, Layers } from 'lucide-react';
import type { Song } from '@/types/song';
import { supabase } from '@/utils/supabase';
import { fetchLibrarySongs, removeSongFromLibrary } from '@/services/library';
import { collectionSubTabs } from '@/components/navigation/nav-config';
import { useHardwareBack } from '@/hooks/useHardwareBack';

interface LibraryProps {
  onOpenSearch: () => void;
  onSelectSong: (song: Song) => void;
  activeSubTab: string;
  onSubTabChange: (subId: string) => void;
  userId: string;
}

export default function Library({ onOpenSearch, onSelectSong, activeSubTab, onSubTabChange, userId }: LibraryProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocalSearch, setShowLocalSearch] = useState(false);
  const lastScrollY = React.useRef(0);

  useHardwareBack(showLocalSearch, () => setShowLocalSearch(false), 'library_local_search');
  useHardwareBack(!!menuOpenId, () => setMenuOpenId(null), 'library_item_menu');

  // ── Derived stats for sidebar ─────────────────────────────────────
  const stats = useMemo(() => {
    const totalVersions = songs.reduce((acc, s) => acc + s.versions.length, 0);
    const artists = [...new Set(songs.map((s) => s.artist).filter(Boolean))];
    return { totalSongs: songs.length, totalVersions, uniqueArtists: artists.length, topArtists: artists.slice(0, 6) };
  }, [songs]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(s => 
      s.title.toLowerCase().includes(q) || 
      (s.artist && s.artist.toLowerCase().includes(q))
    );
  }, [songs, searchQuery]);

  const loadSongs = useCallback(async (showRefresh = false) => {
    if (!userId) return;

    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    const result = await fetchLibrarySongs(userId);
    setSongs(result);
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const handleDelete = async (songId: string) => {
    if (!userId) return;

    setDeletingSongId(songId);
    const success = await removeSongFromLibrary(userId, songId);
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
      <div className="flex items-center justify-between px-6 py-4 md:pt-10 flex-shrink-0 h-16 md:h-22">
        <div className="flex-1 mr-4 flex items-center h-full">
          <AnimatePresence>
            {showLocalSearch && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1, maxWidth: "300px" }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Filter collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--sol-base02)]/50 border border-[var(--sol-base01)]/20 rounded-full px-4 py-1.5 text-sm text-[var(--sol-base3)] placeholder-[var(--sol-base01)] focus:outline-none focus:border-[var(--sol-cyan)]/50 transition-colors font-[family-name:var(--font-montserrat)] outline-none"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
          {!showLocalSearch && <div className="w-10" />} {/* Spacer for logo alignment */}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSongs(true)}
            className={`p-2 rounded-full hover:bg-white/10 transition-smooth cursor-pointer ${refreshing ? 'animate-spin' : ''}`}
            disabled={refreshing}
          >
            <RefreshCw size={18} className="text-[var(--sol-base01)]" />
          </button>
          <button
            onClick={() => {
              setShowLocalSearch(!showLocalSearch);
              if (showLocalSearch) setSearchQuery('');
            }}
            className={`p-2 rounded-full hover:bg-white/10 transition-smooth cursor-pointer ${showLocalSearch ? 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)]' : 'text-[var(--sol-base01)]'}`}
          >
            <Search size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSearch();
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-smooth cursor-pointer"
          >
            <Plus size={18} className="text-[var(--sol-cyan)]" />
          </button>
        </div>
      </div>

      {/* ── Sub-tab Filter Strip (desktop only) ──────────────────── */}
      <div className="hidden md:flex items-center gap-2 px-6 pb-4 flex-shrink-0">
        {collectionSubTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)}
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`relative flex items-center gap-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-colors font-[family-name:var(--font-montserrat)] ${
                isActive
                  ? 'bg-[var(--sol-cyan)]/15 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30 shadow-[0_0_12px_rgba(42,161,152,0.2)] px-4 py-2'
                  : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] hover:bg-white/5 border border-transparent px-3 py-2'
              }`}
            >
              <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!isActive && (
                <span className="whitespace-nowrap">{tab.label}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Song List + Sidebar ──────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={40} className="text-[var(--sol-cyan)] animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 px-6 pb-6">

          {/* Song List */}
          <div 
            className="flex-1 overflow-y-auto pr-2 max-md:no-scrollbar"
            onScroll={(e) => {
              const currentY = e.currentTarget.scrollTop;
              if (currentY > lastScrollY.current && currentY > 50) {
                window.dispatchEvent(new CustomEvent('scroll-direction', { detail: 'down' }));
              } else if (currentY < lastScrollY.current) {
                window.dispatchEvent(new CustomEvent('scroll-direction', { detail: 'up' }));
              }
              lastScrollY.current = currentY;
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className="mb-3"
                >
                  <div
                    className="flex items-center gap-4 pl-4 pr-2 py-3 rounded-2xl bg-[var(--sol-base02)]/30 border border-[var(--sol-base01)]/5 hover:bg-[var(--sol-base02)]/60 hover:border-[var(--sol-base01)]/20 transition-all cursor-pointer group relative"
                    onClick={() => onSelectSong(song)}
                  >
                    {/* Album Art */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                      {song.albumArt ? (
                        <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--sol-base01)]/10 flex items-center justify-center">
                          <Music size={18} className="text-[var(--sol-base01)]" />
                        </div>
                      )}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--sol-base3)] text-sm font-bold truncate font-[family-name:var(--font-outfit)] tracking-wide">
                        {song.title}
                      </p>
                      <p className="text-[var(--sol-base01)] text-xs truncate font-[family-name:var(--font-montserrat)] opacity-80 mt-0.5">
                        {song.artist}
                      </p>
                    </div>

                    {/* Version count */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-tighter font-[family-name:var(--font-montserrat)] ${
                          song.versions.length > 0
                            ? 'bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)]'
                            : 'bg-[var(--sol-base01)]/5 text-[var(--sol-base01)]'
                        }`}
                      >
                        {song.versions.length} V
                      </span>
                    </div>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === song.id ? null : song.id);
                        }}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors md:opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <MoreVertical size={16} className="text-[var(--sol-base01)]" />
                      </button>

                      <AnimatePresence>
                        {menuOpenId === song.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -4 }}
                            className="absolute right-0 top-full mt-2 z-50 bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 rounded-2xl shadow-2xl overflow-hidden min-w-[160px] backdrop-blur-xl"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(song.id);
                              }}
                              disabled={deletingSongId === song.id}
                              className="flex items-center gap-3 w-full px-5 py-4 text-[var(--sol-red)] hover:bg-[var(--sol-red)]/10 transition-colors text-xs font-bold font-[family-name:var(--font-montserrat)] cursor-pointer"
                            >
                              {deletingSongId === song.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                              REMOVE TRACK
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Arrow (Desktop only) */}
                    <ChevronRight size={14} className="hidden md:block text-[var(--sol-base01)]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Right Sidebar (desktop only) ─────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-6 w-72 flex-shrink-0 overflow-y-auto pr-2 no-scrollbar">

            {/* Stats card */}
            <div className="glass rounded-[32px] p-6 border border-white/5 shadow-xl">
              <div className="flex items-center gap-2 mb-6 opacity-60">
                <BarChart3 size={14} className="text-[var(--sol-cyan)]" />
                <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-[0.3em] uppercase font-[family-name:var(--font-montserrat)]">Collection Stats</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Music,    label: 'Songs',    value: stats.totalSongs },
                  { icon: Layers,   label: 'Versions', value: stats.totalVersions },
                  { icon: Mic2,     label: 'Artists',  value: stats.uniqueArtists },
                  { icon: Disc3,    label: 'Albums',   value: '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-[var(--sol-base03)]/40 rounded-2xl p-4 flex flex-col gap-1 border border-white/5 transition-all hover:bg-[var(--sol-base03)]/60">
                    <Icon size={14} className="text-[var(--sol-cyan)]/70 mb-1" />
                    <p className="text-[var(--sol-base3)] text-xl font-bold font-[family-name:var(--font-outfit)] leading-none">{value}</p>
                    <p className="text-[var(--sol-base01)] text-[10px] font-bold font-[family-name:var(--font-montserrat)] opacity-50 uppercase tracking-tighter">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Artists card */}
            {stats.topArtists.length > 0 && (
              <div className="glass rounded-[32px] p-6 border border-white/5 shadow-xl">
                <div className="flex items-center gap-2 mb-6 opacity-60">
                  <Mic2 size={14} className="text-[var(--sol-cyan)]" />
                  <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-[0.3em] uppercase font-[family-name:var(--font-montserrat)]">Top Artists</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  {stats.topArtists.map((artist, i) => (
                    <div key={artist} className="group flex items-center gap-4 p-2 rounded-2xl hover:bg-white/5 transition-all">
                      <span className="text-[var(--sol-base01)] text-[10px] w-4 text-right font-bold opacity-30 font-[family-name:var(--font-montserrat)]">{i + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-[var(--sol-cyan)]/5 border border-[var(--sol-cyan)]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--sol-cyan)]/10 transition-colors">
                        <Mic2 size={14} className="text-[var(--sol-cyan)]/60" />
                      </div>
                      <p className="text-[var(--sol-base2)] text-xs font-bold truncate font-[family-name:var(--font-montserrat)]">{artist}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions / Tips */}
            <div className="mt-auto bg-gradient-to-br from-[var(--sol-cyan)]/10 to-transparent rounded-[32px] p-6 border border-[var(--sol-cyan)]/10">
              <p className="text-[var(--sol-cyan)] text-xs font-bold mb-2 font-[family-name:var(--font-outfit)] tracking-tight">Pro Tip</p>
              <p className="text-[var(--sol-base01)] text-[11px] leading-relaxed font-[family-name:var(--font-montserrat)]">
                Try swiping right on the mobile bar to quickly switch between your collection tabs.
              </p>
            </div>

          </aside>
        </div>
      )}
    </div>
  );
}
