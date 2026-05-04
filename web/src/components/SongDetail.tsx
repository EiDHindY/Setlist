'use client';

// ── SONG DETAIL ─────────────────────────────────────────────────────
// Port of mobile/lib/screens/song_detail_screen.dart
// Shows song header + versions list + inline player controls

import { useState, useCallback } from 'react';
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
  const { play, state } = usePlayback();

  useHardwareBack(true, onBack, `song_detail_${song.id}`);
  useHardwareBack(artworkExpanded, () => setArtworkExpanded(false), `artwork_expanded_${song.id}`);

  const handlePlayVersion = useCallback((version: SongVersion) => {
    play(song, version);
  }, [song, play]);

  const highResArt = song.albumArt.replace('100x100bb.jpg', '600x600bb.jpg');

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ── Gradient Background ────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, rgba(42,161,152,0.05) 0%, var(--sol-base03) 40%)`,
          }}
        />

        {/* ── Top Bar ────────────────────────────────────────────── */}
        <div className="relative flex-1 flex flex-col w-full max-w-2xl mx-auto z-10 overflow-hidden">
          <div className="flex items-center px-4 py-3 flex-shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} className="text-[var(--sol-cyan)]" />
          </button>
          <h2 className="flex-1 text-center text-[var(--sol-cyan)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">
            COLLECTION
          </h2>
          <div className="w-9" /> {/* Spacer for alignment */}
          </div>

          {/* ── Song Header ────────────────────────────────────────── */}
          <div className="px-5 pb-5 flex items-start gap-4 flex-shrink-0">
            {/* Album Art */}
            <div
              className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-[0_8px_15px_rgba(0,0,0,0.3)] cursor-pointer transition-bounce hover:scale-105"
              onClick={() => setArtworkExpanded(true)}
            >
              {song.albumArt ? (
                <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--sol-base02)] flex items-center justify-center">
                  <Music size={36} className="text-[var(--sol-base01)]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-[var(--sol-base3)] text-xl font-bold truncate font-[family-name:var(--font-montserrat)]">
                {song.title}
              </h1>
              <p className="text-[var(--sol-base0)] text-sm mt-1 font-[family-name:var(--font-montserrat)]">
                {song.artist}
              </p>
            </div>
          </div>

          {/* ── Tab Content ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto relative px-2">
          {currentTab === 0 ? (
            // ── Versions List ──
            <div className="flex flex-col h-full">
              {song.versions.length > 0 ? (
                <div className="flex-1 overflow-y-auto px-4 pb-24">
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
                        className={`mb-3 rounded-xl border transition-smooth ${
                          isCurrentlyPlaying
                            ? 'bg-[var(--sol-cyan)]/10 border-[var(--sol-cyan)]/30'
                            : 'bg-[var(--sol-base02)]/40 border-transparent hover:bg-[var(--sol-base02)]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          {/* Thumbnail */}
                          <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={thumbnailUrl}
                              alt={version.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--sol-base2)] text-[13px] font-semibold line-clamp-2 font-[family-name:var(--font-montserrat)]">
                              {version.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <User size={10} className="text-[var(--sol-base01)] flex-shrink-0" />
                              <p className="text-[var(--sol-base01)] text-[11px] truncate font-[family-name:var(--font-montserrat)]">
                                {version.channelName ?? 'YouTube Video'}
                              </p>
                            </div>
                          </div>

                          {/* Play Button */}
                          <button
                            onClick={() => handlePlayVersion(version)}
                            className="flex flex-col items-center gap-1 cursor-pointer transition-bounce hover:scale-110 active:scale-95"
                          >
                            {isCurrentlyPlaying && state.isPlaying ? (
                              <Pause
                                size={28}
                                className="text-[var(--sol-cyan)]"
                                fill="currentColor"
                              />
                            ) : (
                              <Play
                                size={28}
                                className="text-[var(--sol-cyan)]"
                                fill="currentColor"
                              />
                            )}
                            <span className="text-[var(--sol-cyan)]/80 text-[10px] font-[family-name:var(--font-montserrat)]">
                              {formatDuration(version.duration)}
                            </span>
                          </button>
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
              <div className="px-5 pb-5 flex-shrink-0">
                <button
                  onClick={() => setShowVersionSearch(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-[var(--sol-cyan)]/30 bg-[var(--sol-cyan)]/10 text-[var(--sol-cyan)] font-bold tracking-wider text-sm transition-bounce hover:scale-[1.02] hover:bg-[var(--sol-cyan)]/20 active:scale-95 cursor-pointer font-[family-name:var(--font-outfit)]"
                >
                  <PlusCircle size={20} />
                  ADD VERSION
                </button>
              </div>
            </div>
          ) : (
            // ── Placeholder Tabs ──
            <div className="flex flex-col items-center justify-center h-full">
              {(() => {
                const tab = TABS[currentTab];
                const Icon = tab.iconActive;
                return (
                  <>
                    <Icon size={56} className="text-[var(--sol-base01)]/30 mb-4" strokeWidth={1.5} />
                    <p className="text-[var(--sol-base01)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">
                      {tab.label.toUpperCase()}
                    </p>
                    <p className="text-[var(--sol-base01)]/70 text-xs mt-2 font-[family-name:var(--font-montserrat)]">
                      This space will host the {tab.label} feature.
                    </p>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Bottom Nav ─────────────────────────────────────────── */}
        <div className="relative flex-shrink-0 z-10 w-full">
          <div className="glass-heavy border-t border-[var(--sol-cyan)]/20">
            <div className="flex items-center justify-around px-2 py-2 w-full max-w-2xl mx-auto">
              {TABS.map((tab) => {
                const isActive = currentTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
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
