// ── SONG TYPES ─────────────────────────────────────────────────────
// Direct port from mobile/lib/models/song_model.dart

export interface SongVersion {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelName?: string;
  thumbnailUrl?: string;
  duration: number; // seconds
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number; // seconds
  url?: string;
  versions: SongVersion[];
}

// ── SEARCH TYPES ───────────────────────────────────────────────────
// Direct port from mobile/lib/services/youtube_search_service.dart

export type SuggestionType = 'artist' | 'song' | 'history' | 'global';

export interface SearchSuggestion {
  text: string;
  type: SuggestionType;
  subtitle?: string;
  imageUrl?: string;
  songTitle?: string;
  appleTrackId?: string;
  isOfficial: boolean;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelName: string;
  channelId?: string;
  channelAvatarUrl?: string;
  thumbnailUrl: string;
  duration?: number; // seconds
  viewCount: number;
  isOfficial: boolean;
  description?: string;
}

// ── PLAYBACK TYPES ─────────────────────────────────────────────────

export interface PlaybackState {
  song: Song | null;
  version: SongVersion | null;
  isPlaying: boolean;
  isExpanded: boolean;
}

// ── HELPERS ────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatViewCount(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

/** Parse a SongVersion from the backend JSON shape */
export function parseSongVersion(json: Record<string, unknown>): SongVersion {
  return {
    id: String(json.id ?? ''),
    youtubeVideoId: String(json.youTubeId ?? ''),
    title: String(json.title ?? 'Unknown Version'),
    channelName: json.channelName ? String(json.channelName) : undefined,
    thumbnailUrl: json.thumbnailUrl ? String(json.thumbnailUrl) : undefined,
    duration: Number(json.duration ?? 0),
  };
}

/** Parse a Song from the backend JSON shape */
export function parseSong(json: Record<string, unknown>): Song {
  const versions = Array.isArray(json.versions)
    ? json.versions.map((v: Record<string, unknown>) => parseSongVersion(v))
    : [];

  return {
    id: String(json.id ?? ''),
    title: String(json.title ?? 'Unknown Title'),
    artist: String(json.artist ?? 'Unknown Artist'),
    albumArt: String(json.albumArtUrl ?? json.album_art ?? ''),
    duration: Number(json.duration ?? 0),
    url: json.url ? String(json.url) : undefined,
    versions,
  };
}
