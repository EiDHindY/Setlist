'use client';

// ── SONG DETAIL ─────────────────────────────────────────────────────
// Port of mobile/lib/screens/song_detail_screen.dart
// Shows song header + versions list + inline player controls

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Music from 'lucide-react/dist/esm/icons/music';
import Disc3 from 'lucide-react/dist/esm/icons/disc-3';
import Mic2 from 'lucide-react/dist/esm/icons/mic-2';
import Users from 'lucide-react/dist/esm/icons/users';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import ListMusic from 'lucide-react/dist/esm/icons/list-music';
import User from 'lucide-react/dist/esm/icons/user';
import AlignLeft from 'lucide-react/dist/esm/icons/align-left';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Languages from 'lucide-react/dist/esm/icons/languages';
import FilePenLine from 'lucide-react/dist/esm/icons/file-pen-line';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Copyright from 'lucide-react/dist/esm/icons/copyright';
import Award from 'lucide-react/dist/esm/icons/award';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import type { Song, SongVersion, CreditsData } from '@/types/song';
import { formatDuration } from '@/types/song';
import { usePlayback } from '@/contexts/PlaybackContext';
import VersionSearch from './VersionSearch';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { useLibraryStore } from '@/store/libraryStore';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Check from 'lucide-react/dist/esm/icons/check';
import { useSetlistStore } from '@/store/setlistStore';
import AddToSetlistModal from './AddToSetlistModal';

interface SongDetailProps {
  song: Song;
  onBack: () => void;
  onSongUpdated: () => void;
  initialTab?: number;
}

const TABS = [
  { id: 0, label: 'Play', iconActive: Disc3, icon: Disc3 },
  { id: 1, label: 'Lyrics', iconActive: Mic2, icon: Mic2 },
  { id: 2, label: 'Credits', iconActive: Users, icon: Users },
  { id: 3, label: 'Setlists', iconActive: ListMusic, icon: ListMusic },
  { id: 4, label: 'Stats', iconActive: BarChart3, icon: BarChart3 },
];

const LYRICS_SUB_TABS = [
  { id: 'view', label: 'View', icon: AlignLeft },
  { id: 'sync', label: 'Sync', icon: Clock },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'edit', label: 'Edit', icon: FilePenLine },
];

