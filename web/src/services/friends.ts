import { supabase } from '@/utils/supabase';

export interface UserProfile {
  Id: string;
  DisplayName: string | null;
  AvatarUrl: string | null;
}

export interface Friendship {
  UserId1: string;
  UserId2: string;
  Status: 'pending' | 'accepted' | 'blocked';
  ActionUserId: string;
  CreatedAt: string;
  // Included from join
  User1?: UserProfile;
  User2?: UserProfile;
}

export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('Users')
    .select('Id, DisplayName, AvatarUrl')
    .or(`DisplayName.ilike.%${query}%,Email.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }
  return data as UserProfile[];
};

export const getFriendships = async (userId: string): Promise<Friendship[]> => {
  const { data, error } = await supabase
    .from('Friendships')
    .select(`
      UserId1, UserId2, Status, ActionUserId, CreatedAt,
      User1:Users!UserId1(Id, DisplayName, AvatarUrl),
      User2:Users!UserId2(Id, DisplayName, AvatarUrl)
    `)
    .or(`UserId1.eq.${userId},UserId2.eq.${userId}`);

  if (error) {
    console.error('Error getting friendships:', JSON.stringify(error, null, 2));
    return [];
  }
  
  return data as unknown as Friendship[];
};

export const sendFriendRequest = async (userId: string, targetUserId: string): Promise<boolean> => {
  const uid1 = userId < targetUserId ? userId : targetUserId;
  const uid2 = userId < targetUserId ? targetUserId : userId;

  const { error } = await supabase
    .from('Friendships')
    .insert({
      UserId1: uid1,
      UserId2: uid2,
      Status: 'pending',
      ActionUserId: userId
    });

  if (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
  return true;
};

export const acceptFriendRequest = async (userId1: string, userId2: string): Promise<boolean> => {
  const { error } = await supabase
    .from('Friendships')
    .update({ Status: 'accepted', UpdatedAt: new Date().toISOString() })
    .match({ UserId1: userId1, UserId2: userId2 });

  if (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
  return true;
};

export const removeFriendship = async (userId1: string, userId2: string): Promise<boolean> => {
  const { error } = await supabase
    .from('Friendships')
    .delete()
    .match({ UserId1: userId1, UserId2: userId2 });

  if (error) {
    console.error('Error removing friendship:', error);
    return false;
  }
  return true;
};
