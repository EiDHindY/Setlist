const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ajxgthpcjbqhygxjvtcf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqeGd0aHBjamJxaHlneGp2dGNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyOTkyNCwiZXhwIjoyMDkwODA1OTI0fQ.UUC6DfM69P6W3gBvi082bWC8O_LXuV4ro33NIQBCcZ8');
async function run() {
  const { data, error } = await supabase.from('Users').select('Id').limit(1);
  console.log('Users:', data);
  if (data && data.length > 0) {
    const userId = data[0].Id;
    console.log('Testing with userId:', userId);
    const { data: songs, error: sErr } = await supabase.from('UserSongs').select('*').eq('UserId', userId);
    console.log('Songs:', songs, sErr);
  }
}
run();
