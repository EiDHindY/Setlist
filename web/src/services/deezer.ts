/**
 * Deezer Service
 * Handles fetching BPM and other metadata from Deezer.
 */

interface DeezerMetadata {
  bpm?: number;
  isrc?: string;
  genre?: string;
}

/**
 * Fetch BPM, ISRC and Genre from Deezer using a Track ID.
 */
export async function fetchDeezerMetadata(trackId: string): Promise<DeezerMetadata | null> {
  if (!trackId) return null;

  try {
    const response = await fetch(`/api/deezer/track/${trackId}`);
    if (!response.ok) return null;

    const data = await response.json();
    
    // Round BPM to nearest integer and ensure it's not 0
    const bpm = data.bpm ? Math.round(Number(data.bpm)) : undefined;
    
    return {
      bpm: bpm && bpm > 0 ? bpm : undefined,
      isrc: data.isrc || undefined,
      genre: data.genre || undefined,
    };
  } catch (error) {
    console.error('🛑 Deezer metadata fetch failed:', error);
    return null;
  }
}

/**
 * Search Deezer for a track to get its ID, then fetch metadata.
 * Useful if we don't have a Deezer ID yet.
 */
export async function searchDeezerMetadata(title: string, artist: string): Promise<DeezerMetadata | null> {
  try {
    const query = `${title} ${artist}`;
    const response = await fetch(`/api/deezer?q=${encodeURIComponent(query)}&limit=1`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;

    const track = data.data[0];
    // Some tracks in search results don't have BPM, so we fetch the full track
    return fetchDeezerMetadata(track.id.toString());
  } catch (error) {
    console.error('🛑 Deezer metadata search failed:', error);
    return null;
  }
}
