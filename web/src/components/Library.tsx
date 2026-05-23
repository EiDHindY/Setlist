'use client';

// ── LIBRARY COMPONENT ───────────────────────────────────────────────
// Port of mobile/lib/screens/library_screen.dart
// Shows the user's song collection with pull-to-refresh equivalent

// Shows the user's song collection with pull-to-refresh equivalent

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Music from 'lucide-react/dist/esm/icons/music';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';
import Mic2 from 'lucide-react/dist/esm/icons/mic-2';
import Disc3 from 'lucide-react/dist/esm/icons/disc-3';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Sliders from 'lucide-react/dist/esm/icons/sliders';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import type { Song } from '@/types/song';
import { supabase } from '@/utils/supabase';
import { useLibraryStore } from '@/store/libraryStore';
import { collectionSubTabs } from '@/components/navigation/nav-config';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import SetlistsTab from '@/components/SetlistsTab';
import AddToSetlistModal from '@/components/AddToSetlistModal';
import Check from 'lucide-react/dist/esm/icons/check';
import ListMusic from 'lucide-react/dist/esm/icons/list-music';

// ── PERSON AVATAR COMPONENT ─────────────────────────────────────────
// Fetches real face/profile pictures from Discogs API dynamically.
const PersonAvatar = ({ name, fallbackImage, type }: { name: string, fallbackImage?: string, type: 'artist' | 'producer' | 'mixer' }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchImage = async () => {
      try {
        const res = await fetch(`/api/artist-image?name=${encodeURIComponent(name)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.imageUrl) {
            setImageUrl(data.imageUrl);
          }
        }
      } catch (err) {
        console.error('Failed to fetch avatar for', name, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchImage();
    return () => { isMounted = false; };
  }, [name]);

  const displayUrl = imageUrl || fallbackImage;

  if (loading && !fallbackImage) {
    return (
      <div className="w-full h-full bg-white/5 flex items-center justify-center animate-pulse">
        {type === 'artist' && <Mic2 size={24} className="opacity-30" />}
        {type === 'producer' && <Sliders size={24} className="opacity-30" />}
        {type === 'mixer' && <Headphones size={24} className="opacity-30" />}
      </div>
    );
  }

  if (displayUrl) {
    return <img src={displayUrl} alt={name} className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`} />;
  }

  return (
    <div className={`w-full h-full flex items-center justify-center ${type === 'artist' ? 'bg-white/5' : type === 'producer' ? 'bg-[var(--sol-cyan)]/10' : 'bg-[var(--sol-base01)]/10'}`}>
      {type === 'artist' && <Mic2 size={24} className="opacity-50" />}
      {type === 'producer' && <Sliders size={24} className="text-[var(--sol-cyan)] opacity-70" />}
      {type === 'mixer' && <Headphones size={24} className="text-[var(--sol-base01)] opacity-70" />}
    </div>
  );
};


interface LibraryProps {
  onOpenSearch: () => void;
  onSelectSong: (song: Song, initialTab?: number) => void;
  activeSubTab: string;
  onSubTabChange: (subId: string) => void;
  userId: string;
}

export default function Library({ onOpenSearch, onSelectSong, activeSubTab, onSubTabChange, userId }: LibraryProps) {
  const { songs, isLoaded, isSyncing, fetchLibrary, removeSong } = useLibraryStore();
  
  // No longer tracking local loading state for initial render if cached
  const [refreshing, setRefreshing] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocalSearch, setShowLocalSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'added' | 'plays' | 'recent'>('added');
  const lastScrollY = React.useRef(0);

  useHardwareBack(showLocalSearch, () => setShowLocalSearch(false), 'library_local_search');
  useHardwareBack(!!menuOpenId, () => setMenuOpenId(null), 'library_item_menu');

  // ── Derived stats for sidebar ─────────────────────────────────────
  const stats = useMemo(() => {
    const totalVersions = songs.reduce((acc, s) => acc + s.versions.length, 0);
    const totalPlays = songs.reduce((acc, s) => acc + (s.playCount ?? 0), 0);
    const artists = [...new Set(songs.map((s) => s.artist).filter(Boolean))];
    return { totalSongs: songs.length, totalVersions, totalPlays, uniqueArtists: artists.length, topArtists: artists.slice(0, 6) };
  }, [songs]);

  const filteredSongs = useMemo(() => {
    let result = songs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = songs.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.artist && s.artist.toLowerCase().includes(q))
      );
    }

    // Sort the result
    return [...result].sort((a, b) => {
      if (sortBy === 'plays') {
        return (b.playCount ?? 0) - (a.playCount ?? 0);
      } else if (sortBy === 'recent') {
        const dateA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
        const dateB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
        if (dateA === 0 && dateB === 0) return 0;
        return dateB - dateA;
      } else {
        // Default: Added date
        const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return dateB - dateA;
      }
    });
  }, [songs, searchQuery, sortBy]);

  // Setlist modal
  const [addingSongToSetlist, setAddingSongToSetlist] = useState<Song | null>(null);
  
  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Derived lists for other tabs
  const artistsList = useMemo(() => {
    const map = new Map<string, { artist: string, songCount: number, albumArt: string }>();
    filteredSongs.forEach(s => {
      if (s.artist) {
        if (!map.has(s.artist)) {
          map.set(s.artist, { artist: s.artist, songCount: 1, albumArt: s.albumArt });
        } else {
          map.get(s.artist)!.songCount++;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.songCount - a.songCount);
  }, [filteredSongs]);

  const albumsList = useMemo(() => {
    const map = new Map<string, { album: string, artist: string, songCount: number, albumArt: string }>();
    filteredSongs.forEach(s => {
      const albumName = s.album || 'Unknown Album';
      const key = `${albumName}-${s.artist}`;
      if (!map.has(key)) {
        map.set(key, { album: albumName, artist: s.artist, songCount: 1, albumArt: s.albumArt });
      } else {
        map.get(key)!.songCount++;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.songCount - a.songCount);
  }, [filteredSongs]);

  const producersList = useMemo(() => {
    const map = new Map<string, { name: string, songCount: number, albumArt?: string }>();
    filteredSongs.forEach(s => {
      if (s.credits?.production) {
        s.credits.production.forEach(p => {
          if (!map.has(p.name)) {
            map.set(p.name, { name: p.name, songCount: 1, albumArt: s.albumArt });
          } else {
            map.get(p.name)!.songCount++;
          }
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.songCount - a.songCount);
  }, [filteredSongs]);

  const mixersList = useMemo(() => {
    const map = new Map<string, { name: string, songCount: number, albumArt?: string }>();
    filteredSongs.forEach(s => {
      // Assuming mixers might be in additional or production with role 'mixer'
      const allCredits = [
        ...(s.credits?.production || []),
        ...(s.credits?.additional || [])
      ];
      allCredits.forEach(c => {
        if (c.role.toLowerCase().includes('mix')) {
          if (!map.has(c.name)) {
            map.set(c.name, { name: c.name, songCount: 1, albumArt: s.albumArt });
          } else {
            map.get(c.name)!.songCount++;
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.songCount - a.songCount);
  }, [filteredSongs]);

  const loadSongs = useCallback(async (showRefresh = false) => {
    if (!userId) return;

    if (showRefresh) setRefreshing(true);

    // If showRefresh is true, we force a sync
    await fetchLibrary(userId, showRefresh);
    
    if (showRefresh) setRefreshing(false);
  }, [userId, fetchLibrary]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const handleDelete = async (songId: string) => {
    if (!userId) return;

    setDeletingSongId(songId);
    await removeSong(userId, songId);
    setDeletingSongId(null);
    setMenuOpenId(null);
  };

  // ── Empty State ───────────────────────────────────────────────────
  if (isLoaded && songs.length === 0) {
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
    <div className="flex flex-col lg:flex-row h-full lg:px-6 lg:pb-6 lg:gap-6">
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* ── Header & Tabs Row ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 lg:px-0 py-4 md:pt-10 md:pb-6 flex-shrink-0 gap-4">
          
          {/* Sub-tab Filter Strip (desktop only) */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
            {collectionSubTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onSubTabChange(tab.id)}
                  layout
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`relative flex items-center gap-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-colors font-[family-name:var(--font-montserrat)] whitespace-nowrap flex-shrink-0 ${
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
                        className="overflow-hidden"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isActive && (
                    <span>{tab.label}</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right side: Search/Sort and Actions */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
            <div className="flex-1 md:flex-none flex items-center justify-start md:justify-end gap-2">
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
            {!showLocalSearch && (
              <button
                onClick={() => {
                  const options: ('added' | 'plays' | 'recent')[] = ['added', 'plays', 'recent'];
                  const next = options[(options.indexOf(sortBy) + 1) % options.length];
                  setSortBy(next);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sol-base02)]/50 border border-[var(--sol-base01)]/20 text-[10px] font-bold text-[var(--sol-base1)] hover:bg-[var(--sol-base02)] transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowUpDown size={12} className="text-[var(--sol-cyan)]" />
                {sortBy === 'added' ? 'NEWEST' : sortBy === 'plays' ? 'MOST PLAYS' : 'RECENT PLAYS'}
              </button>
            )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
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
        </div>

        {/* ── Missing Credits Banner (Producers / Mixers tabs) ────── */}
        <AnimatePresence>
          {(activeSubTab === 'producers' || activeSubTab === 'mixers') && (() => {
            const missingSongs = filteredSongs.filter(s => !s.credits);
            if (missingSongs.length === 0) return null;
            return (
              <motion.div
                key="missing-credits-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 lg:px-0 pb-2"
              >
                <div className="bg-[var(--sol-yellow)]/8 border border-[var(--sol-yellow)]/20 rounded-xl px-4 py-3">
                  <p className="text-[var(--sol-yellow)] text-[11px] font-bold tracking-wide font-[family-name:var(--font-outfit)] uppercase mb-2">
                    ⚡ {missingSongs.length} {missingSongs.length === 1 ? 'song needs' : 'songs need'} credits loaded
                  </p>
                  <p className="text-[var(--sol-base01)] text-[10px] font-[family-name:var(--font-montserrat)] mb-2 leading-relaxed">
                    Open each song below and tap <span className="text-[var(--sol-cyan)] font-bold">CREDITS</span> to index their producers &amp; mixers:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingSongs.map(s => (
                      <button
                        key={s.id}
                        onClick={() => onSelectSong(s, 2)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--sol-base02)] border border-[var(--sol-yellow)]/20 hover:border-[var(--sol-yellow)]/50 hover:bg-[var(--sol-yellow)]/10 transition-all cursor-pointer"
                      >
                        {s.albumArt && <img src={s.albumArt} alt="" className="w-4 h-4 rounded object-cover" />}
                        <span className="text-[var(--sol-base3)] text-[11px] font-bold font-[family-name:var(--font-outfit)] truncate max-w-[120px]">{s.title}</span>
                        <ChevronRight size={10} className="text-[var(--sol-yellow)] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

      {/* ── Song List ──────────────────────────────────── */}
      {!isLoaded && isSyncing ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={40} className="text-[var(--sol-cyan)] animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 lg:px-0 lg:pb-0">

          {/* Main List Area */}
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
            {activeSubTab === 'songs' && (
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

                    {/* Stats */}
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
                                setAddingSongToSetlist(song);
                                setMenuOpenId(null);
                              }}
                              className="flex items-center gap-3 w-full px-5 py-4 text-[var(--sol-cyan)] hover:bg-[var(--sol-cyan)]/10 transition-colors text-xs font-bold font-[family-name:var(--font-montserrat)] cursor-pointer border-b border-white/5"
                            >
                              <ListMusic size={16} />
                              ADD TO SETLIST
                            </button>
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
            )}

            {activeSubTab === 'setlists' && (
              <SetlistsTab userId={userId} />
            )}

            {activeSubTab === 'artists' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {artistsList.length === 0 ? (
                  <p className="text-center col-span-full mt-10 text-[var(--sol-base01)] text-sm">No artists found.</p>
                ) : (
                  artistsList.map((artist, idx) => (
                    <motion.div key={artist.artist} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: idx * 0.05}} className="flex flex-col items-center p-4 bg-[var(--sol-base02)]/30 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mb-3">
                        <PersonAvatar name={artist.artist} fallbackImage={artist.albumArt} type="artist" />
                      </div>
                      <p className="text-sm font-bold text-[var(--sol-base3)] text-center w-full truncate font-[family-name:var(--font-outfit)]">{artist.artist}</p>
                      <p className="text-xs text-[var(--sol-base01)] mt-1 font-[family-name:var(--font-montserrat)]">{artist.songCount} {artist.songCount === 1 ? 'Song' : 'Songs'}</p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeSubTab === 'albums' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {albumsList.length === 0 ? (
                  <p className="text-center col-span-full mt-10 text-[var(--sol-base01)] text-sm">No albums found.</p>
                ) : (
                  albumsList.map((album, idx) => (
                    <motion.div key={`${album.album}-${album.artist}`} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: idx * 0.05}} className="flex flex-col p-4 bg-[var(--sol-base02)]/30 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="w-full aspect-square rounded-xl overflow-hidden shadow-lg mb-3">
                        {album.albumArt ? <img src={album.albumArt} alt={album.album} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Disc3 size={32} className="opacity-50" /></div>}
                      </div>
                      <p className="text-sm font-bold text-[var(--sol-base3)] w-full truncate font-[family-name:var(--font-outfit)]">{album.album}</p>
                      <p className="text-xs text-[var(--sol-cyan)] w-full truncate mt-0.5 font-[family-name:var(--font-montserrat)]">{album.artist}</p>
                      <p className="text-xs text-[var(--sol-base01)] mt-1 font-[family-name:var(--font-montserrat)] opacity-60">{album.songCount} {album.songCount === 1 ? 'Song' : 'Songs'}</p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeSubTab === 'producers' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {producersList.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center pt-10">
                    <p className="text-center text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">No producers indexed yet.</p>
                    <p className="text-center text-[var(--sol-cyan)]/70 text-xs mt-2 font-[family-name:var(--font-montserrat)]">Fetching will happen automatically when adding songs or viewing credits.</p>
                  </div>
                ) : (
                  producersList.map((producer, idx) => (
                    <motion.div key={producer.name} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: idx * 0.05}} className="flex flex-col items-center p-4 bg-[var(--sol-base02)]/30 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mb-3">
                        <PersonAvatar name={producer.name} fallbackImage={producer.albumArt} type="producer" />
                      </div>
                      <p className="text-sm font-bold text-[var(--sol-base3)] text-center w-full truncate font-[family-name:var(--font-outfit)]">{producer.name}</p>
                      <p className="text-xs text-[var(--sol-base01)] mt-1 font-[family-name:var(--font-montserrat)]">{producer.songCount} {producer.songCount === 1 ? 'Track' : 'Tracks'}</p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeSubTab === 'mixers' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mixersList.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center pt-10">
                    <p className="text-center text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">No mixers indexed yet.</p>
                    <p className="text-center text-[var(--sol-cyan)]/70 text-xs mt-2 font-[family-name:var(--font-montserrat)]">Fetching will happen automatically when adding songs or viewing credits.</p>
                  </div>
                ) : (
                  mixersList.map((mixer, idx) => (
                    <motion.div key={mixer.name} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: idx * 0.05}} className="flex flex-col items-center p-4 bg-[var(--sol-base02)]/30 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer">
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mb-3">
                        <PersonAvatar name={mixer.name} fallbackImage={mixer.albumArt} type="mixer" />
                      </div>
                      <p className="text-sm font-bold text-[var(--sol-base3)] text-center w-full truncate font-[family-name:var(--font-outfit)]">{mixer.name}</p>
                      <p className="text-xs text-[var(--sol-base01)] mt-1 font-[family-name:var(--font-montserrat)]">{mixer.songCount} {mixer.songCount === 1 ? 'Track' : 'Tracks'}</p>
                    </motion.div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      )}
      </div>

      {/* ── Right Sidebar (desktop only) ─────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-6 w-72 flex-shrink-0 overflow-y-auto pr-2 no-scrollbar md:pt-10">

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
                  { icon: BarChart3, label: 'Plays',    value: stats.totalPlays },
                  { icon: Mic2,     label: 'Artists',  value: stats.uniqueArtists },
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

      <AnimatePresence>
        {addingSongToSetlist && (
          <AddToSetlistModal 
            song={addingSongToSetlist}
            onClose={() => setAddingSongToSetlist(null)}
            onSuccess={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] bg-[var(--sol-cyan)] text-[var(--sol-base03)] px-5 py-3 rounded-full shadow-2xl font-bold text-sm font-[family-name:var(--font-montserrat)] flex items-center gap-2 whitespace-nowrap"
          >
            <Check size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
