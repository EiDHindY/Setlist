// ── APP CONFIG ──────────────────────────────────────────────────────
// Replaces mobile/lib/config/app_config.dart
// All values come from .env.local (already configured)

export const config = {
  /** Base URL for the C# API backend */
  get apiUrl() {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5169';
    if (typeof window !== 'undefined' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', window.location.hostname);
    }
    return envUrl;
  },

  /** Supabase project URL */
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,

  /** Supabase anon key */
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

  /** YouTube Data API v3 key (same as Flutter OfficialSearchService) */
  youtubeApiKey: 'AIzaSyACNXBBh1kBcxxYKV4R7YkIY1ulY_GVGBw',

  /** YouTube Data API base URL */
  youtubeApiUrl: 'https://www.googleapis.com/youtube/v3',
} as const;
