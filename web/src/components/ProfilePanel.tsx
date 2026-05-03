'use client';

// ── PROFILE PANEL ───────────────────────────────────────────────────
// Port of mobile/lib/screens/profile_screen.dart

import { motion } from 'framer-motion';
import { LogOut, Mail, Shield, Globe } from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface ProfilePanelProps {
  session: {
    user: {
      email?: string;
      user_metadata?: {
        full_name?: string;
        avatar_url?: string;
      };
    };
  };
}

export default function ProfilePanel({ session }: ProfilePanelProps) {
  const user = session.user;
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Rockstar';
  const avatarUrl = user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center max-w-sm w-full"
      >
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden border-2 border-[var(--sol-cyan)] shadow-[0_0_20px_rgba(42,161,152,0.3)]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--sol-base02)] flex items-center justify-center">
              <span className="text-[var(--sol-cyan)] text-3xl font-bold font-[family-name:var(--font-outfit)]">
                {name[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Name */}
        <h2 className="text-[var(--sol-base3)] text-2xl font-bold mb-1 font-[family-name:var(--font-outfit)]">
          {name}
        </h2>

        {/* Email */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mail size={14} className="text-[var(--sol-base01)]" />
          <span className="text-[var(--sol-base01)] text-sm font-[family-name:var(--font-montserrat)]">
            {user.email}
          </span>
        </div>

        {/* Info Cards */}
        <div className="space-y-3 mb-10">
          <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
            <Shield size={20} className="text-[var(--sol-cyan)] flex-shrink-0" />
            <div className="text-left">
              <p className="text-[var(--sol-base2)] text-sm font-semibold font-[family-name:var(--font-montserrat)]">
                VIP Access
              </p>
              <p className="text-[var(--sol-base01)] text-xs font-[family-name:var(--font-montserrat)]">
                All features unlocked on web
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
            <Globe size={20} className="text-[var(--sol-blue)] flex-shrink-0" />
            <div className="text-left">
              <p className="text-[var(--sol-base2)] text-sm font-semibold font-[family-name:var(--font-montserrat)]">
                PWA Ready
              </p>
              <p className="text-[var(--sol-base01)] text-xs font-[family-name:var(--font-montserrat)]">
                Install to your device from the browser menu
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 mx-auto px-8 py-3 rounded-2xl border border-[var(--sol-base01)]/30 bg-[var(--sol-base02)]/50 text-[var(--sol-base1)] text-sm font-semibold hover:bg-[var(--sol-red)]/10 hover:border-[var(--sol-red)]/30 hover:text-[var(--sol-red)] transition-all cursor-pointer font-[family-name:var(--font-montserrat)]"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
