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

export interface CreditsData {
  production: Array<{ role: string; name: string }>;
  musicians: Array<{ role: string; name: string }>;
  vocals: Array<{ role: string; name: string }>;
  additional: Array<{ role: string; name: string }>;
  album?: string;
  releaseDate?: string;
  albumReleaseDate?: string;
  source?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: number; // seconds
  url?: string;
  isrc?: string;
  bpm?: number;
  musicalKey?: string;
  moodTags?: string[];
  playCount?: number;
  totalPlaySeconds?: number;
  lastPlayedAt?: string;
  addedAt?: string;
  versions: SongVersion[];
  credits?: CreditsData;
  album?: string;
  masteryLevel?: number;
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
  deezerTrackId?: string;
  isOfficial: boolean;
  duration?: number; // seconds
  isMastered?: boolean;
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
    isrc: json.isrc ? String(json.isrc) : (json.ISRC ? String(json.ISRC) : undefined),
    bpm: json.bpm !== undefined ? Number(json.bpm) : (json.BPM !== undefined ? Number(json.BPM) : undefined),
    musicalKey: json.musicalKey ? String(json.musicalKey) : (json.MusicalKey ? String(json.MusicalKey) : undefined),
    moodTags: Array.isArray(json.moodTags)
      ? json.moodTags.map(String)
      : Array.isArray(json.MoodTags)
        ? json.MoodTags.map(String)
        : undefined,
    playCount: json.playCount !== undefined ? Number(json.playCount) : undefined,
    totalPlaySeconds: json.totalPlaySeconds !== undefined ? Number(json.totalPlaySeconds) : undefined,
    lastPlayedAt: json.lastPlayedAt ? String(json.lastPlayedAt) : undefined,
    addedAt: json.addedAt ? String(json.addedAt) : undefined,
    album: json.album ? String(json.album) : (json.Album ? String(json.Album) : undefined),
    masteryLevel: json.masteryLevel !== undefined ? Number(json.masteryLevel) : undefined,
    credits: json.credits as any, // Basic mapping for now
    versions,
  };
}
