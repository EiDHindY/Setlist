/**
 * ── GENIUS SERVICE ───────────────────────────────────────────────────
 * Fetches credits from Genius. 
 * Excellent for Producers, Writers, and sometimes specific Performers.
 */

const BASE_URL = 'https://api.genius.com';

interface GeniusCredit {
  role: string;
  name: string;
}

export async function fetchGeniusCredits(title: string, artist: string): Promise<any | null> {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) return null;

  try {
    // ── Step 1: Search for the song ──────────────────────────────────
    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const hit = searchData.response.hits[0]?.result;

    if (!hit) return null;

    // ── Step 2: Fetch detailed song info ─────────────────────────────
    const songUrl = `${BASE_URL}/songs/${hit.id}`;
    const songRes = await fetch(songUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!songRes.ok) return null;
    const songData = await songRes.json();
    const song = songData.response.song;

    const credits = {
      production: [] as GeniusCredit[],
      musicians: [] as GeniusCredit[],
      vocals: [] as GeniusCredit[],
      additional: [] as GeniusCredit[],
      album: song.album?.name || null,
      releaseDate: song.release_date || null,
    };

    // 1. Producers
    if (song.producer_artists) {
      song.producer_artists.forEach((a: any) => {
        credits.production.push({ role: 'Producer', name: a.name });
      });
    }

    // 2. Writers
    if (song.writer_artists) {
      song.writer_artists.forEach((a: any) => {
        credits.vocals.push({ role: 'Writer', name: a.name });
      });
    }

    // 3. Featured Artists
    if (song.featured_artists) {
      song.featured_artists.forEach((a: any) => {
        credits.vocals.push({ role: 'Featured Artist', name: a.name });
      });
    }

    // 4. Custom Performances (Where the gold is)
    if (song.custom_performances) {
      song.custom_performances.forEach((perf: any) => {
        const label = perf.label; // e.g. "Guitar", "Backing Vocals"
        const artists = perf.artists || [];
        
        artists.forEach((a: any) => {
          const item = { role: label, name: a.name };
          const lowLabel = label.toLowerCase();

          if (lowLabel.includes('produce') || lowLabel.includes('mix') || lowLabel.includes('engineer') || lowLabel.includes('master') || lowLabel.includes('edit')) {
            credits.production.push(item);
          } else if (lowLabel.includes('vocal') || lowLabel.includes('singer') || lowLabel.includes('voice') || lowLabel.includes('lyricist') || lowLabel.includes('composer') || lowLabel.includes('writer')) {
            credits.vocals.push(item);
          } else if (lowLabel.includes('guitar') || lowLabel.includes('drum') || lowLabel.includes('bass') || lowLabel.includes('piano') || lowLabel.includes('keys') || lowLabel.includes('synth') || lowLabel.includes('percussion') || lowLabel.includes('keyboard') || lowLabel.includes('programming')) {
            credits.musicians.push(item);
          } else {
            credits.additional.push(item);
          }
        });
      });
    }

    return credits;
  } catch (error) {
    console.error('🛑 Genius Credits Fetch Error:', error);
    return null;
  }
}
