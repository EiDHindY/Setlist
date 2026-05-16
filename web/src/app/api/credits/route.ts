import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { fetchCredits } from '@/services/musicbrainz';
import { fetchDiscogsCredits } from '@/services/discogs';
import { fetchGeniusCredits } from '@/services/genius';

export const runtime = 'edge';

// ── MUSICBRAINZ CREDITS API ROUTE ─────────────────────────────────────
// Checks Database (SongCredits table) first, then MusicBrainz.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const songId = searchParams.get('songId');
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');

  const refresh = searchParams.get('refresh') === 'true';

  if (!title || !artist || !songId) {
    return NextResponse.json({ error: 'songId, title, and artist are required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  let credits: any = null;
  let source = 'MusicBrainz';

  try {
    // 1. CHECK DATABASE FIRST (Unless refresh is requested)
    if (!refresh) {
      const { data: dbCredits } = await supabase
        .from('SongCredits')
        .select('CreditsData, Source')
        .eq('SongId', songId)
        .single();

      if (dbCredits) {
        credits = dbCredits.CreditsData as any;
        source = dbCredits.Source;
      }
    }

    // 2. FETCH FROM APIS IF NOT IN DB OR REFRESHING
    if (!credits) {
      // 2a. FETCH FROM MUSICBRAINZ (Primary)
      credits = await fetchCredits(title, artist);
      source = 'MusicBrainz';

      // 3. SMART SUPPLEMENTAL FALLBACK (Detective Logic)
      // If MusicBrainz found nothing OR is missing key info, ask Discogs and Genius
      const categories = ['production', 'musicians', 'vocals', 'additional'] as const;
      let isThin = !credits || categories.some(cat => (credits![cat]?.length || 0) < 2);

      if (isThin) {
        console.log('🔍 Credits thin or missing, checking Discogs & Genius supplemental...');
        
        const dcCredits = await fetchDiscogsCredits(title, artist);
        const gnCredits = await fetchGeniusCredits(title, artist);
        
        const supplements = [
          { data: dcCredits, label: 'Discogs' },
          { data: gnCredits, label: 'Genius' }
        ];

        for (const supp of supplements) {
          if (!supp.data) continue;

          if (!credits) {
            credits = supp.data;
            source = supp.label;
            isThin = categories.some(cat => (credits![cat]?.length || 0) < 2);
          } else {
            let supplemented = false;
            
            categories.forEach(cat => {
              const mbItems = credits![cat] || [];
              const suppItems = supp.data[cat] || [];
              
              if (suppItems.length === 0) return;

              const combined = [...mbItems, ...suppItems];
              const seen = new Set<string>();
              const unique = combined.filter(item => {
                const key = `${item.name.toLowerCase().trim()}|${item.role.toLowerCase().trim()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

              if (unique.length > mbItems.length) {
                credits![cat] = unique;
                supplemented = true;
              }
            });

            // Also fill album/date if missed
            const isUnknown = (val: string | undefined | null) => !val || val.toLowerCase().includes('unknown');
            if (isUnknown(credits.album) && !isUnknown(supp.data.album)) credits.album = supp.data.album;
            if (isUnknown(credits.releaseDate) && !isUnknown(supp.data.releaseDate)) credits.releaseDate = supp.data.releaseDate;

            if (supplemented) {
              source = `${source} + ${supp.label}`;
            }
          }
        }
      }

      if (source.includes('+')) {
        source = `${source} (Comprehensive)`;
      }
    }

    if (credits) {
      // 4. APPLY STRICT FILTERS & NORMALIZATION (Runs even on DB results!)
      // Production: ONLY Mixer, Producer, Editor (Normalized)
      if (credits.production) {
        const normalized = (credits.production as any[])
          .filter(item => {
            const role = item.role.toLowerCase();
            return role.includes('mix') || role.includes('produce') || role.includes('edit');
          })
          .map(item => {
            const role = item.role.toLowerCase();
            if (role.includes('mix')) return { ...item, role: 'Mixing Engineer' };
            if (role.includes('produce')) {
              if (role.includes('assistant')) return { ...item, role: 'Assistant Producer' };
              if (role.includes('additional')) return { ...item, role: 'Additional Producer' };
              if (role.includes('co-')) return { ...item, role: 'Co-Producer' };
              if (role.includes('executive')) return { ...item, role: 'Executive Producer' };
              return { ...item, role: 'Producer' };
            }
            if (role.includes('edit')) return { ...item, role: 'Editor' };
            return item;
          });

        const hasSpecificProducer = normalized.some(n => 
          n.role.includes('Additional') || n.role.includes('Assistant') || n.role.includes('Co-') || n.role.includes('Executive')
        );

        // Find the "Main" candidate (someone who is both Mixer and Producer)
        const mixers = normalized.filter(n => n.role === 'Mixing Engineer').map(n => n.name);

        credits.production = deduplicateCredits(
          normalized.map(n => {
            if (n.role === 'Producer') {
              if (hasSpecificProducer) return { ...n, role: 'Main Producer' };
              
              // Tie-breaker: If they are also the Mixer, they are the Main Producer
              if (mixers.includes(n.name)) return { ...n, role: 'Main Producer' };
              
              // If there's another Producer who is the Mixer, then this one is likely Additional
              const otherIsMixer = normalized.some(other => 
                other.role === 'Producer' && other.name !== n.name && mixers.includes(other.name)
              );
              if (otherIsMixer) return { ...n, role: 'Additional Producer' };
            }
            return n;
          })
        );
      }

      // Additional (Copyright): ONLY Label
      if (credits.additional) {
        credits.additional = deduplicateCredits(
          (credits.additional as any[]).filter(item => {
            const role = item.role.toLowerCase();
            return role === 'label';
          })
        );
      }

      // 5. SAVE TO DATABASE (Only if not already from DB)
      if (!refresh) {
        // Upsert logic here if needed, but for now we just return
        await supabase
          .from('SongCredits')
          .upsert({
            SongId: songId,
            CreditsData: credits,
            Source: source,
            UpdatedAt: new Date().toISOString(),
          }, { onConflict: 'SongId' });
      }
    }

    return NextResponse.json({
      credits,
      source,
    });
  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

// Helper to deduplicate credits by name and role, preferring specific roles over generic ones
function deduplicateCredits(items: any[]) {
  // 1. Group by name
  const byName: Record<string, any[]> = {};
  items.forEach(item => {
    const name = item.name.toLowerCase().trim();
    if (!byName[name]) byName[name] = [];
    byName[name].push(item);
  });

  const finalItems: any[] = [];

  // 2. For each person, pick the best roles
  Object.values(byName).forEach(personItems => {
    // If a person has "Additional Producer" and "Producer", discard "Producer"
    const roles = personItems.map(p => p.role.toLowerCase());
    
    const hasSpecificProducer = roles.some(r => r.includes('additional') || r.includes('assistant') || r.includes('co-') || r.includes('executive'));

    personItems.forEach(item => {
      const lowRole = item.role.toLowerCase();
      if (hasSpecificProducer && lowRole === 'producer') return; // Skip generic if specific exists
      
      // Ensure we don't add the same normalized role twice for the same person
      const isDuplicate = finalItems.some(f => 
        f.name.toLowerCase().trim() === item.name.toLowerCase().trim() && 
        f.role.toLowerCase().trim() === item.role.toLowerCase().trim()
      );
      if (!isDuplicate) finalItems.push(item);
    });
  });

  return finalItems;
}
