/**
 * ── DISCOGS SERVICE ──────────────────────────────────────────────────
 * Fallback service for fetching credits when MusicBrainz fails.
 * Focuses on Album-level credits as per-track data is rare on Discogs.
 */

const BASE_URL = 'https://api.discogs.com';

export async function fetchDiscogsCredits(title: string, artist: string): Promise<any | null> {
  try {
    // ── Step 1: Search for the Release ──────────────────────────────
    // We search for both artist and title to get the most relevant release
    const query = encodeURIComponent(`${artist} ${title}`);
    const searchUrl = `${BASE_URL}/database/search?q=${query}&type=release&per_page=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 (https://github.com/eid-hindy/setlist)',
        'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`
      },
    });

    if (!response.ok) {
      console.warn('🛑 Discogs Search Error:', response.statusText);
      return null;
    }

    const searchData = await response.json();
    const release = searchData.results?.[0];

    if (!release) return null;

    // ── Step 2: Fetch Release Details ───────────────────────────────
    const releaseUrl = `${BASE_URL}/releases/${release.id}`;
    const releaseResponse = await fetch(releaseUrl, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 (https://github.com/eid-hindy/setlist)',
        'Authorization': `Discogs key=${process.env.DISCOGS_CONSUMER_KEY}, secret=${process.env.DISCOGS_CONSUMER_SECRET}`
      },
    });

    if (!releaseResponse.ok) return null;

    const data = await releaseResponse.json();

    const credits = {
      production: [] as any[],
      musicians: [] as any[],
      vocals: [] as any[],
      additional: [] as any[],
      album: data.title || 'Unknown Album',
      releaseDate: data.released || 'Unknown Date',
      albumReleaseDate: data.released || 'Unknown Date',
      source: 'Discogs (Album-level)',
    };

    // Discogs has "extraartists" for credits
    const extraArtists = data.extraartists || [];
    
    extraArtists.forEach((art: any) => {
      const role = art.role?.toLowerCase() || '';
      const name = art.name || 'Unknown';

      const creditItem = { role: art.role, name };

      if (role.includes('produce') || role.includes('mix') || role.includes('engineer') || role.includes('master') || role.includes('edit')) {
        credits.production.push(creditItem);
      } else if (role.includes('vocal') || role.includes('singer') || role.includes('lyrics') || role.includes('written') || role.includes('compose') || role.includes('voice') || role.includes('lyricist')) {
        credits.vocals.push(creditItem);
      } else if (
        role.includes('guitar') || role.includes('drum') || role.includes('bass') || role.includes('piano') || role.includes('performer') || role.includes('play') ||
        role.includes('synth') || role.includes('keyboard') || role.includes('percussion') || role.includes('violin') || role.includes('strings') || role.includes('brass') || role.includes('horn') || role.includes('programming')
      ) {
        // Avoid adding editors/mixers to musicians even if they match instruments
        const isProduction = role.includes('edit') || role.includes('mix') || role.includes('produce');
        if (!isProduction) {
          credits.musicians.push(creditItem);
        }
      } else {
        credits.additional.push(creditItem);
      }
    });

    // Deduplicate within categories
    const dedup = (arr: any[]) => {
      const seen = new Set();
      return arr.filter(item => {
        const key = `${item.role}-${item.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    credits.production = dedup(credits.production);
    credits.musicians = dedup(credits.musicians);
    credits.vocals = dedup(credits.vocals);
    credits.additional = dedup(credits.additional);

    return credits;
  } catch (e) {
    console.error('🛑 Discogs Fetch Error:', e);
    return null;
  }
}
