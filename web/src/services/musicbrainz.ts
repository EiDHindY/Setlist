/**
 * ── MUSICBRAINZ SERVICE ──────────────────────────────────────────────
 * Fetches ISRC and other metadata from the MusicBrainz open database.
 * Rate Limit: 1 request per second.
 */

const BASE_URL = 'https://musicbrainz.org/ws/2';

interface MBRecording {
  id: string;
  score: number;
  title: string;
  isrcs?: string[];
  'artist-credit'?: Array<{ name: string }>;
  releases?: Array<{ title: string; status?: string }>;
  genres?: Array<{ name: string; count: number }>;
  tags?: Array<{ name: string; count: number }>;
}

/**
 * Searches for a recording and returns the most likely ISRC code.
 */
export async function fetchISRC(title: string, artist: string): Promise<string | null> {
  try {
    const query = `artist:"${artist}" AND recording:"${title}"`;
    const url = `${BASE_URL}/recording/?query=${encodeURIComponent(query)}&fmt=json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 ( https://github.com/eid-hindy/setlist )',
      },
    });

    if (!response.ok) {
      console.warn('🛑 MusicBrainz API Error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const recordings: MBRecording[] = data.recordings || [];

    if (recordings.length === 0) return null;

    const sorted = recordings.sort((a, b) => b.score - a.score);

    for (const rec of sorted) {
      if (rec.isrcs && rec.isrcs.length > 0) {
        return rec.isrcs[0];
      }
    }

    return null;
  } catch (e) {
    console.error('🛑 MusicBrainz Fetch Error:', e);
    return null;
  }
}

/**
 * Searches for a recording on MusicBrainz and returns the top genre.
 * Genre data lives on the artist object inside artist-credit, so we need
 * a two-step: search → MBID → lookup with inc=artist-credits+genres.
 */
export async function fetchMBGenreTags(title: string, artist: string): Promise<string | null> {
  try {
    // ── Step 1: Search for the recording to get its MBID ────────────
    const query = `artist:"${artist}" AND recording:"${title}"`;
    const searchUrl = `${BASE_URL}/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 ( https://github.com/eid-hindy/setlist )',
      },
    });

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const recordings: MBRecording[] = searchData.recordings || [];

    if (recordings.length === 0) return null;

    const sorted = recordings.sort((a, b) => b.score - a.score);
    const bestMbid = sorted[0].id;
    if (!bestMbid) return null;

    // ── Step 2: Lookup by MBID with artist-credits+genres ───────────
    // Respect MB's 1 req/sec rate limit
    await new Promise(resolve => setTimeout(resolve, 1100));

    const lookupUrl = `${BASE_URL}/recording/${bestMbid}?inc=artist-credits+genres&fmt=json`;
    const lookupResponse = await fetch(lookupUrl, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 ( https://github.com/eid-hindy/setlist )',
      },
    });

    if (!lookupResponse.ok) return null;

    const lookupData = await lookupResponse.json();

    // Genres live on the artist object inside artist-credit, not on the recording itself
    const artistCredits: Array<{
      artist?: {
        genres?: Array<{ name: string; count: number }>;
      };
    }> = lookupData['artist-credit'] ?? [];

    for (const credit of artistCredits) {
      const genres = credit.artist?.genres ?? [];
      if (genres.length > 0) {
        const top = genres.sort((a, b) => b.count - a.count)[0];
        return top.name;
      }
    }

    return null;
  } catch (e) {
    console.error('🛑 MusicBrainz Genre Fetch Error:', e);
    return null;
  }
}

/**
 * Fetches detailed credits for a recording.
 */
