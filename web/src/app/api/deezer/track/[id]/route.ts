export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackId } = await params;

  if (!trackId) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.deezer.com/track/${trackId}`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Deezer API responded with status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Only return the fields we need to keep it slim
    // Genre can be nested in genres.data array or album.genres.data
    const genreData = data.genres?.data ?? data.album?.genres?.data ?? [];
    const genre = genreData.length > 0 ? genreData[0].name : null;

    return NextResponse.json({
      bpm: data.bpm,
      isrc: data.isrc,
      id: data.id,
      title: data.title,
      artist: data.artist?.name,
      genre,
    });
  } catch (error) {
    console.error('Deezer track proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch track from Deezer' }, { status: 500 });
  }
}
