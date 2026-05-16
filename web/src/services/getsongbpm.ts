/**
 * GetSongBPM Service
 * Fetches BPM and Musical Key data from getsongbpm.com
 */

export interface SongBPMData {
  bpm: number | null;
  key: string | null;       // e.g. "Cm", "D", "F#m"
  genres: string[] | null;  // bonus: artist genres
}

/**
 * Fetch BPM and Musical Key for a song via our internal proxy.
 */
export async function fetchSongBPMData(title: string, artist: string): Promise<SongBPMData | null> {
  if (!title || !artist) return null;

  try {
    const params = new URLSearchParams({ title, artist });
    const response = await fetch(`/api/getsongbpm?${params}`);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.error) return null;

    const bpm  = data.tempo ? parseInt(data.tempo, 10) : null;
    const key  = data.key_of ?? null;
    const genres: string[] | null = Array.isArray(data.artist?.genres)
      ? data.artist.genres
      : null;

    // Sanity: ignore clearly wrong BPM values
    if (bpm !== null && (bpm < 40 || bpm > 300)) return { bpm: null, key, genres };

    return { bpm: bpm || null, key, genres };
  } catch (error) {
    console.error('🛑 GetSongBPM fetch error:', error);
    return null;
  }
}
