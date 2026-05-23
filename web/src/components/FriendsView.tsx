import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Users from 'lucide-react/dist/esm/icons/users';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Search from 'lucide-react/dist/esm/icons/search';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import Clock from 'lucide-react/dist/esm/icons/clock';
import X from 'lucide-react/dist/esm/icons/x';
import { useFriendStore } from '@/store/friendStore';

export default function FriendsView({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<'my-friends' | 'add-friend'>('my-friends');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    friendships,
    searchResults,
    isLoaded,
    isSearching,
    fetchFriendships,
    searchUsers,
    sendRequest,
    acceptRequest,
    removeFriend,
    clearSearchResults
  } = useFriendStore();

  useEffect(() => {
    fetchFriendships(userId);
  }, [userId, fetchFriendships]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);
    } else {
      clearSearchResults();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchUsers, clearSearchResults]);

  // Derived state
  const pendingReceived = friendships.filter(f => f.Status === 'pending' && f.ActionUserId !== userId);
  const pendingSent = friendships.filter(f => f.Status === 'pending' && f.ActionUserId === userId);
  const acceptedFriends = friendships.filter(f => f.Status === 'accepted');

  const getOtherUser = (f: any) => f.User1?.Id === userId ? f.User2 : f.User1;

  const renderFriendCard = (friendship: any, type: 'accepted' | 'received' | 'sent') => {
    const otherUser = getOtherUser(friendship);
    if (!otherUser) return null;

    return (
      <div key={`${friendship.UserId1}-${friendship.UserId2}`} className="flex items-center justify-between p-4 bg-[var(--sol-base02)]/30 rounded-2xl border border-[var(--sol-base01)]/10 backdrop-blur-md mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 overflow-hidden flex items-center justify-center">
            {otherUser.AvatarUrl ? (
              <img src={otherUser.AvatarUrl} alt={otherUser.DisplayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <Users size={20} className="text-[var(--sol-base01)]" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[var(--sol-base3)] text-sm font-bold font-[family-name:var(--font-outfit)]">{otherUser.DisplayName || 'Unknown User'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {type === 'received' && (
            <>
              <button 
                onClick={() => acceptRequest(userId, friendship)}
                className="p-2 bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] rounded-full hover:bg-[var(--sol-cyan)]/30 transition-colors"
                title="Accept"
              >
                <UserCheck size={16} />
              </button>
              <button 
                onClick={() => removeFriend(userId, friendship)}
                className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                title="Decline"
              >
                <X size={16} />
              </button>
            </>
          )}
          {type === 'sent' && (
            <div className="flex items-center gap-2 text-[var(--sol-base01)] text-xs font-bold">
              <Clock size={14} /> Pending
            </div>
          )}
          {type === 'accepted' && (
            <button 
              onClick={() => removeFriend(userId, friendship)}
              className="p-2 bg-[var(--sol-base02)] text-[var(--sol-base01)] rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Remove Friend"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const getSearchUserStatus = (targetId: string) => {
    const existing = friendships.find(f => f.UserId1 === targetId || f.UserId2 === targetId);
    if (!existing) return 'none';
    if (existing.Status === 'accepted') return 'accepted';
    if (existing.ActionUserId === userId) return 'sent';
    return 'received';
  };

  return (
    <div className="flex flex-col lg:flex-row h-full px-6 pb-6 lg:gap-6">
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-6 md:mt-4">
          <h2 className="text-[var(--sol-base3)] text-2xl font-bold font-[family-name:var(--font-outfit)] hidden md:block">Friends</h2>
          <div className="flex gap-2 bg-[var(--sol-base02)]/50 p-1 rounded-full border border-[var(--sol-base01)]/20 w-full md:w-auto mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('my-friends')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-full text-xs font-bold transition-all text-center ${
              activeTab === 'my-friends' 
                ? 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30' 
                : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] border border-transparent'
            }`}
          >
            My Friends
            {(pendingReceived.length > 0) && (
              <span className="ml-2 bg-[var(--sol-cyan)] text-[var(--sol-base03)] px-1.5 py-0.5 rounded-full text-[10px]">
                {pendingReceived.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add-friend')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'add-friend' 
                ? 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30' 
                : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] border border-transparent'
            }`}
          >
            <UserPlus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
          {activeTab === 'my-friends' ? (
            <div className="flex flex-col gap-6">
              {!isLoaded ? (
                <div className="flex items-center justify-center py-10 opacity-50 text-[var(--sol-base01)]">
                  Loading...
                </div>
              ) : (
                <>
                  {pendingReceived.length > 0 && (
                    <div>
                      <h3 className="text-[var(--sol-base1)] text-xs font-bold uppercase tracking-wider mb-3">Friend Requests</h3>
                      {pendingReceived.map(f => renderFriendCard(f, 'received'))}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-[var(--sol-base1)] text-xs font-bold uppercase tracking-wider mb-3">Friends</h3>
                    {acceptedFriends.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 opacity-60">
                        <Users size={48} className="mb-4 text-[var(--sol-base01)]" />
                        <p className="text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] text-sm">You don't have any friends yet.</p>
                      </div>
                    ) : (
                      acceptedFriends.map(f => renderFriendCard(f, 'accepted'))
                    )}
                  </div>

                  {pendingSent.length > 0 && (
                    <div>
                      <h3 className="text-[var(--sol-base1)] text-xs font-bold uppercase tracking-wider mb-3 mt-4">Sent Requests</h3>
                      {pendingSent.map(f => renderFriendCard(f, 'sent'))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sol-base01)]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by display name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--sol-base02)]/50 border border-[var(--sol-base01)]/20 rounded-2xl pl-12 pr-4 py-3 text-sm text-[var(--sol-base3)] placeholder-[var(--sol-base01)] focus:outline-none focus:border-[var(--sol-cyan)]/50 transition-colors font-[family-name:var(--font-montserrat)]"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                {isSearching ? (
                   <div className="flex items-center justify-center py-10 opacity-50 text-[var(--sol-base01)]">
                     Searching...
                   </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => {
                    if (user.Id === userId) return null; // Don't show self
                    const status = getSearchUserStatus(user.Id);
                    
                    return (
                      <div key={user.Id} className="flex items-center justify-between p-4 bg-[var(--sol-base02)]/30 rounded-2xl border border-[var(--sol-base01)]/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 overflow-hidden flex items-center justify-center">
                            {user.AvatarUrl ? (
                              <img src={user.AvatarUrl} alt={user.DisplayName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              <Users size={20} className="text-[var(--sol-base01)]" />
                            )}
                          </div>
                          <span className="text-[var(--sol-base3)] text-sm font-bold font-[family-name:var(--font-outfit)]">{user.DisplayName || 'Unknown User'}</span>
                        </div>
                        
                        <div>
                          {status === 'none' && (
                            <button 
                              onClick={() => sendRequest(userId, user.Id)}
                              className="px-4 py-1.5 bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] rounded-full text-xs font-bold hover:bg-[var(--sol-cyan)]/30 transition-colors"
                            >
                              Add Friend
                            </button>
                          )}
                          {status === 'accepted' && (
                            <span className="text-[var(--sol-base01)] text-xs font-bold flex items-center gap-1">
                              <UserCheck size={14} /> Friends
                            </span>
                          )}
                          {status === 'sent' && (
                            <span className="text-[var(--sol-base01)] text-xs font-bold flex items-center gap-1">
                              <Clock size={14} /> Request Sent
                            </span>
                          )}
                          {status === 'received' && (
                            <span className="text-[var(--sol-base01)] text-xs font-bold flex items-center gap-1">
                              Pending Accept
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : searchQuery.length >= 2 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-60">
                    <Search size={32} className="mb-4 text-[var(--sol-base01)]" />
                    <p className="text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">No users found for "{searchQuery}".</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-60">
                    <Search size={32} className="mb-4 text-[var(--sol-base01)]" />
                    <p className="text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">Search for users to add them as friends.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar (Stats & Info) */}
      <div className="hidden lg:flex w-72 flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-24 md:pt-4">
        <div className="bg-[var(--sol-base02)]/30 rounded-[24px] border border-[var(--sol-base01)]/10 backdrop-blur-md p-6">
            <h3 className="text-[var(--sol-base01)] text-[10px] font-bold tracking-[0.2em] font-[family-name:var(--font-outfit)] mb-6 flex items-center gap-2">
              <Users size={12} /> SOCIAL STATS
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--sol-base02)]/50 rounded-2xl p-4 flex flex-col justify-between border border-transparent hover:border-[var(--sol-base01)]/20 transition-colors">
                <Users size={14} className="text-[var(--sol-cyan)] mb-2" />
                <span className="text-2xl font-black text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">{acceptedFriends.length}</span>
                <span className="text-[8px] font-bold text-[var(--sol-base01)] uppercase tracking-wider mt-1">FRIENDS</span>
              </div>
              <div className="bg-[var(--sol-base02)]/50 rounded-2xl p-4 flex flex-col justify-between border border-transparent hover:border-[var(--sol-base01)]/20 transition-colors">
                <UserCheck size={14} className="text-[var(--sol-cyan)] mb-2" />
                <span className="text-2xl font-black text-[var(--sol-base3)] font-[family-name:var(--font-outfit)]">{pendingReceived.length}</span>
                <span className="text-[8px] font-bold text-[var(--sol-base01)] uppercase tracking-wider mt-1">REQUESTS</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--sol-base02)]/30 rounded-[24px] border border-[var(--sol-base01)]/10 backdrop-blur-md p-6 mt-auto">
            <h4 className="text-[var(--sol-cyan)] text-xs font-bold font-[family-name:var(--font-outfit)] mb-2">Pro Tip</h4>
            <p className="text-[var(--sol-base01)] text-xs font-[family-name:var(--font-montserrat)] leading-relaxed">
              Adding friends allows you to compare Setlists, compete in Clash Arena, and share your musical journey. You can search by display name or exact email address!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
