// ── LIBRARY SERVICE ─────────────────────────────────────────────────
// Manages the user's song collection via Next.js API routes (Supabase backend)

import type { Song, SongVersion, SearchSuggestion, YouTubeSearchResult } from '@/types/song';
import { parseSong } from '@/types/song';

const BASE_URL = `/api/library`;

/**
 * Fetches the user's library songs from the cloud.
 */
export async function fetchLibrarySongs(userId: string): Promise<Song[]> {
  try {
    const response = await fetch(`${BASE_URL}/songs/${userId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.map((json: Record<string, unknown>) => parseSong(json));
  } catch (e) {
    console.warn('🛑 Library Fetch Error:', e);
    return [];
  }
}

/**
 * Saves only the Master Song metadata to the cloud library (Decoupled Phase 1).
 */
export async function saveMasterSong(
  userId: string,
  suggestion: SearchSuggestion
): Promise<Song | null> {
  const requestData = {
    userId,
    appleTrackId: suggestion.appleTrackId,
    deezerTrackId: suggestion.deezerTrackId,
    title: suggestion.songTitle ?? suggestion.text.split(' - ')[0],
    artist: suggestion.subtitle ?? suggestion.text.split(' - ').pop(),
    albumArtUrl: suggestion.imageUrl,
    duration: suggestion.duration ?? 0,
  };

  try {
    const response = await fetch(`${BASE_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return parseSong(data);
  } catch (e) {
    console.warn('🛑 Master Song Save Error:', e);
    return null;
  }
}

/**
 * Attaches a YouTube version to a Master Song (Decoupled Phase 2).
 */
export async function saveVersion(
  userId: string,
  songId: string,
  result: YouTubeSearchResult
): Promise<boolean> {
  const requestData = {
    userId,
    songId,
    youTubeId: result.videoId,
    versionTitle: result.title,
    channelName: result.channelName,
    thumbnailUrl: result.thumbnailUrl,
    duration: result.duration ?? 0,
  };

  try {
    const response = await fetch(`${BASE_URL}/save/version`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch (e) {
    console.warn('🛑 Version Save Error:', e);
    return false;
  }
}

/**
 * Removes a song from the user's library (Soft Delete).
 */
export async function removeSongFromLibrary(
  userId: string,
  songId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/songs/${userId}/${songId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch (e) {
    console.warn('🛑 Library Remove Error:', e);
    return false;
  }
}

/**
 * Reports playback time to the server to increment global and user stats.
 */
export async function reportPlayback(
  userId: string,
  songId: string,
  seconds: number,
  incrementPlayCount: boolean = false
): Promise<boolean> {
  if (seconds <= 0) return false;
  
  try {
    const response = await fetch(`${BASE_URL}/playback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, songId, seconds, incrementPlayCount }),
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch (e) {
    console.warn('🛑 Playback Report Error:', e);
    return false;
  }
}

/**
 * Updates a song's metadata (ISRC, BPM, etc.) in the background.
 */
export async function updateSongMetadata(
  songId: string,
  metadata: { isrc?: string; bpm?: number; musicalKey?: string; moodTags?: string[] }
): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/songs/metadata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, ...metadata }),
    });

    return response.ok;
  } catch (e) {
    console.warn('🛑 Metadata Update Error:', e);
    return false;
  }
}
