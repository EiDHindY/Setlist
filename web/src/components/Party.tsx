import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { partySubTabs } from '@/components/navigation/nav-config';
import FriendsView from './FriendsView';

interface PartyProps {
  userId: string;
  activeSubTab: string;
  onSubTabChange: (subId: string) => void;
}

export default function Party({ userId, activeSubTab, onSubTabChange }: PartyProps) {
  // If no active sub tab is set or it's not in the list, default to the first one ('friends')
  const currentTab = partySubTabs.find(t => t.id === activeSubTab) ? activeSubTab : 'friends';

  return (
    <div className="flex flex-col h-full pt-4 md:pt-10">
      {/* ── Sub-tab Filter Strip (desktop only) ──────────────────── */}
      <div className="hidden md:flex items-center gap-2 px-6 pb-4 flex-shrink-0">
        {partySubTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onSubTabChange(tab.id)}
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`relative flex items-center gap-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-colors font-[family-name:var(--font-montserrat)] ${
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
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!isActive && (
                <span className="whitespace-nowrap">{tab.label}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {currentTab === 'friends' && <FriendsView userId={userId} />}
      </div>
    </div>
  );
}
