export const runtime = 'edge';

import { config } from '@/utils/config';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const action = searchParams.get('action') || 'search';
  const id = searchParams.get('id');
  const maxResults = searchParams.get('maxResults') || '10';

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || config.youtubeApiKey; // Fallback to config if not in env

  try {
    if (action === 'search' && q) {
      const params = new URLSearchParams({
        part: 'snippet',
        q,
        type: 'video',
        maxResults,
        key: YOUTUBE_API_KEY,
      });

      // Cache at the Edge for 24 hours
      const response = await fetch(`${config.youtubeApiUrl}/search?${params}`, {
        next: { revalidate: 86400 }
      });
      const data = await response.json();
      return Response.json(data);
    } 
    
    if (action === 'videos' && id) {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id,
        key: YOUTUBE_API_KEY,
      });

      const response = await fetch(`${config.youtubeApiUrl}/videos?${params}`, {
        next: { revalidate: 86400 }
      });
      const data = await response.json();
      return Response.json(data);
    }

    if (action === 'channels' && id) {
      const params = new URLSearchParams({
        part: 'snippet',
        id,
        key: YOUTUBE_API_KEY,
      });

      const response = await fetch(`${config.youtubeApiUrl}/channels?${params}`, {
        next: { revalidate: 86400 }
      });
      const data = await response.json();
      return Response.json(data);
    }

    return Response.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
