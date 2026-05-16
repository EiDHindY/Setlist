export const runtime = 'edge';

import { NextResponse } from 'next/server';

/**
 * Strip common suffixes that break title matching on AudioDB:
 * "(feat. X)", "(with X)", "(ft. X)", "(Remastered)", "(Radio Edit)", etc.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*\(feat\.?[^)]*\)/gi, '')
    .replace(/\s*\(ft\.?[^)]*\)/gi, '')
    .replace(/\s*\(with [^)]*\)/gi, '')
    .replace(/\s*\(remastered[^)]*\)/gi, '')
    .replace(/\s*\(radio edit[^)]*\)/gi, '')
    .replace(/\s*\(live[^)]*\)/gi, '')
    .replace(/\s*\(acoustic[^)]*\)/gi, '')
    .trim();
}

async function queryAudioDB(artist: string, title: string) {
  const url = `https://www.theaudiodb.com/api/v1/json/2/searchtrack.php?s=${encodeURIComponent(artist)}&t=${encodeURIComponent(title)}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return data.track && data.track.length > 0 ? data.track[0] : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const title = searchParams.get('title');

  if (!artist || !title) {
    return NextResponse.json({ error: 'Artist and title are required' }, { status: 400 });
  }

  try {
    // Attempt 1: full title as-is
    let track = await queryAudioDB(artist, title);

    // Attempt 2: cleaned title (strip feat, live, remaster, etc.)
    if (!track) {
      const cleaned = cleanTitle(title);
      if (cleaned && cleaned !== title) {
        track = await queryAudioDB(artist, cleaned);
      }
    }

    if (!track) {
      return NextResponse.json({ mood: null, genre: null });
    }

    return NextResponse.json({
      mood: track.strMood || null,
      genre: track.strGenre || null,
      description: track.strDescriptionEN || null,
    });
  } catch (error) {
    console.error('TheAudioDB proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from TheAudioDB' }, { status: 500 });
  }
}
