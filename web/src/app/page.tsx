"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Music, LogIn, Github, Globe } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!mounted) return null;

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#002b36] flex items-center justify-center flex-col gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Music className="text-[#2aa198] w-12 h-12" />
        </motion.div>
        <span className="text-[#93a1a1] animate-pulse font-mono tracking-widest text-xs">INITIALIZING ECOSYSTEM...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#002b36] selection:bg-[#2aa198] selection:text-[#002b36]">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#073642_1px,transparent_1px),linear-gradient(to_bottom,#073642_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <main className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
        <AnimatePresence>
          {!session ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              {/* Branding Section */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-[#073642] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-[#586e75]/20"
                >
                  <Music className="text-[#268bd2] w-10 h-10" />
                </motion.div>
                
                <h1 className="text-5xl font-black text-[#93a1a1] mb-2 tracking-tighter italic">
                  SET<span className="text-[#2aa198]">LIST</span>
                </h1>
                <p className="text-[#586e75] font-mono text-sm tracking-wide">
                  IDENTITY & ONBOARDING / WEB SYNC
                </p>
              </div>

              {/* Login Actions */}
              <div className="bg-[#073642]/50 backdrop-blur-xl rounded-3xl p-8 border border-[#586e75]/10 shadow-2xl">
                <button
                  onClick={signInWithGoogle}
                  className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-[#fdf6e3] hover:bg-[#93a1a1] text-[#002b36] rounded-2xl font-bold transition-all active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <Globe className="w-5 h-5 text-[#268bd2]" />
                  Sign in with Google
                </button>

                <p className="mt-8 text-center text-[#586e75] text-xs font-mono leading-relaxed">
                  SECURE SYNC ENABLED.<br/>
                  CLOUD IDENTITY: SUPABASE / RAILWAY.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="bg-[#073642] w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-[#2aa198] overflow-hidden">
                 {session.user.user_metadata.avatar_url ? (
                   <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-[#268bd2] text-2xl font-bold">{session.user.email[0].toUpperCase()}</div>
                 )}
              </div>
              <h2 className="text-3xl font-bold text-[#93a1a1] mb-2 italic">Welcome back, <span className="text-[#2aa198]">{session.user.user_metadata.full_name || 'Rockstar'}</span></h2>
              <p className="text-[#586e75] font-mono mb-8">SMART WEB DASHBOARD / LEVEL 1</p>
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="px-6 py-2 bg-[#073642] text-[#93a1a1] border border-[#586e75]/30 rounded-xl hover:bg-[#586e75]/20 transition-all font-mono text-sm"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
