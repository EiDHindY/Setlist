import React from 'react';
import { partySubTabs } from '@/components/navigation/nav-config';
import FriendsView from './FriendsView';

interface PartyProps {
  userId?: string;
  activeSubTab: string;
  onSubTabChange: (subId: string) => void;
}

export default function Party({ userId, activeSubTab, onSubTabChange }: PartyProps) {
  // If no active sub tab is set or it's not in the list, default to 'overview'
  const currentTab = partySubTabs.find(t => t.id === activeSubTab) ? activeSubTab : 'overview';

  return (
    <div className="w-full h-full relative">
      {currentTab === 'overview' && (
        <>
          <div className="md:hidden flex flex-col items-center justify-center h-full text-center p-8 pt-32">
            <div className="w-24 h-24 mb-6 rounded-full bg-[#073642] flex items-center justify-center border-2 border-[#b58900]/50 shadow-[0_0_30px_rgba(181,137,0,0.2)]">
              <span className="text-4xl">🚧</span>
            </div>
            <h2 className="text-2xl font-black tracking-widest text-[#2aa198] mb-4 font-mono">PARTY HUB</h2>
            <p className="text-[#93a1a1] text-sm leading-relaxed mb-8 max-w-[280px]">
              The ultimate collaborative experience is currently under construction. Check out your Friends list in the meantime!
            </p>
            <div className="px-6 py-3 bg-[#b58900]/10 border border-[#b58900]/30 rounded-xl text-[#b58900] text-xs font-bold tracking-widest">
              STAY TUNED
            </div>
          </div>
          <div className="hidden md:block w-full h-full">
            <FriendsView 
              userId={userId || ''} 
              activeSubTab="friends" 
              onSubTabChange={onSubTabChange} 
            />
          </div>
        </>
      )}

      {currentTab === 'friends' && (
        <FriendsView 
          userId={userId || ''} 
          activeSubTab={activeSubTab} 
          onSubTabChange={onSubTabChange} 
        />
      )}
    </div>
  );
}
