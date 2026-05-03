'use client';

// ── INSTALL BANNER ──────────────────────────────────────────────────
// Custom "Install Setlist" prompt that replaces the browser's default.

import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useNative';
import { useState } from 'react';

export default function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 2 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[calc(100%-2rem)]"
      >
        <div className="glass-heavy rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border-[var(--sol-cyan)]/20 border">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-[var(--sol-cyan)]/15 flex items-center justify-center flex-shrink-0">
            <Download size={20} className="text-[var(--sol-cyan)]" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[var(--sol-base3)] text-sm font-bold font-[family-name:var(--font-outfit)]">
              Install Setlist
            </p>
            <p className="text-[var(--sol-base01)] text-xs font-[family-name:var(--font-montserrat)]">
              Add to home screen for the full experience
            </p>
          </div>

          {/* Install */}
          <button
            onClick={promptInstall}
            className="px-4 py-2 rounded-xl bg-[var(--sol-cyan)] text-[var(--sol-base03)] text-xs font-bold tracking-wider transition-bounce hover:scale-105 active:scale-95 cursor-pointer font-[family-name:var(--font-montserrat)]"
          >
            INSTALL
          </button>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-white/10 cursor-pointer"
          >
            <X size={14} className="text-[var(--sol-base01)]" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
