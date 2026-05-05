import { NextRequest, NextResponse } from 'next/server';

// ── LRCLIB Lyrics API Route ──────────────────────────────────────────
// Queries LRCLIB for synced or plain lyrics.
// Falls back gracefully: syncedLyrics → plainLyrics → null

const LRCLIB_BASE = 'https://lrclib.net/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');
  const duration = searchParams.get('duration'); // optional, improves match accuracy

  if (!title || !artist) {
    return NextResponse.json({ error: 'title and artist are required' }, { status: 400 });
  }

  try {
    // Build LRCLIB query URL
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    if (duration) params.set('duration', duration);

    const url = `${LRCLIB_BASE}/get?${params.toString()}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Setlist App (https://github.com/setlist)' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (res.status === 404) {
      // LRCLIB returns 404 if not found — try a fuzzy search
      const searchUrl = `${LRCLIB_BASE}/search?${params.toString()}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Setlist App (https://github.com/setlist)' },
      });

      if (!searchRes.ok) {
        return NextResponse.json({ synced: null, plain: null, source: 'not_found' });
      }

      const searchResults = await searchRes.json();
      if (!searchResults || searchResults.length === 0) {
        return NextResponse.json({ synced: null, plain: null, source: 'not_found' });
      }

      // Take the best match from the list
      const best = searchResults[0];
      return NextResponse.json({
        synced: best.syncedLyrics ?? null,
        plain: best.plainLyrics ?? null,
        source: 'lrclib_search',
        matchedTitle: best.trackName,
        matchedArtist: best.artistName,
      });
    }

    if (!res.ok) {
      throw new Error(`LRCLIB returned ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json({
      synced: data.syncedLyrics ?? null,
      plain: data.plainLyrics ?? null,
      source: 'lrclib_exact',
      matchedTitle: data.trackName,
      matchedArtist: data.artistName,
    });

  } catch (error) {
    console.error('Lyrics fetch error:', error);
    return NextResponse.json({ synced: null, plain: null, source: 'error' }, { status: 500 });
  }
}
