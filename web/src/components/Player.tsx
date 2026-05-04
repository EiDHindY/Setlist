'use client';

// ── YOUTUBE PLAYER ──────────────────────────────────────────────────
// Native <iframe> + YouTube IFrame API.
// Optimized to handle reparenting and playback sync.

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Maximize2, Minimize2, Music2, Loader2 } from 'lucide-react';
import { usePlayback } from '@/contexts/PlaybackContext';
import { useMediaSession, useWakeLock, hapticTap } from '@/hooks/useNative';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export default function Player() {
  const { state, stop, togglePlayPause, setPlaying, toggleExpand } = usePlayback();
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const apiReady = useRef(false);
  const creatingPlayer = useRef(false);

  const { song, version, isPlaying, isExpanded } = state;

  useHardwareBack(isExpanded, () => toggleExpand(), 'player_expanded');

  // 1. Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.YT?.Player) {
      apiReady.current = true;
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      apiReady.current = true;
    };
  }, []);

  // 2. Initialize Player when version changes
  useEffect(() => {
    if (!version || !version.youtubeVideoId) {
      playerRef.current?.destroy();
      playerRef.current = null;
      setIsReady(false);
      return;
    }

    const initPlayer = () => {
      if (creatingPlayer.current) return;
      creatingPlayer.current = true;

      // Clean up existing
      playerRef.current?.destroy();
      
      const container = document.getElementById('yt-player-root');
      if (!container) {
        creatingPlayer.current = false;
        return;
      }
      container.innerHTML = '<div id="yt-iframe-placeholder"></div>';

      playerRef.current = new YT.Player('yt-iframe-placeholder', {
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
          onReady: () => {
            setIsReady(true);
            creatingPlayer.current = false;
            if (isPlaying) playerRef.current?.playVideo();
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
            else if (event.data === YT.PlayerState.ENDED) setPlaying(false);
          },
        },
      });
    };

    if (apiReady.current) {
      initPlayer();
    } else {
      const interval = setInterval(() => {
        if (apiReady.current) {
          clearInterval(interval);
          initPlayer();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [version?.youtubeVideoId]);

  // 3. Sync Play/Pause state
  useEffect(() => {
    if (!playerRef.current || !isReady) return;
    try {
      if (isPlaying) playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    } catch (e) {
      console.warn('Player sync error:', e);
    }
  }, [isPlaying, isReady]);

  // ── NATIVE: Media Session ──────────────────────────────────────────
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
      {/* ── DRAG CONSTRAINTS ── */}
      {/* This invisible full-screen div tells the draggable player where its boundaries are */}
      <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-0" />

      {/* ── GLOBAL PLAYER CONTAINER ── */}
      {/* This div stays in the same place to prevent iframe reload, we move it with CSS */}
      <div 
        id="yt-player-root"
        className={`fixed transition-all duration-500 ease-in-out z-[60] overflow-hidden rounded-2xl shadow-2xl bg-black ${
          isExpanded 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] aspect-video max-w-4xl' 
            : 'bottom-24 left-4 w-0 h-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Expanded Backdrop ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleExpand}
            className="fixed inset-0 z-50 bg-[#002b36]/90 backdrop-blur-md flex flex-col"
          >
            <div className="p-6 flex justify-between items-center pointer-events-none">
              <div className="pointer-events-auto">
                <h2 className="text-white font-bold text-xl">{song.title}</h2>
                <p className="text-[var(--sol-cyan)]">{song.artist}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand();
                }} 
                className="p-3 bg-white/10 rounded-full text-white cursor-pointer hover:bg-white/20 hover:scale-110 active:scale-95 transition-all pointer-events-auto"
                aria-label="Collapse Player"
              >
                <Minimize2 size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mini Player Bar ── */}
      {!isExpanded && (
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.2}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          onDragStart={() => {
            isDragging.current = true;
          }}
          onDragEnd={() => {
            // Wait slightly before clearing the flag so the click event has time to be suppressed
            setTimeout(() => {
              isDragging.current = false;
            }, 100);
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={() => {
            if (!isDragging.current) {
              toggleExpand();
            }
          }}
          className="fixed bottom-6 left-4 md:left-6 right-4 md:right-auto md:w-80 z-[70] pointer-events-none"
        >
          <div 
            className="glass-heavy h-20 md:h-24 rounded-2xl md:rounded-[24px] flex items-center gap-4 p-3 shadow-2xl pointer-events-auto border border-[var(--sol-base01)]/20 cursor-grab active:cursor-grabbing hover:border-[var(--sol-cyan)]/30 transition-colors"
            style={{ background: 'rgba(7, 54, 66, 0.85)' }}
          >
            {/* Thumbnail / Visualizer */}
            <div 
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden flex-shrink-0 relative group cursor-pointer"
            >
              <img src={thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                {isPlaying ? (
                  <div className="flex gap-0.5 items-end h-4">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 12, 6, 14, 4] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                        className="w-1 bg-[var(--sol-cyan)] rounded-full"
                      />
                    ))}
                  </div>
                ) : (
                  <Play size={16} className="text-white fill-white" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 cursor-pointer flex flex-col justify-center h-full">
              <p className="text-white text-sm md:text-base font-bold truncate">{song.title}</p>
              <p className="text-[var(--sol-cyan)] text-[11px] md:text-xs truncate opacity-80 mb-1">{version.channelName || 'YouTube'}</p>
              <div className="hidden md:flex items-center gap-2 mt-1">
                 <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                    {isPlaying && (
                      <motion.div 
                        className="h-full bg-[var(--sol-cyan)]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: version.duration || 180, ease: "linear", repeat: Infinity }}
                      />
                    )}
                 </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }} 
                className="p-3 md:p-4 rounded-full hover:bg-white/10 transition-all active:scale-90"
              >
                {isPlaying ? <Pause size={24} className="text-white fill-white" /> : <Play size={24} className="text-white fill-white" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); hapticTap(); stop(); }} 
                className="p-2 md:p-3 rounded-full hover:bg-white/10 text-[var(--sol-base01)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
