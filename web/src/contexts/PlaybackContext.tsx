'use client';

// ── PLAYBACK CONTEXT ────────────────────────────────────────────────
// Replaces mobile/lib/services/playback_service.dart
// React Context + useReducer replaces StreamController.broadcast()

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Song, SongVersion, PlaybackState } from '@/types/song';

// ── State ───────────────────────────────────────────────────────────

const initialState: PlaybackState = {
  song: null,
  version: null,
  isPlaying: false,
  isExpanded: false,
};

// ── Actions ─────────────────────────────────────────────────────────

type PlaybackAction =
  | { type: 'PLAY'; song: Song; version: SongVersion }
  | { type: 'STOP' }
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'TOGGLE_EXPAND' };

function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        song: action.song,
        version: action.version,
        isPlaying: true,
        isExpanded: false,
      };
    case 'STOP':
      return initialState;
    case 'TOGGLE_PLAY_PAUSE':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying };
    case 'TOGGLE_EXPAND':
      return { ...state, isExpanded: !state.isExpanded };
    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────────────

interface PlaybackContextValue {
  state: PlaybackState;
  play: (song: Song, version: SongVersion) => void;
  stop: () => void;
  togglePlayPause: () => void;
  setPlaying: (isPlaying: boolean) => void;
  toggleExpand: () => void;
}

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playbackReducer, initialState);

  const play = useCallback((song: Song, version: SongVersion) => {
    // If same version, toggle play/pause
    if (state.version?.youtubeVideoId === version.youtubeVideoId) {
      dispatch({ type: 'TOGGLE_PLAY_PAUSE' });
      return;
    }
    dispatch({ type: 'PLAY', song, version });
  }, [state.version?.youtubeVideoId]);

  const stop = useCallback(() => dispatch({ type: 'STOP' }), []);
  const togglePlayPause = useCallback(() => dispatch({ type: 'TOGGLE_PLAY_PAUSE' }), []);
  const setPlaying = useCallback((isPlaying: boolean) => dispatch({ type: 'SET_PLAYING', isPlaying }), []);
  const toggleExpand = useCallback(() => dispatch({ type: 'TOGGLE_EXPAND' }), []);

  return (
    <PlaybackContext.Provider value={{ state, play, stop, togglePlayPause, setPlaying, toggleExpand }}>
      {children}
    </PlaybackContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────

export function usePlayback(): PlaybackContextValue {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