export async function fetchCredits(title: string, artist: string): Promise<any | null> {
  try {
    // ── Step 1: Search for the recording to get its MBID ────────────
    const query = `artist:"${artist}" AND recording:"${title}"`;
    const searchUrl = `${BASE_URL}/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=5`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 ( https://github.com/eid-hindy/setlist )',
      },
    });

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const recordings = searchData.recordings || [];

    if (recordings.length === 0) return null;

    // Filter for better matches if possible
    const bestMatch = recordings.sort((a: any, b: any) => b.score - a.score)[0];
    const mbid = bestMatch.id;

    // ── Step 2: Lookup by MBID with relations ───────────────────────
    // inc=artist-credits + artist-rels + recording-rels + work-rels + releases
    await new Promise(resolve => setTimeout(resolve, 1100)); // Rate limit

    const lookupUrl = `${BASE_URL}/recording/${mbid}?inc=artist-credits+artist-rels+recording-rels+work-rels+releases&fmt=json`;
    const lookupResponse = await fetch(lookupUrl, {
      headers: {
        'User-Agent': 'SetlistApp/1.0.0 ( https://github.com/eid-hindy/setlist )',
      },
    });

    if (!lookupResponse.ok) return null;

    const data = await lookupResponse.json();
    
    const credits = {
      production: [] as any[],
      musicians: [] as any[],
      vocals: [] as any[],
      additional: [] as any[],
      album: data.releases?.[0]?.title || 'Unknown Album',
      releaseDate: data.releases?.[0]?.date || 'Unknown Date',
      albumReleaseDate: data.releases?.[0]?.date || 'Unknown Date',
    };

    const relations = data.relations || [];

    // If there are linked works, fetch them too for composers/lyricists
    const workRelation = relations.find((rel: any) => rel.target_type === 'work');
    if (workRelation) {
      await new Promise(resolve => setTimeout(resolve, 1100));
      const workUrl = `${BASE_URL}/work/${workRelation.work.id}?inc=artist-rels&fmt=json`;
      const workResponse = await fetch(workUrl, {
        headers: { 'User-Agent': 'SetlistApp/1.0.0 ( https://github.com/eid-hindy/setlist )' },
      });
      if (workResponse.ok) {
        const workData = await workResponse.json();
        const workRels = workData.relations || [];
        relations.push(...workRels);
      }
    }

    relations.forEach((rel: any) => {
      const type = rel.type.toLowerCase();
      const name = rel.artist?.name || rel.label?.name || 'Unknown';
      const attributes = rel.attributes || [];
      const role = attributes.length > 0 ? `${rel.type} (${attributes.join(', ')})` : rel.type;

      if (type.includes('produce') || type.includes('mix') || type.includes('engineer') || type.includes('master') || type.includes('edit')) {
        // We'll filter these further in the API route, but keep them for now
        credits.production.push({ role: rel.type, name });
      } else if (type.includes('vocal') || type.includes('singer') || type.includes('lyricist') || type.includes('composer') || type.includes('writer') || type.includes('voice')) {
        credits.vocals.push({ role: rel.type, name });
      } else if (
        type.includes('performer') || 
        type.includes('instrument') || 
        attributes.some((a: string) => 
          ['guitar', 'drums', 'bass', 'piano', 'keys', 'synth', 'keyboard', 'percussion', 'violin', 'cello', 'strings', 'brass', 'trumpet', 'saxophone', 'flute', 'programming', 'synthesizer', 'organ'].includes(a.toLowerCase())
        ) ||
        ['guitar', 'drums', 'bass', 'piano', 'keys', 'synth', 'keyboard', 'percussion', 'violin', 'cello', 'strings', 'brass', 'trumpet', 'saxophone', 'flute', 'programming', 'synthesizer', 'organ'].some(instr => type.includes(instr))
      ) {
        // If it was already caught by production (e.g. Drum Editor), don't add to musicians
        const isProduction = type.includes('edit') || type.includes('mix') || type.includes('produce');
        if (!isProduction) {
          credits.musicians.push({ role, name });
        }
      } else {
        credits.additional.push({ role: rel.type, name });
      }
    });

    // Deduplicate and filter out redundant entries
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
    console.error('🛑 MusicBrainz Credits Fetch Error:', e);
    return null;
  }
}
