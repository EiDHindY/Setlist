import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// We can cache this heavily since artist images rarely change
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  try {
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(name)}&type=artist&per_page=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 (https://github.com/eid-hindy/setlist)',
        'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`
      },
      next: {
        revalidate: 86400 * 7 // Cache for 7 days
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Discogs search failed' }, { status: response.status });
    }

    const data = await response.json();
    const artist = data.results?.[0];

    // Discogs returns an empty string or spacer.gif if no image is available
    if (artist && artist.thumb && !artist.thumb.includes('spacer.gif')) {
      return NextResponse.json(
        { imageUrl: artist.thumb },
        { 
          headers: {
            'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400'
          }
        }
      );
    } else {
      return NextResponse.json(
        { imageUrl: null },
        { 
          headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
          }
        }
      );
    }
  } catch (error) {
    console.error('Artist Image Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
