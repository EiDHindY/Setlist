'use client';

// ── UNDER DEVELOPMENT PLACEHOLDER ───────────────────────────────────
// Port of mobile/lib/widgets/under_development_state.dart

import { motion } from 'framer-motion';
import Construction from 'lucide-react/dist/esm/icons/construction';
import type { LucideIcon } from 'lucide-react';

interface UnderDevelopmentProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
}

export default function UnderDevelopment({ title, icon: Icon = Construction, description }: UnderDevelopmentProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center border border-[var(--sol-base01)]/20 bg-[var(--sol-base02)]/50">
          <Icon size={48} className="text-[var(--sol-base01)]/50" strokeWidth={1.5} />
        </div>

        <h2 className="text-[var(--sol-base3)] text-2xl font-bold mb-3 tracking-wide font-[family-name:var(--font-outfit)]">
          {title}
        </h2>

        <p className="text-[var(--sol-base01)] text-sm leading-relaxed max-w-xs mx-auto font-[family-name:var(--font-montserrat)]">
          {description || 'This feature is under development. Stay tuned for updates.'}
        </p>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--sol-cyan)] animate-pulse" />
          <span className="text-[var(--sol-cyan)]/60 text-xs font-bold tracking-[3px] font-[family-name:var(--font-montserrat)]">
            COMING SOON
          </span>
        </div>
      </motion.div>
    </div>
  );
}
