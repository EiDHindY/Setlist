'use client';

// ── VERSION SEARCH ──────────────────────────────────────────────────
// Port of mobile/lib/screens/version_search_screen.dart (Step 2)
// YouTube search + paste-a-link → attach version to Master Song

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ExternalLink, Loader2, Eye, Clock, CheckCircle, PlusCircle, User } from 'lucide-react';
import type { Song, YouTubeSearchResult } from '@/types/song';
import { supabase } from '@/utils/supabase';
import { useLibraryStore } from '@/store/libraryStore';
import { searchYouTube, getVideoDetails, extractVideoId } from '@/services/youtube-search';
import { saveVersion } from '@/services/library';
import { formatDuration, formatViewCount } from '@/types/song';
import { useHardwareBack } from '@/hooks/useHardwareBack';

interface VersionSearchProps {
  song: Song;
  isOpen: boolean;
  onClose: (didAddVersion: boolean) => void;
}

export default function VersionSearch({ song, isOpen, onClose }: VersionSearchProps) {
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasteQuery, setPasteQuery] = useState('');
  const [locallyAddedIds, setLocallyAddedIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [anyAdded, setAnyAdded] = useState(false);
  const [detailResult, setDetailResult] = useState<YouTubeSearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically search when opened
  useEffect(() => {
    if (isOpen) {
      performInitialSearch();
    } else {
      // Reset
      setResults([]);
      setLoading(true);
      setPasteQuery('');
      setLocallyAddedIds(new Set());
      setSavingIds(new Set());
      setAnyAdded(false);
      setDetailResult(null);
    }
  }, [isOpen, song.id]);

  useHardwareBack(isOpen, () => onClose(anyAdded), 'version_search');
  useHardwareBack(!!detailResult, () => setDetailResult(null), 'version_detail');

  const performInitialSearch = async () => {
    setLoading(true);
    const query = `${song.artist} ${song.title}`;
    const ytResults = await searchYouTube(query, 10);
    setResults(ytResults);
    setLoading(false);
  };

  const handlePaste = async (value: string) => {
    setPasteQuery(value);

    if (value.includes('youtube.com/') || value.includes('youtu.be/')) {
      const videoId = extractVideoId(value);
      if (!videoId) return;

      setLoading(true);
      const details = await getVideoDetails(videoId);
      if (details) {
        setResults([details]);
      }
      setLoading(false);
    }
  };

  const handleAddVersion = async (result: YouTubeSearchResult) => {
    if (savingIds.has(result.videoId) || locallyAddedIds.has(result.videoId)) return;
    if (song.versions.some((v) => v.youtubeVideoId === result.videoId)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSavingIds((prev) => new Set(prev).add(result.videoId));

    const success = await saveVersion(user.id, song.id, result);

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(result.videoId);
      return next;
    });

    if (success) {
      setLocallyAddedIds((prev) => new Set(prev).add(result.videoId));
      setAnyAdded(true);
      // Force-sync the library store so the new version appears immediately
      // without waiting for the 5-minute cache window to expire.
      useLibraryStore.getState().fetchLibrary(user.id, true);
    }
  };

  const openOnYouTube = () => {
    const query = encodeURIComponent(`${song.title} - ${song.artist}`);
    window.open(`https://music.youtube.com/search?q=${query}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh]"
      onClick={() => onClose(anyAdded)}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl mx-4 bg-[var(--sol-base03)] rounded-3xl border border-[var(--sol-base01)]/15 shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="p-4 border-b border-[var(--sol-base01)]/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onClose(anyAdded)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} className="text-[var(--sol-base1)]" />
            </button>

            {song.albumArt && (
              <img
                src={song.albumArt}
                alt={song.title}
                className="w-8 h-8 rounded-md object-cover"
              />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-[var(--sol-cyan)] text-[10px] font-medium font-[family-name:var(--font-montserrat)]">
                Add YT versions to make a collection for:
              </p>
              <p className="text-[var(--sol-base3)] text-sm font-bold truncate font-[family-name:var(--font-montserrat)]">
                {song.title}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <p className="text-center mt-2 text-[var(--sol-cyan)]/60 text-[10px] font-bold tracking-[3px] font-[family-name:var(--font-montserrat)]">
            STEP 2
          </p>
        </div>

        {/* ── Search Bar ─────────────────────────────────────────── */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex items-center h-11 rounded-2xl bg-[var(--sol-base02)]/50 border border-[var(--sol-cyan)]/20 px-3 gap-2">
            <button
              onClick={openOnYouTube}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
              title="Open on YouTube"
            >
              <ExternalLink size={16} className="text-[var(--sol-cyan)]" />
            </button>
            <div className="w-px h-5 bg-[var(--sol-base01)]/30" />
            <input
              ref={inputRef}
              type="text"
              value={pasteQuery}
              onChange={(e) => handlePaste(e.target.value)}
              placeholder="Paste a YouTube link here..."
              className="flex-1 bg-transparent text-[var(--sol-base2)] text-xs outline-none placeholder:text-[var(--sol-base01)]/70 font-[family-name:var(--font-montserrat)]"
            />
            {pasteQuery && (
              <button
                onClick={() => {
                  setPasteQuery('');
                  performInitialSearch();
                }}
                className="p-1 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X size={14} className="text-[var(--sol-base01)]" />
              </button>
            )}
          </div>
        </div>

        {/* ── Results ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={36} className="text-[var(--sol-cyan)] animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={48} className="text-[var(--sol-base01)]/30 mb-4" />
              <p className="text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">
                No results found.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {results.map((result, i) => {
                const isSaving = savingIds.has(result.videoId);
                const isAdded = locallyAddedIds.has(result.videoId) ||
                  song.versions.some((v) => v.youtubeVideoId === result.videoId);

                return (
                  <motion.div
                    key={result.videoId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="mb-3"
                  >
                    <div
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-smooth cursor-pointer ${
                        result.isOfficial
                          ? 'bg-[var(--sol-cyan)]/5 border-[var(--sol-cyan)]/30 shadow-[0_0_10px_rgba(42,161,152,0.05)]'
                          : 'bg-[var(--sol-base02)]/50 border-[var(--sol-base01)]/10 hover:bg-[var(--sol-base02)]/70'
                      }`}
                      onClick={() => setDetailResult(result)}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 h-[68px] rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={result.thumbnailUrl}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${result.videoId}/mqdefault.jpg`;
                          }}
                        />
                        {result.duration != null && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-white text-[9px] font-bold font-[family-name:var(--font-montserrat)]">
                            {formatDuration(result.duration)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--sol-base2)] text-xs font-bold leading-snug line-clamp-2 font-[family-name:var(--font-montserrat)]">
                          {result.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {result.channelAvatarUrl ? (
                            <img src={result.channelAvatarUrl} alt={result.channelName} className="w-[14px] h-[14px] rounded-full object-cover flex-shrink-0 border border-[var(--sol-base01)]/20" />
                          ) : (
                            <User size={10} className="text-[var(--sol-base01)] flex-shrink-0" />
                          )}
                          <p className="text-[var(--sol-base1)] text-[11px] truncate font-[family-name:var(--font-montserrat)]">
                            {result.channelName}
                          </p>
                        </div>
                        {result.viewCount > 0 && (
                          <p className="text-[var(--sol-base01)] text-[10px] mt-0.5 font-[family-name:var(--font-montserrat)]">
                            {formatViewCount(result.viewCount)}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0 mt-1">
                        {isSaving ? (
                          <Loader2 size={24} className="text-[var(--sol-cyan)] animate-spin" />
                        ) : isAdded ? (
                          <CheckCircle size={24} className="text-[var(--sol-cyan)]" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddVersion(result);
                            }}
                            className="p-1 rounded-full hover:bg-white/10 transition-bounce hover:scale-110 active:scale-95 cursor-pointer"
                          >
                            <PlusCircle size={24} className="text-[var(--sol-cyan)]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* ── Detail Sheet ─────────────────────────────────────────── */}
      <AnimatePresence>
        {detailResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center"
            onClick={() => setDetailResult(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-2xl bg-[var(--sol-base03)] rounded-t-3xl overflow-hidden"
              style={{ maxHeight: '85vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-[var(--sol-base01)]/30" />
              </div>

              <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                {/* Large Thumbnail */}
                <img
                  src={detailResult.thumbnailUrl}
                  alt={detailResult.title}
                  className="w-full rounded-2xl mb-6"
                />

                {/* Title */}
                <h3 className="text-[var(--sol-base3)] text-lg font-bold mb-3 font-[family-name:var(--font-montserrat)]">
                  {detailResult.title}
                </h3>

                {/* Channel */}
                <div className="flex items-center gap-2 mb-3">
                  {detailResult.channelAvatarUrl ? (
                    <img src={detailResult.channelAvatarUrl} alt={detailResult.channelName} className="w-5 h-5 rounded-full object-cover border border-[var(--sol-cyan)]/20" />
                  ) : (
                    <User size={14} className="text-[var(--sol-cyan)]" />
                  )}
                  <span className="text-[var(--sol-cyan)] text-sm font-semibold font-[family-name:var(--font-montserrat)]">
                    {detailResult.channelName}
                  </span>
                </div>

                {/* Chips */}
                <div className="flex gap-3 mb-6">
                  {detailResult.viewCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--sol-base02)] rounded-lg border border-[var(--sol-base01)]/10">
                      <Eye size={12} className="text-[var(--sol-base1)]" />
                      <span className="text-[var(--sol-base1)] text-xs font-[family-name:var(--font-montserrat)]">
                        {formatViewCount(detailResult.viewCount)}
                      </span>
                    </div>
                  )}
                  {detailResult.duration != null && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--sol-base02)] rounded-lg border border-[var(--sol-base01)]/10">
                      <Clock size={12} className="text-[var(--sol-base1)]" />
                      <span className="text-[var(--sol-base1)] text-xs font-[family-name:var(--font-montserrat)]">
                        {formatDuration(detailResult.duration)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {detailResult.description && (
                  <>
                    <h4 className="text-[var(--sol-base1)] text-sm font-bold mb-2 font-[family-name:var(--font-montserrat)]">
                      Description
                    </h4>
                    <p className="text-[var(--sol-base01)] text-sm leading-relaxed whitespace-pre-line font-[family-name:var(--font-montserrat)]">
                      {detailResult.description}
                    </p>
                  </>
                )}
              </div>

              {/* Bottom Action */}
              <div className="px-6 py-4 border-t border-[var(--sol-base01)]/10">
                <button
                  onClick={() => {
                    handleAddVersion(detailResult);
                    setDetailResult(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[var(--sol-cyan)] text-[var(--sol-base03)] font-bold text-sm tracking-wider transition-bounce hover:scale-[1.02] active:scale-95 cursor-pointer font-[family-name:var(--font-montserrat)]"
                >
                  ADD THIS VERSION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
