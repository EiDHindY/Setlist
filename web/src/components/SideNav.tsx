import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, User } from 'lucide-react';
import BumpingHeadphonesIcon from './icons/BumpingHeadphonesIcon';
import BleedingClashIcon from './icons/BleedingClashIcon';
import SyncedHeadsetsIcon from './icons/SyncedHeadsetsIcon';

const tabs = [
  { id: 0, label: 'HOME', icon: Home },
  { id: 1, label: 'COLLECTION', customIcon: BumpingHeadphonesIcon },
  { id: 2, label: 'CLASH', customIcon: BleedingClashIcon },
  { id: 3, label: 'PARTY', customIcon: SyncedHeadsetsIcon },
  { id: 4, label: 'PROFILE', icon: User },
];

export default function SideNav({ avatarUrl }: { avatarUrl?: string }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col items-center py-8 px-4 bg-[#073642]/60 backdrop-blur-3xl rounded-[40px] border border-[#586e75]/20 shadow-2xl z-40 gap-8"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <div 
            key={tab.id} 
            className="relative group cursor-pointer"
            onClick={() => setActiveTab(tab.id)}
          >
            {/* Active Glow/Pill Background */}
            {isActive && (
               <motion.div 
                 layoutId="active-pill"
                 className="absolute inset-0 bg-[#2aa198]/20 border border-[#2aa198]/30 rounded-2xl -m-3"
                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
               />
            )}
            
            <div className="relative z-10">
              {tab.id === 4 && avatarUrl ? (
                <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all duration-300 ${isActive ? 'border-[#2aa198] shadow-[0_0_12px_rgba(42,161,152,0.5)]' : 'border-[#586e75]/50 group-hover:border-[#93a1a1]'}`}>
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ) : tab.customIcon ? (
                <tab.customIcon isActive={isActive} size={26} />
              ) : tab.icon ? (
                <tab.icon 
                  size={26} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-300 ${isActive ? 'text-[#2aa198] drop-shadow-[0_0_8px_rgba(42,161,152,0.6)]' : 'text-[#586e75] group-hover:text-[#93a1a1]'}`} 
                />
              ) : null}
            </div>

            {/* Tooltip on Hover */}
            <div className="absolute left-full ml-8 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#002b36] text-[#93a1a1] text-xs font-bold tracking-[0.2em] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-[#586e75]/30">
              {tab.label}
              <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-[#002b36] rotate-45 border-l border-b border-[#586e75]/30" />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
