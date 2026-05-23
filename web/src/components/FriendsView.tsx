import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Users from 'lucide-react/dist/esm/icons/users';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Search from 'lucide-react/dist/esm/icons/search';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import Clock from 'lucide-react/dist/esm/icons/clock';
import X from 'lucide-react/dist/esm/icons/x';
import { useFriendStore } from '@/store/friendStore';

import { partySubTabs } from '@/components/navigation/nav-config';

interface FriendsViewProps {
  userId: string;
  activeSubTab?: string;
  onSubTabChange?: (subId: string) => void;
}

export default function FriendsView({ userId, activeSubTab, onSubTabChange }: FriendsViewProps) {
  const [activeTab, setActiveTab] = useState<'my-friends' | 'add-friend' | 'requests'>('my-friends');
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
    clearSearchResults,
    subscribeToFriendships,
    unsubscribeFromFriendships
  } = useFriendStore();

  useEffect(() => {
    if (userId) {
      fetchFriendships(userId);
      subscribeToFriendships(userId);
    }
    
    return () => {
      unsubscribeFromFriendships();
    };
  }, [userId, fetchFriendships, subscribeToFriendships, unsubscribeFromFriendships]);

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
              <Image src={otherUser.AvatarUrl} alt={otherUser.DisplayName || 'User'} width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
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
          {type === 'accepted' && null}
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
    <div className="flex flex-col lg:flex-row h-full lg:px-6 lg:pb-6 lg:gap-6">

      {/* Main Content Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* ── Header & Tabs Row ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 lg:px-0 py-4 md:pt-10 md:pb-6 flex-shrink-0 gap-4">
          {/* Sub-tab Filter Strip (desktop only) */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
            {partySubTabs.map((tab) => {
              const isActive = activeSubTab ? activeSubTab === tab.id : tab.id === 'friends';
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onSubTabChange?.(tab.id)}
                  layout
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`relative flex items-center gap-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-colors font-[family-name:var(--font-montserrat)] whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-[var(--sol-cyan)]/15 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30 shadow-[0_0_12px_rgba(42,161,152,0.2)] px-4 py-2'
                      : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] hover:bg-white/5 border border-transparent px-3 py-2'
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  <AnimatePresence mode="wait">
                    {isActive && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isActive && (
                    <span>{tab.label}</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            {/* Toggle Buttons */}
            <div className="flex gap-2 bg-[var(--sol-base02)]/50 p-1 rounded-full border border-[var(--sol-base01)]/20 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('my-friends')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all text-center whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'my-friends' 
                    ? 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30' 
                    : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] border border-transparent'
                }`}
              >
                My Friends
              </button>
              <button
                onClick={() => setActiveTab('add-friend')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'add-friend' 
                    ? 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30' 
                    : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] border border-transparent'
                }`}
              >
                <UserPlus size={14} /> Add
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'requests' 
                    ? 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] border border-[var(--sol-cyan)]/30' 
                    : 'text-[var(--sol-base01)] hover:text-[var(--sol-base1)] border border-transparent'
                }`}
              >
                Requests
                {(pendingReceived.length > 0 || pendingSent.length > 0) && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === 'requests'
                      ? 'bg-[var(--sol-cyan)] text-[var(--sol-base03)]'
                      : 'bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)]'
                  }`}>
                    {pendingReceived.length + pendingSent.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>



        <div className="flex-1 overflow-y-auto px-6 lg:px-0 pr-2 pb-20 custom-scrollbar relative">

          {activeTab === 'my-friends' ? (
            <div className="flex flex-col gap-6">
              {!isLoaded ? (
                <div className="flex items-center justify-center py-10 opacity-50 text-[var(--sol-base01)]">
                  Loading...
                </div>
              ) : (
                <>
                  <div>
                    {acceptedFriends.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 opacity-60">
                        <Users size={48} className="mb-4 text-[var(--sol-base01)]" />
                        <p className="text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] text-sm">You don't have any friends yet.</p>
                      </div>
                    ) : (
                      acceptedFriends.map(f => renderFriendCard(f, 'accepted'))
                    )}
                  </div>


                </>
              )}
            </div>
          ) : activeTab === 'requests' ? (
            <div className="flex flex-col gap-6">
              {!isLoaded ? (
                <div className="flex items-center justify-center py-10 opacity-50 text-[var(--sol-base01)]">
                  Loading...
                </div>
              ) : (
                <>
                  {pendingReceived.length === 0 && pendingSent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                      <Clock size={48} className="mb-4 text-[var(--sol-base01)]" />
                      <p className="text-[var(--sol-base01)] font-[family-name:var(--font-montserrat)] text-sm">No pending requests.</p>
                    </div>
                  ) : (
                    <>
                      {pendingReceived.length > 0 && (
                        <div>
                          <h3 className="text-[var(--sol-base1)] text-xs font-bold uppercase tracking-wider mb-3">Friend Requests</h3>
                          {pendingReceived.map(f => renderFriendCard(f, 'received'))}
                        </div>
                      )}
                      {pendingSent.length > 0 && (
                        <div>
                          <h3 className="text-[var(--sol-base1)] text-xs font-bold uppercase tracking-wider mb-3 mt-4">Sent Requests</h3>
                          {pendingSent.map(f => renderFriendCard(f, 'sent'))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sol-base01)]" size={18} />
                <input 
                  type="search" 
                  name="friendSearch"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
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
                    const status = getSearchUserStatus(user.Id);
                    const isSelf = user.Id === userId;
                    
                    return (
                      <div key={user.Id} className="flex items-center justify-between p-4 bg-[var(--sol-base02)]/30 rounded-2xl border border-[var(--sol-base01)]/10 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--sol-base02)] border border-[var(--sol-base01)]/20 overflow-hidden flex items-center justify-center">
                            {user.AvatarUrl ? (
                              <Image src={user.AvatarUrl} alt={user.DisplayName || 'User'} width={40} height={40} className="w-full h-full object-cover" referrerPolicy="no-referrer" unoptimized />
                            ) : (
                              <Users size={20} className="text-[var(--sol-base01)]" />
                            )}
                          </div>
                          <span className="text-[var(--sol-base3)] text-sm font-bold font-[family-name:var(--font-outfit)]">{user.DisplayName || 'Unknown User'}</span>
                        </div>
                        
                        <div>
                          {isSelf ? (
                            <span className="px-3 py-1.5 bg-[var(--sol-base02)]/80 text-[var(--sol-base01)] rounded-full text-xs font-bold border border-[var(--sol-base01)]/10">
                              You
                            </span>
                          ) : status === 'none' ? (
                            <button 
                              onClick={() => sendRequest(userId, user.Id)}
                              className="px-4 py-1.5 bg-[var(--sol-cyan)]/20 text-[var(--sol-cyan)] rounded-full text-xs font-bold hover:bg-[var(--sol-cyan)]/30 transition-colors"
                            >
                              Add Friend
                            </button>
                          ) : status === 'accepted' ? (
                            <span className="text-[var(--sol-base01)] text-xs font-bold flex items-center gap-1">
                              <UserCheck size={14} /> Friends
                            </span>
                          ) : status === 'sent' ? (
                            <span className="text-[var(--sol-base01)] text-xs font-bold flex items-center gap-1">
                              <Clock size={14} /> Request Sent
                            </span>
                          ) : (
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
                    <p className="text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">No users found for &quot;{searchQuery}&quot;.</p>
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

      {/* Right Sidebar (Desktop Only) */}
      <aside className="hidden lg:flex flex-col gap-6 w-72 flex-shrink-0 overflow-y-auto pr-2 no-scrollbar md:pt-10">
        <div className="glass rounded-[32px] p-6 border border-white/5 shadow-xl">
            <h3 className="text-[var(--sol-base01)] text-[10px] font-bold tracking-[0.3em] font-[family-name:var(--font-montserrat)] mb-6 flex items-center gap-2 opacity-60 uppercase">
              <Users size={14} className="text-[var(--sol-cyan)]" /> Social Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--sol-base03)]/40 rounded-2xl p-4 flex flex-col justify-between border border-white/5 transition-all hover:bg-[var(--sol-base03)]/60">
                <Users size={14} className="text-[var(--sol-cyan)]/70 mb-2" />
                <span className="text-2xl font-black text-[var(--sol-base3)] font-[family-name:var(--font-outfit)] leading-none">{acceptedFriends.length}</span>
                <span className="text-[10px] font-bold text-[var(--sol-base01)] opacity-50 uppercase tracking-tighter mt-1">Friends</span>
              </div>
              <div className="bg-[var(--sol-base03)]/40 rounded-2xl p-4 flex flex-col justify-between border border-white/5 transition-all hover:bg-[var(--sol-base03)]/60">
                <UserCheck size={14} className="text-[var(--sol-cyan)]/70 mb-2" />
                <span className="text-2xl font-black text-[var(--sol-base3)] font-[family-name:var(--font-outfit)] leading-none">{pendingReceived.length}</span>
                <span className="text-[10px] font-bold text-[var(--sol-base01)] opacity-50 uppercase tracking-tighter mt-1">Requests</span>
              </div>
            </div>
          </div>

          <div className="mt-auto bg-gradient-to-br from-[var(--sol-cyan)]/10 to-transparent rounded-[32px] p-6 border border-[var(--sol-cyan)]/10">
            <p className="text-[var(--sol-cyan)] text-xs font-bold mb-2 font-[family-name:var(--font-outfit)] tracking-tight">Pro Tip</p>
            <p className="text-[var(--sol-base01)] text-[11px] leading-relaxed font-[family-name:var(--font-montserrat)]">
              Adding friends allows you to compare Setlists, compete in Clash Arena, and share your musical journey. You can search by display name or exact email address!
            </p>
          </div>
      </aside>

    </div>
  );
}
