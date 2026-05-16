'use client';

// ── SEARCH MODAL ────────────────────────────────────────────────────
// Port of mobile/lib/screens/search_screen.dart (Step 1)
// Metadata search via iTunes + Deezer → save Master Song

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Search from 'lucide-react/dist/esm/icons/search';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Music from 'lucide-react/dist/esm/icons/music';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import type { SearchSuggestion, Song } from '@/types/song';
import { supabase } from '@/utils/supabase';
import {
  fetchCombinedSuggestions,
  extractVideoId,
  getVideoDetails,
  cleanYouTubeTitle,
} from '@/services/youtube-search';
import { saveMasterSong, saveVersion, updateSongMetadata } from '@/services/library';
import { fetchISRC, fetchMBGenreTags } from '@/services/musicbrainz';
import { fetchDeezerMetadata, searchDeezerMetadata } from '@/services/deezer';
import { fetchMoodMetadata } from '@/services/audiodb';
import { fetchSongBPMData } from '@/services/getsongbpm';
import { useHardwareBack } from '@/hooks/useHardwareBack';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongAdded: (song: Song) => void;
  initialQuery?: string;
}

export default function SearchModal({ isOpen, onClose, onSongAdded, initialQuery }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sharedYouTubeId, setSharedYouTubeId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (initialQuery) {
        setQuery(initialQuery);
        performSearch(initialQuery);
      }
    } else {
      // Reset on close
      setQuery('');
      setResults([]);
      setSuggestions([]);
      setHasSearched(false);
      setSharedYouTubeId(null);
    }
  }, [isOpen]);

  useHardwareBack(isOpen, onClose, 'search_modal');

  // ── Live Suggestions ──────────────────────────────────────────────

  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const remote = await fetchCombinedSuggestions(value);
      setSuggestions(remote);
    }, 300);
  };

  // ── Full Search ───────────────────────────────────────────────────

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    inputRef.current?.blur();

    setLoading(true);
    setHasSearched(true);
    setSuggestions([]);
    setResults([]);
    setSharedYouTubeId(null);

    let cleanQuery = searchQuery;

    // Smart Detection: Is this a direct YouTube link?
    if (searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) {
      const videoId = extractVideoId(searchQuery);
      if (videoId) {
        setSharedYouTubeId(videoId);
        const details = await getVideoDetails(videoId);
        if (details) {
          const cleanTitle = cleanYouTubeTitle(details.title);
          const hasSeparator = details.title.includes('-') || details.title.includes('|');
          if (!hasSeparator) {
            const cleanChannel = details.channelName.replace(/- Topic/i, '').trim();
            cleanQuery = cleanChannel.toLowerCase() !== 'various artists'
              ? `${cleanChannel} ${cleanTitle}`
              : cleanTitle;
          } else {
            cleanQuery = cleanTitle;
          }
        }
      }
    }

    // Step 1: Force User to Metadata Results (iTunes/Deezer)
    const metadataResults = await fetchCombinedSuggestions(cleanQuery);
    setResults(metadataResults.filter((s) => s.type === 'song'));
    setLoading(false);
  };

  // ── Handle Song Selection ─────────────────────────────────────────

  const handleSelectSong = async (suggestion: SearchSuggestion) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const savedSong = await saveMasterSong(user.id, suggestion);

    if (savedSong) {
      // BACKGROUND PHASE: Fetch ISRC and other metadata without blocking the UI
      const artist = savedSong.artist;
      const title = savedSong.title;
      const deezerId = suggestion.deezerTrackId;
      
      // Fire and forget (it will run in the background)
      (async () => {
        try {
          let metadata: { isrc?: string; bpm?: number; musicalKey?: string; moodTags?: string[] } = {};
          const tagSet = new Set<string>(); // collects mood/genre tags from all sources

          // ── Phase 0: GetSongBPM (best source – BPM + Musical Key) ────
          console.log(`🔍 [Background] Fetching GetSongBPM data for "${title}"...`);
          const bpmData = await fetchSongBPMData(title, artist);
          if (bpmData) {
            if (bpmData.bpm) { metadata.bpm = bpmData.bpm; console.log(`✅ [Background] BPM via GetSongBPM: ${bpmData.bpm}`); }
            if (bpmData.key) { metadata.musicalKey = bpmData.key; console.log(`✅ [Background] Key via GetSongBPM: ${bpmData.key}`); }
            bpmData.genres?.forEach(g => tagSet.add(g.toLowerCase().trim()));
            if (bpmData.genres?.length) console.log(`✅ [Background] Genres via GetSongBPM: ${bpmData.genres.join(', ')}`);
          }

          // ── Phase 1: Deezer (ISRC + BPM fallback + Genre) ────────────
          console.log(`🔍 [Background] Fetching Deezer metadata for "${title}" (ID: ${deezerId || 'searching...'})`);
          let deezerData = deezerId
            ? await fetchDeezerMetadata(deezerId)
            : await searchDeezerMetadata(title, artist);

          if (deezerData) {
            if (!metadata.bpm && deezerData.bpm) { metadata.bpm = deezerData.bpm; console.log(`✅ [Background] BPM via Deezer: ${metadata.bpm}`); }
            if (deezerData.isrc) { metadata.isrc = deezerData.isrc; console.log(`✅ [Background] ISRC via Deezer: ${metadata.isrc}`); }
            if (deezerData.genre) tagSet.add(deezerData.genre.toLowerCase().trim());
          }

          // ── Phase 1b: BPM fallback – if direct ID had no BPM, search by name ──
          if (!metadata.bpm && deezerId) {
            console.log(`🔍 [Background] BPM missing from track ID, trying Deezer search fallback...`);
            const fallbackData = await searchDeezerMetadata(title, artist);
            if (fallbackData?.bpm) { metadata.bpm = fallbackData.bpm; console.log(`✅ [Background] BPM via Deezer fallback: ${metadata.bpm}`); }
            if (fallbackData?.genre) tagSet.add(fallbackData.genre.toLowerCase().trim());
          }

          // ── Phase 2: MusicBrainz for ISRC (if Deezer missed it) ─────
          if (!metadata.isrc) {
            console.log(`🔍 [Background] Falling back to MusicBrainz for ISRC...`);
            const isrc = await fetchISRC(title, artist);
            if (isrc) {
              metadata.isrc = isrc;
              console.log(`✅ [Background] ISRC via MusicBrainz: ${isrc}`);
            }
          }

          // ── Phase 3a: AudioDB – ALWAYS run to collect mood + genre ───
          console.log(`🔍 [Background] Fetching AudioDB tags for "${title}"...`);
          const audioData = await fetchMoodMetadata(title, artist);
          if (audioData) {
            if (audioData.mood)  tagSet.add(audioData.mood.toLowerCase().trim());
            if (audioData.genre) tagSet.add(audioData.genre.toLowerCase().trim());
            if (audioData.mood || audioData.genre)
              console.log(`✅ [Background] Tags via AudioDB: mood=${audioData.mood}, genre=${audioData.genre}`);
          }

          // ── Phase 3b: MusicBrainz genre (only if tagSet still empty) ─
          if (tagSet.size === 0) {
            console.log(`🔍 [Background] No tags yet, trying MusicBrainz genre...`);
            const mbGenre = await fetchMBGenreTags(title, artist);
            if (mbGenre) { tagSet.add(mbGenre.toLowerCase().trim()); console.log(`✅ [Background] Genre via MusicBrainz: ${mbGenre}`); }
          }

          // Finalise tags array (filter empty strings, deduplicated by Set)
          const finalTags = Array.from(tagSet).filter(Boolean);
          if (finalTags.length > 0) {
            metadata.moodTags = finalTags;
            console.log(`🏷️ [Background] Final merged tags: [${finalTags.join(', ')}]`);
          }

          // ── Phase 4: Persist to DB ───────────────────────────────────
          if (metadata.isrc || metadata.bpm || metadata.musicalKey || metadata.moodTags) {
            console.log(`💾 [Background] Updating database for "${title}" with:`, metadata);
            const success = await updateSongMetadata(savedSong.id, metadata);
            if (success) {
              console.log(`✨ [Background] Successfully updated metadata for "${title}"`);
            } else {
              console.warn(`🛑 [Background] Database update failed for "${title}"`);
            }
          } else {
            console.log(`ℹ️ [Background] No metadata found for "${title}"`);
          }
        } catch (err) {
          console.warn('🛑 Background metadata fetch failed:', err);
        }
      })();

      // EXPRESS LANE: If we have a shared YouTube link, auto-save the version
      if (sharedYouTubeId) {
        const ytResult = await getVideoDetails(sharedYouTubeId);
        if (ytResult) {
          await saveVersion(user.id, savedSong.id, ytResult);
        }
      }

      onSongAdded(savedSong);
      onClose();
    }

    setLoading(false);
  };

  const [mountedTime] = useState(Date.now());

  // Prevent ghost clicks from immediately closing the modal
  const handleBackdropClick = useCallback(() => {
    if (Date.now() - mountedTime > 150) {
      onClose();
    }
  }, [mountedTime, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-xl mx-4 bg-[var(--sol-base03)] rounded-3xl border border-[var(--sol-base01)]/15 shadow-2xl overflow-hidden"
        style={{ maxHeight: '70vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="p-4 border-b border-[var(--sol-base01)]/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} className="text-[var(--sol-cyan)]" />
            </button>

            <div className="flex-1 relative">
              <div className="flex items-center h-12 rounded-2xl bg-[var(--sol-base02)]/60 border border-[var(--sol-cyan)]/20 px-4 gap-3 focus-within:border-[var(--sol-cyan)]/50 focus-within:shadow-[0_0_12px_rgba(42,161,152,0.1)] transition-all">
                <Search size={18} className="text-[var(--sol-cyan)] flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch(query)}
                  placeholder="Search for a song..."
                  className="flex-1 bg-transparent text-[var(--sol-base2)] text-base outline-none placeholder:text-[var(--sol-base01)]/70"
                />
                {query && (
                  <button
                    onClick={() => handleQueryChange('')}
                    className="p-1 rounded-full hover:bg-white/10 cursor-pointer"
                  >
                    <X size={16} className="text-[var(--sol-base01)]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <p className="text-center mt-2 text-[var(--sol-cyan)]/60 text-xs font-bold tracking-[3px]">
            STEP 1
          </p>
        </div>

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 120px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={40} className="text-[var(--sol-cyan)] animate-spin" />
            </div>
          ) : (
            <>
              {/* Suggestions (while typing) */}
              {suggestions.length > 0 && !hasSearched && (
                <div className="p-3">
                  <AnimatePresence>
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={`${s.appleTrackId}-${s.text}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSelectSong(s)}
                        className="w-full flex items-center gap-4 px-3 py-3 rounded-xl bg-transparent hover:bg-[var(--sol-base02)]/60 border border-transparent hover:border-[var(--sol-base01)]/10 transition-smooth cursor-pointer text-left group"
                      >
                        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--sol-cyan)]/10 shadow-sm">
                          {s.imageUrl ? (
                            <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-[var(--sol-cyan)]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--sol-base3)] text-base font-bold truncate">
                            {s.songTitle ?? s.text.split(' - ')[0]}
                          </p>
                          <p className="text-[var(--sol-base1)] text-sm truncate mt-0.5">
                            {s.subtitle ?? s.text.split(' - ').pop()}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-[var(--sol-base01)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Search Results (after Enter) */}
              {hasSearched && results.length > 0 && (
                <div className="p-3">
                  {results.map((s, i) => (
                    <motion.div
                      key={`${s.appleTrackId}-${s.text}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="mb-2"
                    >
                      <button
                        onClick={() => handleSelectSong(s)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--sol-base02)]/40 border border-[var(--sol-base01)]/10 hover:bg-[var(--sol-base02)]/70 transition-smooth cursor-pointer text-left"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--sol-cyan)]/10">
                          {s.imageUrl ? (
                            <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-[var(--sol-cyan)]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--sol-base3)] text-base font-bold truncate">
                            {s.songTitle ?? s.text.split(' - ')[0]}
                          </p>
                          <p className="text-[var(--sol-base1)] text-sm truncate">
                            {s.subtitle ?? s.text.split(' - ').pop()}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-[var(--sol-cyan)] flex-shrink-0" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty Results */}
              {hasSearched && results.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <Search size={48} className="text-[var(--sol-base01)]/30 mb-4" />
                  <p className="text-[var(--sol-base1)] text-base text-center">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}

              {/* Initial State */}
              {!hasSearched && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <Music size={48} className="text-[var(--sol-base01)]/30 mb-4" />
                  <h3 className="text-[var(--sol-base1)] text-lg font-bold mb-2 font-[family-name:var(--font-outfit)]">
                    Setlist Search
                  </h3>
                  <p className="text-[var(--sol-base01)] text-sm text-center leading-relaxed">
                    1- search for your song<br />
                    2- add versions inside of that song to make a collection
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
