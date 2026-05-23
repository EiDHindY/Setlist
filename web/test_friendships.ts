import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('Friendships')
    .select(`
      UserId1, UserId2, Status, ActionUserId, CreatedAt,
      User1:Users!UserId1(Id, DisplayName, AvatarUrl),
      User2:Users!UserId2(Id, DisplayName, AvatarUrl)
    `);
  console.log('Friendships:', JSON.stringify(data, null, 2), error);
}

main();
