// ── YOUTUBE SEARCH SERVICE ──────────────────────────────────────────
// Port of mobile/lib/services/youtube_search_service.dart
// Combines iTunes/Deezer metadata search with YouTube Data API v3

import { config } from '@/utils/config';
import type { SearchSuggestion, YouTubeSearchResult } from '@/types/song';

// ── MUSIC METADATA (iTunes + Deezer) ────────────────────────────────

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Fetch song suggestions from iTunes Search API.
 */
async function fetchITunesSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (query.trim().length < 2) return [];

  const useArabic = isArabic(query);
  const country = useArabic ? 'eg' : 'us';
  const lang = useArabic ? 'ar_eg' : 'en_us';

  try {
    const params = new URLSearchParams({
      term: query,
      entity: 'song',
      limit: '15',
      country,
      lang,
    });

    const response = await fetch(`https://itunes.apple.com/search?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.results as Record<string, unknown>[];

    return results
      .filter((item) => item.wrapperType === 'track')
      .map((item): SearchSuggestion => ({
        text: `${item.trackName} - ${item.artistName}`,
        type: 'song',
        subtitle: String(item.artistName),
        imageUrl: item.artworkUrl100 ? String(item.artworkUrl100) : undefined,
        songTitle: item.trackName ? String(item.trackName) : undefined,
        appleTrackId: item.trackId?.toString(),
        isOfficial: true,
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch song suggestions from Deezer API.
 */
async function fetchDeezerSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (query.trim().length < 2) return [];

  try {
    const params = new URLSearchParams({ q: query, limit: '15' });
    const response = await fetch(`https://api.deezer.com/search?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.data) return [];

    return (data.data as Record<string, unknown>[]).map((item): SearchSuggestion => {
      const artist = item.artist as Record<string, unknown> | null;
      const artistName = artist?.name ? String(artist.name) : 'Unknown Artist';
      const album = item.album as Record<string, unknown> | null;
      const artworkUrl = album?.cover_medium ? String(album.cover_medium) : undefined;

      return {
        text: `${item.title} - ${artistName}`,
        type: 'song',
        subtitle: artistName,
        imageUrl: artworkUrl,
        songTitle: item.title ? String(item.title) : undefined,
        appleTrackId: `dz_${item.id}`,
        isOfficial: true,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch combined suggestions from both iTunes and Deezer, interleaved and deduped.
 */
export async function fetchCombinedSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];

  const [itunes, deezer] = await Promise.all([
    fetchITunesSuggestions(query),
    fetchDeezerSuggestions(query),
  ]);

  // Interleave results
  const combined: SearchSuggestion[] = [];
  const maxLength = Math.max(itunes.length, deezer.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < deezer.length) combined.push(deezer[i]);
    if (i < itunes.length) combined.push(itunes[i]);
  }

  // Deduplicate by text
  const seen = new Map<string, SearchSuggestion>();
  for (const s of combined) {
    const key = s.text.toLowerCase();
    if (!seen.has(key)) seen.set(key, s);
  }

  return Array.from(seen.values());
}

// ── YOUTUBE DATA API v3 ─────────────────────────────────────────────

function parseIsoDuration(iso: string): number {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Search YouTube for videos matching a query.
 */
export async function searchYouTube(
  query: string,
  maxResults = 10
): Promise<YouTubeSearchResult[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(maxResults),
    key: config.youtubeApiKey,
  });

  try {
    const response = await fetch(`${config.youtubeApiUrl}/search?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    const items = data.items as Record<string, unknown>[];
    if (!items?.length) return [];

    // Fetch durations in bulk
    const videoIds = items.map((item) => {
      const id = item.id as Record<string, string>;
      return id.videoId;
    });
    const durations = await getVideoDurations(videoIds);

    return items.map((item): YouTubeSearchResult => {
      const id = item.id as Record<string, string>;
      const snippet = item.snippet as Record<string, unknown>;
      const thumbnails = snippet.thumbnails as Record<string, Record<string, string>>;
      const videoId = id.videoId;

      return {
        videoId,
        title: String(snippet.title),
        channelName: String(snippet.channelTitle),
        channelId: snippet.channelId ? String(snippet.channelId) : undefined,
        thumbnailUrl: thumbnails?.high?.url ?? thumbnails?.default?.url ?? '',
        duration: durations[videoId],
        viewCount: 0, // YouTube search API v3 doesn't return views directly
        isOfficial: false,
      };
    });
  } catch (e) {
    console.error('🛑 YouTube Search Error:', e);
    return [];
  }
}

/**
 * Get video details by ID (for paste-a-link flow).
 */
export async function getVideoDetails(videoId: string): Promise<YouTubeSearchResult | null> {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoId,
    key: config.youtubeApiKey,
  });

  try {
    const response = await fetch(`${config.youtubeApiUrl}/videos?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    const items = data.items as Record<string, unknown>[];
    if (!items?.length) return null;

    const item = items[0];
    const snippet = item.snippet as Record<string, unknown>;
    const contentDetails = item.contentDetails as Record<string, string>;
    const statistics = item.statistics as Record<string, string> | undefined;
    const thumbnails = snippet.thumbnails as Record<string, Record<string, string>>;

    return {
      videoId,
      title: String(snippet.title),
      channelName: String(snippet.channelTitle),
      channelId: snippet.channelId ? String(snippet.channelId) : undefined,
      thumbnailUrl: thumbnails?.high?.url ?? thumbnails?.default?.url ?? '',
      duration: parseIsoDuration(contentDetails.duration),
      viewCount: statistics ? parseInt(statistics.viewCount || '0', 10) : 0,
      isOfficial: false,
      description: snippet.description ? String(snippet.description) : undefined,
    };
  } catch (e) {
    console.error('🛑 Video Details Error:', e);
    return null;
  }
}

/**
 * Bulk fetch video durations.
 */
async function getVideoDurations(videoIds: string[]): Promise<Record<string, number>> {
  if (!videoIds.length) return {};

  const params = new URLSearchParams({
    part: 'contentDetails',
    id: videoIds.join(','),
    key: config.youtubeApiKey,
  });

  try {
    const response = await fetch(`${config.youtubeApiUrl}/videos?${params}`);
    if (!response.ok) return {};

    const data = await response.json();
    const items = data.items as Record<string, unknown>[];
    const durations: Record<string, number> = {};

    for (const item of items) {
      const id = String(item.id);
      const contentDetails = item.contentDetails as Record<string, string>;
      durations[id] = parseIsoDuration(contentDetails.duration);
    }

    return durations;
  } catch {
    return {};
  }
}

/**
 * Extract a YouTube video ID from a URL.
 */
export function extractVideoId(url: string): string | null {
  // Standard youtube.com/watch?v=ID
  const watchMatch = /[?&]v=([a-zA-Z0-9_-]{11})/.exec(url);
  if (watchMatch) return watchMatch[1];

  // Short youtu.be/ID
  const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (shortMatch) return shortMatch[1];

  // Embed youtube.com/embed/ID
  const embedMatch = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Clean a YouTube title for search (remove [Official Video], (Live), etc.)
 */
export function cleanYouTubeTitle(title: string): string {
  let cleaned = title;
  // Remove bracketed info
  cleaned = cleaned.replace(/\[.*?\]/g, '');
  cleaned = cleaned.replace(/\(.*?\)/g, '');
  // Common promotional junk
  const terms = ['official video', 'music video', 'official audio', 'audio',
    'lyrics', 'lyric video', 'hq', 'hd', '4k', 'live', 'topic'];
  for (const term of terms) {
    cleaned = cleaned.replace(new RegExp(`\\b${term}\\b`, 'gi'), '');
  }
  // Clean extra spaces and punctuation
  cleaned = cleaned.replace(/[-|:_]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}
