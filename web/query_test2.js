const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ajxgthpcjbqhygxjvtcf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeGd0aHBjamJxaHlneGp2dGNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyOTkyNCwiZXhwIjoyMDkwODA1OTI0fQ.UUC6DfM69P6W3gBvi082bWC8O_LXuV4ro33NIQBCcZ8');
async function run() {
  const userId = '31efd5a7-6155-46a2-8364-094d541ce22d';
  const { data: userSongs, error: usError } = await supabase
      .from('UserSongs')
      .select('SongId, AddedAt, Songs:Songs(Id, Title, Artist, AlbumArtUrl, Duration, Url)')
      .eq('UserId', userId)
      .order('AddedAt', { ascending: false });
  console.log('userSongs:', userSongs, usError);
}
run();
