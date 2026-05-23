import { create } from 'zustand';
import { 
  Friendship, 
  UserProfile,
  getFriendships, 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeFriendship,
  searchUsers as searchUsersApi,
  subscribeToFriendships as subscribeToFriendshipsApi
} from '@/services/friends';

interface FriendState {
  friendships: Friendship[];
  searchResults: UserProfile[];
  isLoaded: boolean;
  isSearching: boolean;
  isActionLoading: boolean;
  
  // Actions
  fetchFriendships: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  sendRequest: (userId: string, targetUserId: string) => Promise<boolean>;
  acceptRequest: (userId: string, friendship: Friendship) => Promise<boolean>;
  removeFriend: (userId: string, friendship: Friendship) => Promise<boolean>;
  clearSearchResults: () => void;
  subscribeToFriendships: (userId: string) => void;
  unsubscribeFromFriendships: () => void;
  _unsubscribe: (() => void) | null;
}

export const useFriendStore = create<FriendState>()((set, get) => ({
  friendships: [],
  searchResults: [],
  isLoaded: false,
  isSearching: false,
  isActionLoading: false,
  _unsubscribe: null,

  fetchFriendships: async (userId: string) => {
    const data = await getFriendships(userId);
    set({ friendships: data, isLoaded: true });
  },

  searchUsers: async (query: string) => {
    set({ isSearching: true });
    try {
      const results = await searchUsersApi(query);
      set({ searchResults: results, isSearching: false });
    } catch (err) {
      set({ searchResults: [], isSearching: false });
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [] });
  },

  sendRequest: async (userId: string, targetUserId: string) => {
    set({ isActionLoading: true });
    const success = await sendFriendRequest(userId, targetUserId);
    if (success) {
      await get().fetchFriendships(userId);
    }
    set({ isActionLoading: false });
    return success;
  },

  acceptRequest: async (userId: string, friendship: Friendship) => {
    set({ isActionLoading: true });
    const success = await acceptFriendRequest(friendship.UserId1, friendship.UserId2);
    if (success) {
      await get().fetchFriendships(userId);
    }
    set({ isActionLoading: false });
    return success;
  },

  removeFriend: async (userId: string, friendship: Friendship) => {
    set({ isActionLoading: true });
    // Optimistic removal
    const previous = get().friendships;
    set({ friendships: previous.filter(f => !(f.UserId1 === friendship.UserId1 && f.UserId2 === friendship.UserId2)) });
    
    const success = await removeFriendship(friendship.UserId1, friendship.UserId2);
    if (!success) {
      set({ friendships: previous }); // Rollback
    }
    set({ isActionLoading: false });
    return success;
  },

  subscribeToFriendships: (userId: string) => {
    // Prevent multiple subscriptions
    if (get()._unsubscribe) return;

    const unsubscribe = subscribeToFriendshipsApi(userId, () => {
      // Whenever there's an update, refetch the friendships
      get().fetchFriendships(userId);
    });

    set({ _unsubscribe: unsubscribe });
  },

  unsubscribeFromFriendships: () => {
    const unsubscribe = get()._unsubscribe;
    if (unsubscribe) {
      unsubscribe();
      set({ _unsubscribe: null });
    }
  }
}));
