export const runtime = 'edge';

import { NextResponse } from 'next/server';

const BASE = 'https://api.getsong.co';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title  = searchParams.get('title');
  const artist = searchParams.get('artist');

  if (!title || !artist) {
    return NextResponse.json({ error: 'title and artist are required' }, { status: 400 });
  }

  const apiKey = process.env.GETSONGBPM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // ── Attempt 1: combined song + artist search ─────────────────────
    const combinedLookup = `song:${encodeURIComponent(title)} artist:${encodeURIComponent(artist)}`;
    const url1 = `${BASE}/search/?api_key=${apiKey}&type=both&lookup=${combinedLookup}&limit=5`;
    const res1 = await fetch(url1, { headers: { 'Accept': 'application/json' } });

    if (res1.ok) {
      const data1 = await res1.json();
      const results1 = Array.isArray(data1.search) ? data1.search : [];
      if (results1.length > 0) {
        return NextResponse.json(results1[0]);
      }
    }

    // ── Attempt 2: song-only search, then match by artist ────────────
    const url2 = `${BASE}/search/?api_key=${apiKey}&type=song&lookup=${encodeURIComponent(title)}&limit=10`;
    const res2 = await fetch(url2, { headers: { 'Accept': 'application/json' } });

    if (!res2.ok) {
      return NextResponse.json({ error: 'No result' }, { status: 404 });
    }

    const data2 = await res2.json();
    const results2 = Array.isArray(data2.search) ? data2.search : [];

    if (results2.length === 0) {
      return NextResponse.json({ error: 'No result' }, { status: 404 });
    }

    // Prefer an exact artist match; otherwise return first result
    const artistLower = artist.toLowerCase();
    const matched = results2.find(
      (s: { artist?: { name?: string } }) =>
        s.artist?.name?.toLowerCase().includes(artistLower) ||
        artistLower.includes(s.artist?.name?.toLowerCase() ?? '')
    );

    return NextResponse.json(matched ?? results2[0]);
  } catch (error) {
    console.error('GetSongBPM proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
