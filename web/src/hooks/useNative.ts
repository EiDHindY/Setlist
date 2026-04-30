'use client';

// ── NATIVE HOOKS ────────────────────────────────────────────────────
// Hooks that bridge web APIs to feel native on mobile PWA.

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── MEDIA SESSION (Lock Screen Controls) ───────────────────────────
// Shows song info + play/pause/skip on the device lock screen & notification shade.

interface MediaSessionOptions {
  title: string;
  artist: string;
  albumArt?: string;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
}

export function useMediaSession(options: MediaSessionOptions | null) {
  useEffect(() => {
    if (!options || !('mediaSession' in navigator)) return;

    const { title, artist, albumArt, isPlaying, onPlay, onPause, onStop, onNextTrack, onPreviousTrack } = options;

    // Set metadata (what shows on lock screen)
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: 'Setlist',
      artwork: albumArt
        ? [
            { src: albumArt, sizes: '96x96', type: 'image/jpeg' },
            { src: albumArt, sizes: '128x128', type: 'image/jpeg' },
            { src: albumArt, sizes: '192x192', type: 'image/jpeg' },
            { src: albumArt, sizes: '256x256', type: 'image/jpeg' },
            { src: albumArt, sizes: '384x384', type: 'image/jpeg' },
            { src: albumArt, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Register action handlers (the buttons on lock screen)
    if (onPlay) navigator.mediaSession.setActionHandler('play', onPlay);
    if (onPause) navigator.mediaSession.setActionHandler('pause', onPause);
    if (onStop) navigator.mediaSession.setActionHandler('stop', onStop);
    if (onNextTrack) navigator.mediaSession.setActionHandler('nexttrack', onNextTrack);
    if (onPreviousTrack) navigator.mediaSession.setActionHandler('previoustrack', onPreviousTrack);

    return () => {
      // Clean up handlers
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      } catch {
        // Some browsers don't support null handlers
      }
    };
  }, [options?.title, options?.artist, options?.albumArt, options?.isPlaying]);
}

// ─── SCREEN WAKE LOCK (Keep Screen On During Playback) ──────────────

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    const acquire = async () => {
      try {
        if (enabled && !wakeLockRef.current) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('🔆 Wake Lock acquired — screen will stay on');

          wakeLockRef.current.addEventListener('release', () => {
            console.log('🔅 Wake Lock released');
            wakeLockRef.current = null;
          });
        } else if (!enabled && wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch (err) {
        console.warn('Wake Lock failed:', err);
      }
    };

    acquire();

    // Re-acquire on visibility change (browser releases it when tab is hidden)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [enabled]);
}

// ─── VIBRATION (Haptic Feedback) ────────────────────────────────────

export function vibrate(pattern: number | number[] = 30) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/** Light tap feedback — for button presses */
export function hapticTap() {
  vibrate(15);
}

/** Medium feedback — for adding a version, saving a song */
export function hapticSuccess() {
  vibrate([20, 50, 20]);
}

/** Error feedback */
export function hapticError() {
  vibrate([50, 30, 50, 30, 50]);
}

// ─── INSTALL PROMPT ─────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
