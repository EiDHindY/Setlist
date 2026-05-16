/**
 * AudioDB Service
 * Handles fetching mood, genre and other descriptive metadata.
 */

interface AudioDBMetadata {
  mood?: string;
  genre?: string;
}

/**
 * Fetch mood and genre from TheAudioDB using Artist and Title.
 */
export async function fetchMoodMetadata(title: string, artist: string): Promise<AudioDBMetadata | null> {
  if (!title || !artist) return null;

  try {
    const response = await fetch(`/api/audiodb/mood?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
    if (!response.ok) return null;

    const data = await response.json();
    
    return {
      mood: data.mood || undefined,
      genre: data.genre || undefined
    };
  } catch (error) {
    console.error('🛑 AudioDB metadata fetch failed:', error);
    return null;
  }
}
