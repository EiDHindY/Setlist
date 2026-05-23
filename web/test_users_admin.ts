import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: userData, error: userError } = await supabase.from('Users').select('*');
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
