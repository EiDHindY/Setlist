import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const query = 'lalo';
  const { data, error } = await supabase
    .from('Users')
    .select('Id, DisplayName, AvatarUrl, Email')
    .or(`DisplayName.ilike.%${query}%,Email.ilike.%${query}%`);
    
  console.log('Results:', data, error);
}

main();
