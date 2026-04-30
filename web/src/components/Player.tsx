'use client';

// ── YOUTUBE PLAYER ──────────────────────────────────────────────────
// Native <iframe> + YouTube IFrame API.
// One single player <div> that gets reparented between mini and expanded views.

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import { usePlayback } from '@/contexts/PlaybackContext';
import { useMediaSession, useWakeLock, hapticTap } from '@/hooks/useNative';

export default function Player() {
  const { state, stop, togglePlayPause, setPlaying, toggleExpand } = usePlayback();
  const playerRef = useRef<YT.Player | null>(null);
  const playerDivRef = useRef<HTMLDivElement | null>(null);
  const expandedSlotRef = useRef<HTMLDivElement>(null);
  const miniSlotRef = useRef<HTMLDivElement>(null);
  const apiReady = useRef(false);

  const { song, version, isPlaying, isExpanded } = state;

  // Load YouTube IFrame API once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.YT?.Player) { apiReady.current = true; return; }
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    const prev = (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady as (() => void) | undefined;
    (window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
      prev?.();
    };
  }, []);

  // Create persistent player div (once)
  useEffect(() => {
    if (!playerDivRef.current) {
      const div = document.createElement('div');
      div.style.width = '100%';
      div.style.height = '100%';
      playerDivRef.current = div;
    }
  }, []);

  // Reparent player div between mini and expanded slots
  useEffect(() => {
    const div = playerDivRef.current;
    if (!div || !version) return;

    const targetSlot = isExpanded ? expandedSlotRef.current : miniSlotRef.current;
    if (targetSlot && div.parentElement !== targetSlot) {
      targetSlot.appendChild(div);
    }
  }, [isExpanded, version]);

  // Create/update YT player when version changes
  useEffect(() => {
    if (!version) {
      playerRef.current?.destroy();
      playerRef.current = null;
      return;
    }

    const createPlayer = () => {
      const div = playerDivRef.current;
      if (!div) return;

      // Destroy previous player
      playerRef.current?.destroy();
      playerRef.current = null;
      div.innerHTML = '';

      // Create inner element for YT API
      const innerDiv = document.createElement('div');
      innerDiv.id = `yt-inner-${Date.now()}`;
      div.appendChild(innerDiv);

      // Place in correct slot before creating player
      const targetSlot = isExpanded ? expandedSlotRef.current : miniSlotRef.current;
      if (targetSlot && div.parentElement !== targetSlot) {
        targetSlot.appendChild(div);
      }

      playerRef.current = new YT.Player(innerDiv.id, {
        videoId: version.youtubeVideoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          controls: 1,
        },
        events: {
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
            else if (event.data === YT.PlayerState.ENDED) setPlaying(false);
          },
        },
      });
    };

    if (apiReady.current) {
      createPlayer();
    } else {
      const checkInterval = setInterval(() => {
        if (window.YT?.Player) {
          apiReady.current = true;
          clearInterval(checkInterval);
          createPlayer();
        }
      }, 200);
      return () => clearInterval(checkInterval);
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [version?.youtubeVideoId, setPlaying]);

  // Sync play/pause
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    } catch { /* Player not ready */ }
  }, [isPlaying]);

  // ── NATIVE: Media Session (Lock Screen Controls) ──────────────────
  useMediaSession(
    song && version
      ? {
          title: song.title,
          artist: song.artist,
          albumArt: song.albumArt || `https://img.youtube.com/vi/${version.youtubeVideoId}/hqdefault.jpg`,
          isPlaying,
          onPlay: () => setPlaying(true),
          onPause: () => setPlaying(false),
          onStop: stop,
        }
      : null
  );

  // ── NATIVE: Screen Wake Lock (Keep Screen On While Playing) ───────
  useWakeLock(isPlaying);

  const handleTogglePlay = useCallback(() => {
    hapticTap();
    togglePlayPause();
  }, [togglePlayPause]);

  if (!song || !version) return null;

  const thumbnailUrl = version.thumbnailUrl ||
    `https://img.youtube.com/vi/${version.youtubeVideoId}/mqdefault.jpg`;

  return (
    <>
      {/* ── Expanded Fullscreen View ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-white font-bold text-lg truncate font-[family-name:var(--font-outfit)]">
                  {song.title}
                </span>
                <span className="text-[var(--sol-cyan)] text-sm flex-shrink-0 font-[family-name:var(--font-montserrat)]">
                  {song.artist}
                </span>
              </div>
              <button
                onClick={toggleExpand}
                className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
              >
                <Minimize2 size={22} className="text-white" />
              </button>
            </div>

            {/* Player slot (expanded) */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div
                ref={expandedSlotRef}
                className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black"
              />
            </div>

            <div className="h-8 flex-shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mini Player Bar ── */}
      {!isExpanded && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40"
        >
          {/* Offscreen slot for iframe when minimized (audio keeps playing) */}
          <div
            ref={miniSlotRef}
            className="fixed -left-[9999px] w-[320px] h-[180px] overflow-hidden"
          />

          <div
            className="glass-heavy h-20 mx-4 mb-4 rounded-2xl flex items-center gap-4 px-4 shadow-[0_-4px_30px_rgba(0,0,0,0.3)]"
            style={{ borderTop: '1px solid rgba(42, 161, 152, 0.3)' }}
          >
            {/* Thumbnail */}
            <div
              className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer transition-bounce hover:scale-105"
              onClick={toggleExpand}
            >
              <img src={thumbnailUrl} alt={version.title} className="w-full h-full object-cover" />
            </div>

            {/* Song info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={toggleExpand}>
              <p className="text-[var(--sol-base3)] text-sm font-bold truncate font-[family-name:var(--font-montserrat)]">
                {song.title}
              </p>
              <p className="text-[var(--sol-cyan)] text-xs truncate font-[family-name:var(--font-montserrat)]">
                {version.title}
              </p>
            </div>

            {/* Expand */}
            <button onClick={toggleExpand} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
              <Maximize2 size={18} className="text-[var(--sol-base1)]" />
            </button>

            {/* Play/Pause */}
            <button onClick={handleTogglePlay} className="p-2 rounded-full hover:bg-white/10 transition-bounce hover:scale-110 active:scale-95 cursor-pointer">
              {isPlaying
                ? <Pause size={24} className="text-[var(--sol-base3)]" fill="currentColor" />
                : <Play size={24} className="text-[var(--sol-base3)]" fill="currentColor" />
              }
            </button>

            {/* Close */}
            <button onClick={() => { hapticTap(); stop(); }} className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
              <X size={18} className="text-[var(--sol-base01)]" />
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
