import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

// ── LRCLIB & Genius Lyrics API Route ──────────────────────────────────
// Checks Database first, then LRCLIB, then falls back to Genius scraping.

const LRCLIB_BASE = 'https://lrclib.net/api';

async function fetchGeniusLyrics(title: string, artist: string) {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const searchRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!searchRes.ok) return null;
    
    const searchData = await searchRes.json();
    const hit = searchData.response.hits[0]?.result;
    if (!hit) return null;

    // Genius API doesn't give lyrics text, must scrape the URL
    const lyricsPageRes = await fetch(hit.url);
    if (!lyricsPageRes.ok) return null;
    const html = await lyricsPageRes.text();
    
    // Extract lyrics from the common Genius container pattern
    const lyricsMatch = html.match(/<div [^>]*class="Lyrics__Container[^>]*>([\s\S]*?)<\/div>/g);
    if (!lyricsMatch) return null;

    return lyricsMatch
      .map(part => part
        .replace(/<br\s*\/?>/gi, '\n') // Replace BR with newline
        .replace(/<[^>]*>/g, '') // Strip remaining tags
        .trim()
      )
      .join('\n\n')
      // Decode ALL HTML entities (named + decimal + hex)
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/^\d+\s*Contributors.*?Lyrics\n?/i, '') // Remove "7 ContributorsLevitate Lyrics"
      .replace(/\[.*?\]/g, '') // Remove [Verse], [Chorus], etc.
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
  } catch (e) {
    console.error('Genius fetch error:', e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const songId = searchParams.get('songId');
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');
  const duration = searchParams.get('duration');

  if (!title || !artist) {
    return NextResponse.json({ error: 'title and artist are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // 0. CHECK DATABASE FIRST
    if (songId) {
      const { data: dbSong } = await supabase
        .from('Songs')
        .select('PlainLyrics, SyncedLyrics')
        .eq('Id', songId)
        .single();

      if (dbSong && (dbSong.PlainLyrics || dbSong.SyncedLyrics)) {
        return NextResponse.json({
          synced: dbSong.SyncedLyrics,
          plain: dbSong.PlainLyrics,
          source: 'Database',
          matchedTitle: title,
          matchedArtist: artist,
        });
      }
    }

    let finalSynced: string | null = null;
    let finalPlain: string | null = null;
    let finalSource: string = 'None';

    // 1. TRY LRCLIB (Primary)
    const params = new URLSearchParams({ track_name: title, artist_name: artist });
    if (duration) params.set('duration', duration);

    const lrcRes = await fetch(`${LRCLIB_BASE}/get?${params.toString()}`, {
      headers: { 'User-Agent': 'Setlist App' },
      next: { revalidate: 86400 },
    });

    if (lrcRes.ok) {
      const data = await lrcRes.json();
      if (data.plainLyrics || data.syncedLyrics) {
        finalSynced = data.syncedLyrics ?? null;
        finalPlain = data.plainLyrics ?? null;
        finalSource = 'LRCLIB';
      }
    }

    // 2. FALLBACK TO GENIUS
    if (!finalPlain && !finalSynced) {
      const geniusLyrics = await fetchGeniusLyrics(title, artist);
      if (geniusLyrics) {
        finalPlain = geniusLyrics;
        finalSource = 'Genius';
      }
    }

    // 3. SAVE TO DATABASE (If we found anything and have a songId)
    if (songId && (finalPlain || finalSynced)) {
      const { error: updateError } = await supabase
        .from('Songs')
        .update({
          PlainLyrics: finalPlain,
          SyncedLyrics: finalSynced
        })
        .eq('Id', songId);
        
      if (updateError) {
        console.error('Failed to save lyrics to database:', updateError);
      }
    }

    return NextResponse.json({
      synced: finalSynced,
      plain: finalPlain,
      source: finalSource,
      matchedTitle: title,
      matchedArtist: artist,
    });

  } catch (error) {
    console.error('Lyrics fetch error:', error);
    return NextResponse.json({ synced: null, plain: null, source: 'Error' }, { status: 500 });
  }
}
