"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tabs, collectionSubTabs, SideNavProps } from './nav-config';
import { useHardwareBack } from '@/hooks/useHardwareBack';

export const MobileBottomNav = ({ avatarUrl, activeTab, onTabChange, activeSubTab, onSubTabChange }: SideNavProps) => {
  const [isDeepOpen, setIsDeepOpen] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  // Listen to scroll events dispatched from scrollable containers (like Library)
  React.useEffect(() => {
    const handleScroll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'down') setIsVisible(false);
      else setIsVisible(true);
    };
    window.addEventListener('scroll-direction', handleScroll);
    return () => window.removeEventListener('scroll-direction', handleScroll);
  }, []);

  // Reset deep menu if we leave current tab
  React.useEffect(() => {
    setIsDeepOpen(false);
  }, [activeTab]);

  useHardwareBack(isDeepOpen, () => setIsDeepOpen(false), 'mobile_deep_nav');

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, x: '-50%' }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 100,
        x: '-50%' 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 left-1/2 z-40 bg-[#073642]/80 backdrop-blur-3xl border border-[#586e75]/20 shadow-2xl rounded-[32px] w-[92vw] max-w-[420px] h-[64px] overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isDeepOpen ? (
          /* ── SUB-NAV ──────────────────────────────────────────────── */
          <motion.div
            key="sub"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 40) setIsDeepOpen(false);
            }}
            className="flex items-center w-full h-full px-4 gap-2"
          >
            {/* Sub-tabs: active expands to icon+label, inactive = icon only. Swipe right to go back. */}
            {activeTab === 1 ? (
              <div className="flex-1 flex items-center justify-between gap-1">
                {collectionSubTabs.map((sub) => {
                  const isActive = activeSubTab === sub.id;
                  const Icon = sub.icon;
                  return (
                    <motion.button
                      key={sub.id}
                      onClick={() => onSubTabChange?.(sub.id)}
                      layout
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className={`flex items-center gap-1.5 rounded-full cursor-pointer transition-colors shrink-0 ${
                        isActive
                          ? 'bg-[#2aa198] text-[#002b36] px-3 py-1.5'
                          : 'bg-transparent text-[#586e75] hover:text-[#93a1a1] p-1.5'
                      }`}
                    >
                      <Icon size={isActive ? 14 : 18} strokeWidth={isActive ? 2.5 : 2} />
                      <AnimatePresence>
                        {isActive && (
                          <motion.span
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 'auto', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-[10px] font-bold tracking-wide whitespace-nowrap overflow-hidden"
                          >
                            {sub.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-2 bg-[#073642]/40 border border-[#586e75]/20 rounded-full whitespace-nowrap text-[9px] font-bold tracking-[0.2em] text-[#586e75] italic">
                {tabs[activeTab || 0].label} FEATURES UNDER DEVELOPMENT 🚧
              </div>
            )}
          </motion.div>
        ) : (
          /* ── MAIN GLOBAL ICONS ─────────────────────────────────────── */
          <motion.div
            key="main"
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) setIsDeepOpen(true);
            }}
            className="flex items-center justify-center w-full h-full px-1 gap-1"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.div
                  key={tab.id}
                  onClick={() => {
                    if (isActive) {
                      setIsDeepOpen(true);
                    } else {
                      onTabChange?.(tab.id);
                    }
                  }}
                  animate={{ backgroundColor: isActive ? 'rgba(42, 161, 152, 0.1)' : 'transparent' }}
                  className={`flex items-center px-3 py-2 rounded-2xl gap-2 transition-all cursor-pointer ${isActive ? 'border-r border-[#2aa198]/30 pr-4' : ''}`}
                >
                  {tab.id === 4 && avatarUrl ? (
                    <div className={`w-6 h-6 rounded-full overflow-hidden border-2 ${isActive ? 'border-[#2aa198]' : 'border-[#586e75]/50'}`}>
                      <img src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  ) : tab.customIcon ? (
                    <tab.customIcon isActive={isActive} size={20} />
                  ) : tab.icon ? (
                    <tab.icon size={20} className={isActive ? 'text-[#2aa198]' : 'text-[#586e75]'} />
                  ) : null}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }}
                        className="text-[10px] font-bold text-[#2aa198] tracking-[0.1em] overflow-hidden whitespace-nowrap"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Visual Hint for Swipe on Active Tab */}
                  {isActive && (
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="ml-1 text-[#2aa198]/40"
                    >
                      ›
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
