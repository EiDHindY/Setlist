'use client';

// ── SONG DETAIL ─────────────────────────────────────────────────────
// Port of mobile/lib/screens/song_detail_screen.dart
// Shows song header + versions list + inline player controls

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, PlusCircle, Play, Pause, Music, Disc3, Mic2,
  Users, BarChart3, ListMusic, User
} from 'lucide-react';
import type { Song, SongVersion } from '@/types/song';
import { formatDuration } from '@/types/song';
import { usePlayback } from '@/contexts/PlaybackContext';
import VersionSearch from './VersionSearch';
import { useHardwareBack } from '@/hooks/useHardwareBack';

interface SongDetailProps {
  song: Song;
  onBack: () => void;
  onSongUpdated: () => void;
}

const TABS = [
  { id: 0, label: 'Play', iconActive: Disc3, icon: Disc3 },
  { id: 1, label: 'Lyrics', iconActive: Mic2, icon: Mic2 },
  { id: 2, label: 'Credits', iconActive: Users, icon: Users },
  { id: 3, label: 'Setlists', iconActive: ListMusic, icon: ListMusic },
  { id: 4, label: 'Stats', iconActive: BarChart3, icon: BarChart3 },
];

export default function SongDetail({ song, onBack, onSongUpdated }: SongDetailProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [showVersionSearch, setShowVersionSearch] = useState(false);
  const [artworkExpanded, setArtworkExpanded] = useState(false);
  const [lyricsData, setLyricsData] = useState<{ plain: string | null; source: string } | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { play, state } = usePlayback();

  // Fetch lyrics when the Lyrics tab is opened
  useEffect(() => {
    if (currentTab !== 1) return;
    if (lyricsData !== null) return; // Already fetched
    setLyricsLoading(true);
    const params = new URLSearchParams({ title: song.title, artist: song.artist });
    fetch(`/api/lyrics?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setLyricsData({ plain: data.plain ?? null, source: data.source ?? 'Unknown' }))
      .catch(() => setLyricsData({ plain: null, source: 'Error' }))
      .finally(() => setLyricsLoading(false));
  }, [currentTab, song.title, song.artist, lyricsData]);

  useHardwareBack(true, onBack, `song_detail_${song.id}`);
  useHardwareBack(artworkExpanded, () => setArtworkExpanded(false), `artwork_expanded_${song.id}`);

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

  // Reset header visibility when switching away from lyrics tab
  const handleTabChange = useCallback((id: number) => {
    setCurrentTab(id);
    if (id !== 1) {
      setHeaderVisible(true);
      lastScrollY.current = 0;
    }
  }, []);

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
          <div className="px-5 pb-5 flex md:flex-col items-start md:items-center gap-4 flex-shrink-0 w-full">
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
        <div className="relative flex-1 flex flex-col z-10 w-full md:w-1/2 md:bg-[var(--sol-base02)]/10 min-h-0">
          
          {/* Desktop Only Tabs Header */}
          <div className="hidden md:flex p-6 pb-2 border-b border-[var(--sol-base01)]/20 shrink-0 justify-between items-center">
            <div className="flex gap-6 text-[var(--sol-base01)] font-bold text-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`pb-2 tracking-wider transition-colors cursor-pointer ${
                    currentTab === tab.id
                      ? 'text-[var(--sol-cyan)] border-b-2 border-[var(--sol-cyan)]'
                      : 'hover:text-[var(--sol-base0)]'
                  }`}
                >
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto relative px-2 md:px-6 md:pt-6">
            {currentTab === 0 ? (
              // ── Versions List ──
              <div className="flex flex-col h-full">
                {song.versions.length > 0 ? (
                  <div className="flex-1 overflow-y-auto px-2 md:px-0 pb-24 md:pb-6">
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
                                <Pause
                                  size={28}
                                  className="text-[var(--sol-cyan)]"
                                  fill="currentColor"
                                />
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
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Disc3 size={56} className="text-[var(--sol-base01)]/30 mb-4" strokeWidth={1.5} />
                    <p className="text-[var(--sol-base01)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">
                      NO VERSIONS
                    </p>
                  </div>
                )}

                {/* Add Version Button */}
                <div className="px-5 pb-5 md:pb-6 flex-shrink-0">
                  <button
                    onClick={() => setShowVersionSearch(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-[var(--sol-cyan)]/30 bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)] font-bold tracking-wider text-sm transition-bounce hover:scale-[1.02] hover:bg-[var(--sol-cyan)]/20 active:scale-95 cursor-pointer font-[family-name:var(--font-outfit)]"
                  >
                    <PlusCircle size={20} />
                    ADD VERSION
                  </button>
                </div>
              </div>
            ) : currentTab === 1 ? (
              // ── Lyrics Tab ──
              <div
                className="h-full overflow-y-auto hide-scrollbar px-5 pb-28 md:pb-6 pt-2"
                onScroll={handleLyricsScroll}
              >
                {lyricsLoading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-2 border-[var(--sol-cyan)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">Finding lyrics...</p>
                  </div>
                )}
                {!lyricsLoading && !lyricsData?.plain && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Mic2 size={48} className="text-[var(--sol-base01)]/30" strokeWidth={1.5} />
                    <p className="text-[var(--sol-base01)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">NO LYRICS FOUND</p>
                    <p className="text-[var(--sol-base01)]/60 text-xs font-[family-name:var(--font-montserrat)] text-center max-w-[220px]">
                      Couldn't find lyrics for this song on Genius or LRCLIB
                    </p>
                  </div>
                )}
                {!lyricsLoading && lyricsData?.plain && (
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
                    <p className="text-[var(--sol-base01)]/40 text-xs italic mt-8 text-center font-[family-name:var(--font-outfit)]">Lyrics via {lyricsData?.source || 'Genius'}</p>
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
          </div>

          {/* Bottom Nav (Mobile Only) — absolute so it overlays content, no blank space when hidden */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 md:hidden will-change-transform"
            style={{
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: headerVisible ? 'translateY(0)' : 'translateY(100%)',
            }}
          >
            <div className="glass-heavy border-t border-[var(--sol-cyan)]/20">
              <div className="flex items-center justify-around px-2 py-2 w-full max-w-2xl mx-auto">
                {TABS.map((tab) => {
                  const isActive = currentTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className="flex flex-col items-center gap-1 px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      <Icon
                        size={22}
                        className={isActive ? 'text-[var(--sol-cyan)]' : 'text-[var(--sol-base01)]'}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span
                        className={`text-[10px] font-[family-name:var(--font-montserrat)] ${
                          isActive ? 'text-[var(--sol-cyan)] font-semibold' : 'text-[var(--sol-base01)]'
                        }`}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
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
    </>
  );
}
