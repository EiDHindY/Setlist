import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: userData, error: userError } = await supabase.from('Users').select('*').limit(10);
  console.log('Users count:', userData?.length);
  if (userData) {
      for (const u of userData) {
          console.log(`- ${u.DisplayName} (${u.Email})`);
      }
  } else {
      console.log('Error fetching users:', userError);
  }
}

main();
