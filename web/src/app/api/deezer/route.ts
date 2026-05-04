export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '15';

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({ q: query, limit });
    // Proxy the request to Deezer API
    const response = await fetch(`https://api.deezer.com/search?${params}`, {
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
    
    // Set CORS headers so the client can access it if needed (though Next.js API routes on the same origin don't strictly need this for same-origin requests)
    return NextResponse.json(data);
  } catch (error) {
    console.error('Deezer proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Deezer' }, { status: 500 });
  }
}