export default function SongDetail({ song, onBack, onSongUpdated, initialTab = 0 }: SongDetailProps) {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [showVersionSearch, setShowVersionSearch] = useState(false);
  const [artworkExpanded, setArtworkExpanded] = useState(false);
  const [lyricsData, setLyricsData] = useState<{ plain: string | null; source: string } | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isDeepOpen, setIsDeepOpen] = useState(false);
  const [activeLyricsSubTab, setActiveLyricsSubTab] = useState('view');
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [translatedLyrics, setTranslatedLyrics] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const lastScrollY = useRef(0);
  const { play, state } = usePlayback();

  const { setlists, folders, setlistSongs, removeSongFromSetlist, fetchSetlistSongs } = useSetlistStore();
  const [addingToSetlist, setAddingToSetlist] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getFolderPath = useCallback((folderId: string | null): string => {
    if (!folderId) return 'Root';
    const crumbs: string[] = [];
    let curr = folderId;
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
  }, [folders]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const songSetlists = useMemo(() => {
    return setlists.filter(setlist => 
      (setlistSongs[setlist.id] || []).some(s => s.id === song.id)
    );
  }, [setlists, setlistSongs, song.id]);

  useEffect(() => {
    if (currentTab !== 3) return;
    setlists.forEach(s => fetchSetlistSongs(s.id));
  }, [currentTab, setlists, fetchSetlistSongs]);

  // Fetch lyrics when the Lyrics tab is opened
  useEffect(() => {
    if (currentTab !== 1) return;
    if (lyricsData !== null) return; // Already fetched
    setLyricsLoading(true);
    const params = new URLSearchParams({ songId: song.id, title: song.title, artist: song.artist });
    fetch(`/api/lyrics?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setLyricsData({ plain: data.plain ?? null, source: data.source ?? 'Unknown' }))
      .catch(() => setLyricsData({ plain: null, source: 'Error' }))
      .finally(() => setLyricsLoading(false));
  }, [currentTab, song.title, song.artist, lyricsData, song.id]);

  // Fetch credits when the Credits tab is opened
  useEffect(() => {
    if (currentTab !== 2) return;
    if (creditsData !== null) return; // Already fetched
    setCreditsLoading(true);
    const params = new URLSearchParams({ songId: song.id, title: song.title, artist: song.artist });
    fetch(`/api/credits?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const newCredits = { ...data.credits, source: data.source };
        setCreditsData(newCredits);
        useLibraryStore.getState().updateSongOptimistic({
          ...song,
          credits: newCredits
        });
      })
      .catch(() => setCreditsData(null))
      .finally(() => setCreditsLoading(false));
  }, [currentTab, song.title, song.artist, creditsData, song.id]);

  useHardwareBack(true, onBack, `song_detail_${song.id}`);
  useHardwareBack(artworkExpanded, () => setArtworkExpanded(false), `artwork_expanded_${song.id}`);

  const handleRefreshCredits = useCallback(async () => {
    setCreditsLoading(true);
    try {
      const params = new URLSearchParams({ 
        songId: song.id, 
        title: song.title, 
        artist: song.artist,
        refresh: 'true' // Tell the API to ignore cache
      });
      const response = await fetch(`/api/credits?${params.toString()}`);
      const data = await response.json();
      const newCredits = { ...data.credits, source: data.source };
      setCreditsData(newCredits);
      useLibraryStore.getState().updateSongOptimistic({
        ...song,
        credits: newCredits
      });
    } catch (error) {
      console.error('🛑 Failed to refresh credits:', error);
    } finally {
      setCreditsLoading(false);
    }
  }, [song.id, song.title, song.artist]);

  const handlePlayVersion = useCallback((version: SongVersion) => {
    play(song, version);
  }, [song, play]);

  const highResArt = song.albumArt.replace('100x100bb.jpg', '600x600bb.jpg');

  const handleLyricsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentY = e.currentTarget.scrollTop;
    const diff = currentY - lastScrollY.current;
    if (diff > 2) {
      setHeaderVisible(false);
    } else if (diff < -2) {
      setHeaderVisible(true);
    }
    lastScrollY.current = currentY;
  }, []);

  const [swipeDir, setSwipeDir] = useState<'left' | 'right'>('left');

  // Reset header visibility when switching away from lyrics tab
  const handleTabChange = useCallback((id: number, dir?: 'left' | 'right') => {
    if (id === currentTab && id === 1) {
      // Toggle deep open if tapping active Lyrics tab
      setIsDeepOpen((prev) => !prev);
      return;
    }

    setSwipeDir(dir ?? (id > currentTab ? 'left' : 'right'));
    setIsDeepOpen(false);
    setCurrentTab(id);
    if (id !== 1) {
      setHeaderVisible(true);
      lastScrollY.current = 0;
    }
  }, [currentTab]);

  // Swipe left/right to navigate tabs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

    if (Math.abs(deltaX) > 50 && isHorizontalSwipe) {
      if (deltaX < 0) {
        // Swipe left -> Next tab
        handleTabChange(Math.min(currentTab + 1, TABS.length - 1), 'left');
      } else {
        // Swipe right -> Previous tab or go back to collection
        if (currentTab === 0) {
          onBack();
        } else {
          handleTabChange(currentTab - 1, 'right');
        }
      }
    }
  }, [currentTab, handleTabChange]);

  return (
    <>
      <div className="flex flex-col md:flex-row h-full w-full relative">
        {/* ── Gradient Background ────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `linear-gradient(to bottom, rgba(42,161,152,0.05) 0%, var(--sol-base03) 40%)`,
          }}
        />

        {/* ── LEFT PANE: Album Art & Header ──────────────────────── */}
        <div className="relative flex flex-col w-full md:w-1/2 flex-shrink-0 z-10 md:border-r md:border-[var(--sol-base01)]/20 md:items-center md:justify-center md:p-12">
          {/* Top Bar — mobile: only on Play tab; desktop: always */}
          <div className={`items-center px-4 py-3 flex-shrink-0 md:absolute md:top-4 md:left-4 md:w-[calc(100%-2rem)] ${currentTab === 0 ? 'flex' : 'hidden md:flex'}`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBack();
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
            >
              <ArrowLeft size={20} className="text-[var(--sol-cyan)]" />
            </button>
            <h2 className="flex-1 text-center md:text-left ml-2 md:ml-4 text-[var(--sol-base01)] text-[11px] md:text-sm font-[family-name:var(--font-montserrat)] truncate">
              Your collection of <span className="text-[var(--sol-cyan)] font-semibold">{song.title}</span> by <span className="text-[var(--sol-cyan)] font-semibold">{song.artist}</span>
            </h2>
            <div className="w-10 flex-shrink-0 md:hidden" />
          </div>

          {/* Song Header — always visible, static */}
          <div className={`px-5 pb-5 flex md:flex-col items-start md:items-center gap-4 flex-shrink-0 w-full ${currentTab !== 0 ? 'pt-4 md:pt-0' : ''}`}>
            {/* Album Art */}
            <div
              className="w-20 h-20 md:w-64 md:h-64 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_8px_15px_rgba(0,0,0,0.3)] md:shadow-2xl md:mb-6 cursor-pointer transition-bounce hover:scale-105 mx-auto md:mx-0"
              onClick={() => setArtworkExpanded(true)}
            >
              {song.albumArt ? (
                <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--sol-base02)] flex items-center justify-center border border-[var(--sol-base01)]/30">
                  <Music size={36} className="text-[var(--sol-base01)] md:w-20 md:h-20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 md:flex-none min-w-0 pt-1 md:pt-0 text-left md:text-center w-full">
              <h1 className="text-[var(--sol-base3)] text-xl md:text-4xl font-bold truncate md:whitespace-normal font-[family-name:var(--font-montserrat)] md:mb-2">
                {song.title}
              </h1>
              <p className="text-[var(--sol-base0)] text-sm md:text-xl mt-1 md:mt-0 font-[family-name:var(--font-montserrat)] md:mb-10">
                {song.artist}
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: Tabs & Content ─────────────────────────── */}
        <div
          className="relative flex-1 flex flex-col z-10 w-full md:w-1/2 md:bg-[var(--sol-base02)]/10 min-h-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          
          {/* Desktop Only Tabs Header */}
          <div className="hidden md:flex flex-col p-6 pb-2 border-b border-[var(--sol-base01)]/20 shrink-0 gap-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-6 text-[var(--sol-base01)] font-bold text-sm">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`pb-2 tracking-wider transition-colors cursor-pointer relative ${
                      currentTab === tab.id
                        ? 'text-[var(--sol-cyan)]'
                        : 'hover:text-[var(--sol-base0)]'
                    }`}
                  >
                    {tab.label.toUpperCase()}
                    {currentTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--sol-cyan)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Tabs (Desktop) */}
            <AnimatePresence>
              {currentTab === 1 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 4 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="flex gap-2 overflow-hidden pb-2"
                >
                  {LYRICS_SUB_TABS.map((sub) => {
                    const isActive = activeLyricsSubTab === sub.id;
                    const Icon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setActiveLyricsSubTab(sub.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                          isActive
                            ? 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30'
                            : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] hover:bg-[var(--sol-base01)]/5 border border-transparent'
                        }`}
                      >
                        <Icon size={14} />
                        {sub.label}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-hidden relative px-2 md:px-6 md:pt-6">
            <AnimatePresence mode="wait" custom={swipeDir}>
              <motion.div
                key={currentTab}
                custom={swipeDir}
                variants={{
                  initial: (dir: string) => ({ opacity: 0, x: dir === 'left' ? 40 : -40 }),
                  animate: { opacity: 1, x: 0 },
                  exit: (dir: string) => ({ opacity: 0, x: dir === 'left' ? -40 : 40 }),
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="h-full overflow-y-auto"
              >
            {currentTab === 0 ? (
              // ── Versions List ──
              <div className="flex flex-col h-full">
                {song.versions.length > 0 ? (
                  <div className="px-2 md:px-0 pb-24 md:pb-6">
                    {song.versions.map((version, i) => {
                      const isCurrentlyPlaying = state.version?.youtubeVideoId === version.youtubeVideoId;
                      const thumbnailUrl = version.thumbnailUrl ||
                        `https://img.youtube.com/vi/${version.youtubeVideoId}/mqdefault.jpg`;

                      return (
                        <motion.div
                          key={version.id || version.youtubeVideoId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          onClick={() => handlePlayVersion(version)}
                          className={`mb-3 rounded-xl border transition-smooth cursor-pointer group ${
                            isCurrentlyPlaying
                              ? 'bg-[var(--sol-cyan)]/10 border-[var(--sol-cyan)]/30'
                              : 'bg-[var(--sol-base02)]/40 border-transparent hover:border-[var(--sol-base01)]/30 hover:bg-[var(--sol-base02)]/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 px-4 py-3">
                            {/* Thumbnail */}
                            <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--sol-base01)]/20 relative">
                              <img
                                src={thumbnailUrl}
                                alt={version.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-semibold line-clamp-2 font-[family-name:var(--font-montserrat)] transition-colors ${isCurrentlyPlaying ? 'text-[var(--sol-cyan)]' : 'text-[var(--sol-base2)] group-hover:text-white'}`}>
                                {version.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <User size={10} className="text-[var(--sol-base01)] flex-shrink-0" />
                                <p className="text-[var(--sol-base01)] text-[11px] truncate font-[family-name:var(--font-montserrat)]">
                                  {version.channelName ?? 'YouTube Video'}
                                </p>
                              </div>
                            </div>

                            {/* Play Indicator */}
                            <div className="flex flex-col items-center gap-1 transition-bounce group-hover:scale-110 group-active:scale-95">
                              {isCurrentlyPlaying && state.isPlaying ? (
                                <Pause size={28} className="text-[var(--sol-cyan)]" fill="currentColor" />
                              ) : (
                                <Play
                                  size={28}
                                  className={isCurrentlyPlaying ? "text-[var(--sol-cyan)]" : "text-[var(--sol-base01)] group-hover:text-[var(--sol-cyan)] transition-colors"}
                                  fill="currentColor"
                                />
                              )}
                              <span className={`${isCurrentlyPlaying ? 'text-[var(--sol-cyan)]/80' : 'text-[var(--sol-base01)]'} text-[10px] font-[family-name:var(--font-montserrat)]`}>
                                {formatDuration(version.duration)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Add Version Button — inline after last version */}
                    <div className="flex justify-center mt-3 mb-2">
                      <button
                        onClick={() => setShowVersionSearch(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--sol-cyan)]/30 bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)] font-bold tracking-wider text-xs transition-bounce hover:scale-[1.04] hover:bg-[var(--sol-cyan)]/20 active:scale-95 cursor-pointer font-[family-name:var(--font-outfit)]"
                      >
                        <PlusCircle size={16} />
                        ADD VERSION
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center pb-24">
                    <Disc3 size={56} className="text-[var(--sol-base01)]/30 mb-4" strokeWidth={1.5} />
                    <p className="text-[var(--sol-base01)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">
                      NO VERSIONS
                    </p>
                    <button
                      onClick={() => setShowVersionSearch(true)}
                      className="mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-[var(--sol-cyan)]/30 bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)] font-bold tracking-wider text-sm transition-bounce hover:scale-[1.02] hover:bg-[var(--sol-cyan)]/20 active:scale-95 cursor-pointer font-[family-name:var(--font-outfit)]"
                    >
                      <PlusCircle size={20} />
                      ADD VERSION
                    </button>
                  </div>
                )}
              </div>
            ) : currentTab === 1 ? (
              // ── Lyrics Tab ──
              <div
                className="h-full overflow-y-auto hide-scrollbar px-5 pb-28 md:pb-6 pt-2"
                onScroll={handleLyricsScroll}
              >
                {lyricsLoading && (
                  <div className="space-y-4 pt-10">
                    <div className="h-4 w-3/4 rounded-full bg-[var(--sol-base01)]/10 animate-shimmer" />
                    <div className="h-4 w-full rounded-full bg-[var(--sol-base01)]/10 animate-shimmer" />
                    <div className="h-4 w-5/6 rounded-full bg-[var(--sol-base01)]/10 animate-shimmer" />
                    <div className="h-4 w-2/3 rounded-full bg-[var(--sol-base01)]/10 animate-shimmer" />
                  </div>
                )}
                {!lyricsLoading && !lyricsData?.plain && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <AlignLeft size={48} className="text-[var(--sol-base01)] mb-4" strokeWidth={1.5} />
                    <p className="text-[var(--sol-base01)] text-xs font-bold tracking-[2px] font-[family-name:var(--font-outfit)] uppercase text-center max-w-[220px]">
                      Couldn't find lyrics for this song
                    </p>
                  </div>
                )}
                {!lyricsLoading && lyricsData?.plain && (
                  <div className="space-y-8">
                    {activeLyricsSubTab === 'view' && (
                      <div className="space-y-1">
                        {lyricsData.plain.split('\n').map((line, i) => (
                          <p
                            key={i}
                            className={`font-[family-name:var(--font-montserrat)] leading-relaxed ${
                              line.trim() === ''
                                ? 'h-4'
                                : 'text-[var(--sol-base2)] text-base md:text-lg font-medium'
                            }`}
                          >
                            {line || '\u00A0'}
                          </p>
                        ))}
                      </div>
                    )}

                    {activeLyricsSubTab === 'sync' && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Clock size={48} className="text-[var(--sol-base01)] mb-4" />
                        <p className="text-[var(--sol-base01)] text-xs font-bold tracking-widest uppercase">Sync Feature - Ready for your code!</p>
                      </div>
                    )}

                    {activeLyricsSubTab === 'translate' && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Languages size={48} className="text-[var(--sol-base01)] mb-4" />
                        <p className="text-[var(--sol-base01)] text-xs font-bold tracking-widest uppercase">Translate Feature - Ready for your code!</p>
                      </div>
                    )}

                    {activeLyricsSubTab === 'edit' && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <FilePenLine size={48} className="text-[var(--sol-base01)] mb-4" />
                        <p className="text-[var(--sol-base01)] text-xs font-bold tracking-widest uppercase">Edit Feature - Ready for your code!</p>
                      </div>
                    )}

                    <p className="text-[var(--sol-base01)]/40 text-xs italic mt-8 text-center font-[family-name:var(--font-outfit)]">Lyrics via {lyricsData?.source || 'Genius'}</p>
                  </div>
                )}
              </div>
            ) : currentTab === 2 ? (
              // ── Credits Tab ──
              <div className="h-full overflow-y-auto px-5 pb-28 md:pb-6 pt-4">
                {creditsLoading ? (
                  <div className="space-y-8 animate-pulse">
                    {/* Album/Date Shimmer */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-16 rounded-2xl animate-shimmer opacity-40" />
                      <div className="h-16 rounded-2xl animate-shimmer opacity-40" />
                    </div>
                    {/* Section Shimmers */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-4 w-24 rounded animate-shimmer opacity-30" />
                        <div className="space-y-2">
                          <div className="h-8 w-full rounded-xl animate-shimmer opacity-20" />
                          <div className="h-8 w-full rounded-xl animate-shimmer opacity-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Album & Release Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10 rounded-2xl p-4">
                        <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-wider font-[family-name:var(--font-outfit)] uppercase mb-1">Album</p>
                        <p className="text-[var(--sol-base3)] text-sm font-semibold truncate select-all">
                          {creditsData?.album || song.album || 'Unknown'}
                        </p>
                      </div>
                      <div className="bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10 rounded-2xl p-4">
                        <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-wider font-[family-name:var(--font-outfit)] uppercase mb-1">Release Date</p>
                        <p className="text-[var(--sol-base3)] text-sm font-semibold select-all">
                          {creditsData?.releaseDate || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Group A: Production */}
                    <CreditSection 
                      title="🎬 Production" 
                      items={creditsData?.production || []} 
                      icon={Award}
                    />

                    {/* Group B: Musicians */}
                    <CreditSection 
                      title="🎸 Musicians" 
                      items={creditsData?.musicians || []} 
                      icon={Users}
                    />

                    {/* Group C: Vocals & Lyrics */}
                    <CreditSection 
                      title="🎤 Vocals & Lyrics" 
                      items={creditsData?.vocals || []} 
                      icon={Mic2}
                    />

                    {/* Group D: Copyright */}
                    {creditsData?.additional && Array.isArray(creditsData.additional) && creditsData.additional.length > 0 && (
                      <CreditSection 
                        title="🏛️ Copyright" 
                        items={creditsData.additional} 
                        icon={Copyright}
                      />
                    )}

                    {creditsData?.source && (
                      <div className="mt-12 mb-8 flex flex-col items-center gap-4">
                        <p className="text-[var(--sol-base01)]/40 text-[10px] italic text-center font-[family-name:var(--font-outfit)] tracking-wider uppercase">
                          Credits via {creditsData.source}
                        </p>
                        <button
                          onClick={handleRefreshCredits}
                          disabled={creditsLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--sol-base01)]/5 hover:bg-[var(--sol-base01)]/10 border border-[var(--sol-base01)]/10 transition-all active:scale-95 disabled:opacity-50 group"
                        >
                          <RefreshCw size={12} className={`text-[var(--sol-cyan)] ${creditsLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                          <span className="text-[var(--sol-base01)] text-[10px] font-bold tracking-widest uppercase">Refresh Data</span>
                        </button>
                      </div>
                    )}

                    {(!creditsData || (creditsData.production.length === 0 && creditsData.musicians.length === 0 && creditsData.vocals.length === 0)) && (
                      <div className="flex flex-col items-center justify-center py-10 opacity-40">
                        <Users size={48} className="text-[var(--sol-base01)] mb-4" strokeWidth={1.5} />
                        <p className="text-[var(--sol-base01)] text-xs font-bold tracking-[2px] font-[family-name:var(--font-outfit)] uppercase">No Detailed Credits Found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : currentTab === 4 ? (
              // ── Stats Tab ──
              <div className="h-full overflow-y-auto px-5 pb-28 md:pb-6 pt-4">
                <div className="space-y-6">
                  {/* Mastery Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[var(--sol-base02)] to-[var(--sol-base03)] border border-[var(--sol-cyan)]/20 rounded-2xl p-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Award size={80} className="text-[var(--sol-cyan)]" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)]">
                        <Award size={20} />
                      </div>
                      <div>
                        <h3 className="text-[var(--sol-base2)] font-bold text-sm tracking-wide font-[family-name:var(--font-outfit)]">MASTERY LEVEL</h3>
                        <p className="text-[var(--sol-cyan)] text-xs font-semibold">Level {song.masteryLevel || 0}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-[var(--sol-base01)]/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(((song.playCount || 0) / 50) * 100, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-[var(--sol-cyan)] to-[var(--sol-blue)] shadow-[0_0_10px_rgba(42,161,152,0.4)]"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--sol-base01)] font-medium">
                        <span>{song.playCount || 0} Plays</span>
                        <span>Next: {Math.max(50 - (song.playCount || 0), 0)} more</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Grid of Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total Plays */}
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10 rounded-2xl p-4"
                    >
                      <TrendingUp size={18} className="text-[var(--sol-cyan)] mb-2" />
                      <p className="text-[var(--sol-base3)] text-xl font-bold font-[family-name:var(--font-montserrat)]">{song.playCount || 0}</p>
                      <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-wider font-[family-name:var(--font-outfit)] uppercase">Total Plays</p>
                    </motion.div>

                    {/* Total Time */}
                    <motion.div
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10 rounded-2xl p-4"
                    >
                      <Clock size={18} className="text-[var(--sol-blue)] mb-2" />
                      <p className="text-[var(--sol-base3)] text-xl font-bold font-[family-name:var(--font-montserrat)]">
                        {(() => {
                          const sec = song.totalPlaySeconds || 0;
                          const m = Math.floor(sec / 60);
                          const s = sec % 60;
                          return `${m}:${s.toString().padStart(2, '0')}`;
                        })()}
                      </p>
                      <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-wider font-[family-name:var(--font-outfit)] uppercase">Time Listened</p>
                    </motion.div>

                    {/* Last Played */}
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10 rounded-2xl p-4 col-span-2"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-[var(--sol-magenta)]" />
                        <div className="flex-1">
                          <p className="text-[var(--sol-base2)] text-sm font-semibold font-[family-name:var(--font-montserrat)]">
                            {song.lastPlayedAt ? new Date(song.lastPlayedAt).toLocaleDateString(undefined, { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Not played yet'}
                          </p>
                          <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-wider font-[family-name:var(--font-outfit)] uppercase mt-0.5">Last Played At</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Metadata Section */}
                  {(song.isrc || song.bpm || song.musicalKey || (song.moodTags && song.moodTags.length > 0)) && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10 rounded-2xl p-4 space-y-4"
                    >
                      {song.isrc && (
                        <div className="flex items-center gap-3">
                          <Music size={18} className="text-[var(--sol-cyan)]" />
                          <div className="flex-1">
                            <p className="text-[var(--sol-base2)] text-sm font-mono font-medium tracking-wider select-all uppercase">
                              {song.isrc}
                            </p>
                            <p className="text-[var(--sol-base01)] text-[10px] font-bold tracking-wider font-[family-name:var(--font-outfit)] uppercase mt-0.5">ISRC Code</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        {song.bpm && (
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--sol-orange)]/15 text-[var(--sol-orange)] border border-[var(--sol-orange)]/25">
                                {song.bpm}
                              </span>
                            </div>
                            <p className="text-[var(--sol-base01)] text-[9px] font-bold uppercase">BPM</p>
                          </div>
                        )}
                        {song.musicalKey && (
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--sol-violet)]/15 text-[var(--sol-violet)] border border-[var(--sol-violet)]/25">
                                {song.musicalKey}
                              </span>
                            </div>
                            <p className="text-[var(--sol-base01)] text-[9px] font-bold uppercase">KEY</p>
                          </div>
                        )}
                        {song.moodTags && song.moodTags.length > 0 && (
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {song.moodTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[var(--sol-magenta)]/15 text-[var(--sol-magenta)] border border-[var(--sol-magenta)]/25 capitalize"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <p className="text-[var(--sol-base01)] text-[9px] font-bold uppercase">MOOD / GENRE</p>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}

                  {/* Future Stats Tip */}
                  <div className="bg-[var(--sol-cyan)]/5 border border-dashed border-[var(--sol-cyan)]/20 rounded-xl p-4">
                    <p className="text-[var(--sol-base01)] text-[11px] leading-relaxed italic text-center font-[family-name:var(--font-montserrat)]">
                      Playback stats are recorded after 30 seconds of listening. Keep practicing to increase your Mastery!
                    </p>
                  </div>
                </div>
              </div>
            ) : currentTab === 3 ? (
              // ── Setlists Tab ──
              <div className="h-full overflow-y-auto px-5 pb-28 md:pb-6 pt-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[var(--sol-base3)] font-bold font-[family-name:var(--font-outfit)] uppercase">In Setlists</h3>
                  <button
                    onClick={() => setAddingToSetlist(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--sol-cyan)]/30 bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)] font-bold tracking-wider text-[10px] transition-bounce hover:scale-105 hover:bg-[var(--sol-cyan)]/20 active:scale-95 cursor-pointer font-[family-name:var(--font-outfit)]"
                  >
                    <PlusCircle size={14} />
                    ADD TO SETLIST
                  </button>
                </div>
                
                {songSetlists.length > 0 ? (
                  <div className="space-y-2">
                    {songSetlists.map(setlist => (
                      <div key={setlist.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[var(--sol-cyan)]/10 flex items-center justify-center flex-shrink-0">
                            <ListMusic size={16} className="text-[var(--sol-cyan)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[var(--sol-base2)] text-sm font-bold font-[family-name:var(--font-outfit)] truncate">{setlist.name}</p>
                            <p className="text-[var(--sol-base01)] text-[10px] truncate opacity-60 font-medium font-[family-name:var(--font-montserrat)] tracking-wide">{getFolderPath(setlist.folderId)}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const success = await removeSongFromSetlist(setlist.id, song.id);
                            if (success) showToast(`Removed from ${setlist.name}`);
                          }}
                          className="p-2 rounded-full hover:bg-[var(--sol-red)]/10 group transition-colors flex-shrink-0 ml-4"
                        >
                          <Trash2 size={16} className="text-[var(--sol-base01)] group-hover:text-[var(--sol-red)] transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <ListMusic size={48} className="text-[var(--sol-base01)] mb-4" strokeWidth={1.5} />
                    <p className="text-[var(--sol-base01)] text-xs font-bold tracking-[2px] font-[family-name:var(--font-outfit)] uppercase text-center">Not in any setlists</p>
                  </div>
                )}
              </div>
            ) : (
              // ── Other Placeholder Tabs ──
              <div className="flex flex-col items-center justify-center h-full pb-20 md:pb-0">
                {(() => {
                  const tab = TABS[currentTab];
                  const Icon = tab.iconActive;
                  return (
                    <>
                      <Icon size={56} className="text-[var(--sol-base01)]/30 mb-4" strokeWidth={1.5} />
                      <p className="text-[var(--sol-base01)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">
                        {tab.label.toUpperCase()}
                      </p>
                      <p className="text-[var(--sol-base01)]/70 text-xs mt-2 font-[family-name:var(--font-montserrat)] text-center max-w-[250px]">
                        This space will host the {tab.label} feature.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Nav (Mobile Only) — absolute so it overlays content, no blank space when hidden */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 md:hidden will-change-transform"
            style={{
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: headerVisible ? 'translateY(0)' : 'translateY(100%)',
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div className="border-t border-[var(--sol-cyan)]/20 overflow-hidden relative min-h-[64px] flex items-center" style={{ background: 'var(--sol-base02)' }}>
              <AnimatePresence mode="wait">
                {currentTab === 1 && isDeepOpen ? (
                  /* ── LYRICS SUB-NAV ───────────────────────────────────── */
                  <motion.div
                    key="sub"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 40) setIsDeepOpen(false);
                    }}
                    className="flex items-center w-full justify-around px-2 py-2"
                  >
                    {LYRICS_SUB_TABS.map((sub) => {
                      const isActive = activeLyricsSubTab === sub.id;
                      const Icon = sub.icon;
                      return (
                        <motion.button
                          key={sub.id}
                          onClick={() => setActiveLyricsSubTab(sub.id)}
                          layout
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className={`flex items-center gap-1.5 rounded-full cursor-pointer transition-colors shrink-0 ${
                            isActive
                              ? 'bg-[var(--sol-cyan)] text-[var(--sol-base03)] px-3 py-1.5'
                              : 'bg-transparent text-[var(--sol-base01)] hover:text-[var(--sol-base1)] p-1.5'
                          }`}
                        >
                          <Icon size={isActive ? 16 : 20} strokeWidth={isActive ? 2.5 : 2} />
                          <AnimatePresence>
                            {isActive && (
                              <motion.span
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 'auto', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-[11px] font-bold tracking-wide whitespace-nowrap overflow-hidden font-[family-name:var(--font-montserrat)]"
                              >
                                {sub.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ) : (
                  /* ── MAIN TABS ────────────────────────────────────────── */
                  <motion.div
                    key="main"
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -40 && currentTab === 1) setIsDeepOpen(true);
                    }}
                    className="flex items-center justify-around w-full max-w-2xl mx-auto px-2 py-2"
                  >
                    {TABS.map((tab) => {
                      const isActive = currentTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className="flex flex-col items-center gap-1 px-3 py-1.5 transition-colors cursor-pointer relative"
                        >
                          <Icon
                            size={22}
                            className={isActive ? 'text-[var(--sol-cyan)]' : 'text-[var(--sol-base01)]'}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-[family-name:var(--font-montserrat)] ${
                                isActive ? 'text-[var(--sol-cyan)] font-semibold' : 'text-[var(--sol-base01)]'
                              }`}
                            >
                              {tab.label}
                            </span>
                            {isActive && tab.id === 1 && (
                              <motion.div
                                animate={{ x: [0, 2, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                className="absolute -right-1 top-[55%]"
                              >
                                <ChevronRight size={10} className="text-[var(--sol-cyan)]" />
                              </motion.div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Artwork Expanded ─────────────────────────────────────── */}
      <AnimatePresence>
        {artworkExpanded && song.albumArt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center cursor-pointer"
            onClick={() => setArtworkExpanded(false)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={highResArt}
              alt={song.title}
              className="max-w-[85vw] max-h-[85vh] rounded-3xl shadow-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Version Search Modal ─────────────────────────────────── */}
      <VersionSearch
        song={song}
        isOpen={showVersionSearch}
        onClose={(didAdd) => {
          setShowVersionSearch(false);
          if (didAdd) onSongUpdated();
        }}
      />

      <AnimatePresence>
        {addingToSetlist && (
          <AddToSetlistModal 
            song={song}
            onClose={() => setAddingToSetlist(false)}
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
    </>
  );
}

// ── SUB-COMPONENTS ───────────────────────────────────────────────────

function CreditSection({ title, items, icon: Icon }: { title: string; items: Array<{ role: string; name: string }>; icon: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-[var(--sol-base01)]/10 pb-2">
        <Icon size={14} className="text-[var(--sol-cyan)]" />
        <h3 className="text-[var(--sol-base01)] text-xs font-bold tracking-[2px] font-[family-name:var(--font-outfit)] uppercase">
          {title}
        </h3>
      </div>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div key={i} className="flex justify-between items-baseline gap-4 group">
              <span className="text-[var(--sol-base01)] text-[11px] font-medium font-[family-name:var(--font-montserrat)] uppercase tracking-tight shrink-0">
                {item.role}
              </span>
              <div className="h-[1px] flex-1 bg-[var(--sol-base01)]/5 group-hover:bg-[var(--sol-base01)]/10 transition-colors" />
              <span className="text-[var(--sol-base3)] text-sm font-semibold font-[family-name:var(--font-montserrat)] text-right select-all">
                {item.name}
              </span>
            </div>
          ))
        ) : (
          <div className="flex justify-between items-baseline gap-4 opacity-30">
            <span className="text-[var(--sol-base01)] text-[11px] font-medium font-[family-name:var(--font-montserrat)] uppercase tracking-tight">INFO</span>
            <div className="h-[1px] flex-1 bg-[var(--sol-base01)]/5" />
            <span className="text-[var(--sol-base3)] text-sm font-semibold font-[family-name:var(--font-montserrat)]">Unknown</span>
          </div>
        )}
      </div>
    </div>
  );
}
