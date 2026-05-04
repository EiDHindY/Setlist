export const runtime = 'edge';

import { config } from '@/utils/config';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  
  if (!q) return Response.json([]);

  const isArabic = /[\u0600-\u06FF]/.test(q);
  const country = isArabic ? 'eg' : 'us';
  const lang = isArabic ? 'ar_eg' : 'en_us';

  try {
    const params = new URLSearchParams({
      term: q,
      entity: 'song',
      limit: '15',
      country,
      lang,
    });

    // Cache the iTunes search at the Cloudflare Edge for 24 hours
    const response = await fetch(`https://itunes.apple.com/search?${params}`, {
      next: { revalidate: 86400 } 
    });

    if (!response.ok) return Response.json([]);

    const data = await response.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
