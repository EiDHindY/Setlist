'use client';

// ── YOUTUBE PLAYER ──────────────────────────────────────────────────
// Native <iframe> + YouTube IFrame API.
// Optimized to handle reparenting and playback sync.

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import X from 'lucide-react/dist/esm/icons/x';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2';
import Music2 from 'lucide-react/dist/esm/icons/music-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import { usePlayback } from '@/contexts/PlaybackContext';
import { useMediaSession, useWakeLock, hapticTap } from '@/hooks/useNative';
import { useHardwareBack } from '@/hooks/useHardwareBack';

const formatDuration = (seconds?: number) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

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

  // ── Lyrics State ────────────────────────────────────────────────────
  const [lyricsData, setLyricsData] = useState<{ plain: string | null; source: string } | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [activePlayerTab, setActivePlayerTab] = useState<'lyrics' | 'upnext' | 'versions'>('lyrics');

  useHardwareBack(isExpanded, () => toggleExpand(), 'player_expanded');

  // ── Fetch lyrics when player opens or song changes ────────────────
  useEffect(() => {
    if (!isExpanded || !song) return;
    setLyricsData(null);
    setLyricsLoading(true);

    const params = new URLSearchParams({ title: song.title, artist: song.artist });
    if (version?.duration) params.set('duration', String(version.duration));

    fetch(`/api/lyrics?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLyricsData({ plain: data.plain ?? null, source: data.source ?? 'Unknown' });
      })
      .catch(() => setLyricsData({ plain: null, source: 'Error' }))
      .finally(() => setLyricsLoading(false));
  }, [isExpanded, song?.title, song?.artist]);

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

  const [bounds, setBounds] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const dragContainerRef = useRef<HTMLDivElement>(null);

  // Dynamically calculate drag boundaries based on the element's current size and position
  useEffect(() => {
    const updateBounds = () => {
      if (!dragContainerRef.current) return;
      const rect = dragContainerRef.current.getBoundingClientRect();
      const padding = 24; // Keep 24px away from screen edges
      
      setBounds({
        top: -(rect.top - padding),
        bottom: window.innerHeight - rect.bottom - padding > 0 ? window.innerHeight - rect.bottom - padding : 0,
        left: -(rect.left - padding),
        right: window.innerWidth - rect.right - padding > 0 ? window.innerWidth - rect.right - padding : 0,
      });
    };

    updateBounds();
    // Re-calculate on resize or when it expands/collapses
    window.addEventListener('resize', updateBounds);
    const timeout = setTimeout(updateBounds, 100); // Give it a moment to render
    
    return () => {
      window.removeEventListener('resize', updateBounds);
      clearTimeout(timeout);
    };
  }, [isExpanded, song]);

  if (!song || !version) return null;

  const thumbnailUrl = version.thumbnailUrl ||
    `https://img.youtube.com/vi/${version.youtubeVideoId}/mqdefault.jpg`;

  return (
    <>
      {/* ── GLOBAL PLAYER CONTAINER ── */}
      {/* This div stays in the same place to prevent iframe reload, we move it with CSS */}
      <div 
        id="yt-player-root"
        className={`fixed transition-all duration-500 ease-in-out z-[60] overflow-hidden bg-black ${
          isExpanded 
            ? 'top-0 left-0 w-full aspect-video rounded-b-2xl md:top-12 md:left-1/2 md:-translate-x-1/2 md:w-[90vw] md:max-w-4xl md:rounded-2xl md:shadow-2xl' 
            : 'bottom-24 left-4 w-0 h-0 opacity-0 pointer-events-none rounded-2xl'
        }`}
      />

      {/* ── Expanded Backdrop & UI (Option 3 Video-First) ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-50 bg-[var(--sol-base03)] flex flex-col pointer-events-auto"
          >
            {/* Spacer for the video on mobile */}
            <div className="w-full aspect-video flex-shrink-0 md:hidden" />
            {/* Spacer for desktop */}
            <div className="hidden md:block w-full h-[50vh] flex-shrink-0" />

            {/* Collapse Button (Floating above video) */}
            <button 
               onClick={(e) => { e.stopPropagation(); toggleExpand(); }} 
               className="absolute top-4 left-4 z-[70] w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-black/70 hover:scale-110 active:scale-95 transition-all"
               aria-label="Collapse Player"
            >
               <ChevronDown size={24} />
            </button>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-6 pb-32">
               {/* Metadata */}
               <div className="mb-6 flex justify-between items-start">
                 <div>
                   <h1 className="text-white text-xl md:text-3xl font-bold mb-1 font-[family-name:var(--font-montserrat)] leading-tight">{song.title}</h1>
                   <p className="text-[var(--sol-cyan)] text-sm md:text-lg font-[family-name:var(--font-montserrat)]">{song.artist}</p>
                 </div>
               </div>

               {/* Compact Controls */}
               <div className="flex items-center gap-4 mb-8 bg-[var(--sol-base02)]/50 backdrop-blur-sm p-4 rounded-2xl border border-[var(--sol-base01)]/20 shadow-lg">
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }} 
                   className="w-14 h-14 bg-[var(--sol-cyan)] rounded-full flex items-center justify-center text-[var(--sol-base03)] text-xl shadow-[0_0_15px_rgba(42,161,152,0.4)] transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                 >
                   {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
                 </button>
                 <div className="flex-1 min-w-0">
                    <div className="h-1.5 w-full bg-black/40 rounded-full mb-2 overflow-hidden relative">
                       {isPlaying && (
                         <motion.div 
                           className="absolute top-0 left-0 h-full bg-[var(--sol-cyan)]"
                           initial={{ width: "0%" }}
                           animate={{ width: "100%" }}
                           transition={{ duration: version.duration || 180, ease: "linear", repeat: Infinity }}
                         />
                       )}
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--sol-base01)] font-mono font-medium tracking-wide">
                       <span>0:00</span>
                       <span>{formatDuration(version.duration)}</span>
                    </div>
                 </div>
               </div>

               {/* Tabs */}
               <div className="flex gap-6 border-b border-[var(--sol-base01)]/20 mb-6 relative">
                 {(['lyrics', 'upnext', 'versions'] as const).map((tab) => (
                   <button
                     key={tab}
                     onClick={() => setActivePlayerTab(tab)}
                     className={`pb-3 text-xs md:text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)] relative transition-colors ${
                       activePlayerTab === tab
                         ? 'text-[var(--sol-cyan)]'
                         : 'text-[var(--sol-base01)] hover:text-white'
                     }`}
                   >
                     {tab === 'lyrics' ? 'LYRICS' : tab === 'upnext' ? 'UP NEXT' : 'VERSIONS'}
                     {activePlayerTab === tab && (
                       <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[var(--sol-cyan)]" />
                     )}
                   </button>
                 ))}
               </div>

               {/* Tab Content */}
               {activePlayerTab === 'lyrics' && (
                 <div className="pb-20">
                   {lyricsLoading && (
                     <div className="flex flex-col items-center justify-center py-20 gap-4">
                       <div className="w-8 h-8 border-2 border-[var(--sol-cyan)] border-t-transparent rounded-full animate-spin" />
                       <p className="text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">Finding lyrics...</p>
                     </div>
                   )}

                   {!lyricsLoading && !lyricsData?.plain && (
                     <div className="flex flex-col items-center justify-center py-20 gap-3">
                       <p className="text-[var(--sol-base01)] text-3xl">🎵</p>
                       <p className="text-[var(--sol-base01)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">NO LYRICS FOUND</p>
                       <p className="text-[var(--sol-base01)]/60 text-xs font-[family-name:var(--font-montserrat)] text-center max-w-[220px]">
                         Couldn't find lyrics for this track on LRCLIB
                       </p>
                     </div>
                   )}

                   {!lyricsLoading && lyricsData?.plain && (
                     <div className="space-y-1 pt-2">
                       {lyricsData.plain.split('\n').map((line, i) => (
                         <p
                           key={i}
                           className={`font-[family-name:var(--font-montserrat)] leading-relaxed transition-colors ${
                             line.trim() === ''
                               ? 'h-4'
                               : 'text-white/60 text-lg md:text-2xl font-medium hover:text-white/90'
                           }`}
                         >
                           {line || '\u00A0'}
                         </p>
                       ))}
                       <p className="text-[var(--sol-base01)]/40 text-xs italic mt-12 text-center font-[family-name:var(--font-outfit)]">
                         Lyrics via {lyricsData.source}
                       </p>
                     </div>
                   )}
                 </div>
               )}

               {activePlayerTab !== 'lyrics' && (
                 <div className="flex flex-col items-center justify-center py-20 gap-3">
                   <p className="text-[var(--sol-base01)] text-sm font-bold tracking-[2px] font-[family-name:var(--font-outfit)]">
                     {activePlayerTab === 'upnext' ? 'UP NEXT' : 'VERSIONS'} COMING SOON
                   </p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mini Player Bar ── */}
      {!isExpanded && (
        <motion.div
          ref={dragContainerRef}
          drag
          dragConstraints={bounds}
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
