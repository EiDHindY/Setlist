"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Globe } from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";

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

      <main className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
        <AnimatePresence>
          {!session ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              {/* Branding Section */}
              <AnimatedLogo />

              {/* Login Actions */}
              <div className="bg-[#073642]/50 backdrop-blur-xl rounded-3xl p-8 border border-[#586e75]/10 shadow-2xl">
                <div className="animate-float w-full">
                  <button
                    onClick={signInWithGoogle}
                    className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-[#fdf6e3] hover:bg-[#93a1a1] text-[#002b36] rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.95] overflow-hidden shadow-lg hover:shadow-xl cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20C44 22.659 43.862 21.35 43.611 20.083z"/>
                      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571c.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24C44 22.659 43.862 21.35 43.611 20.083z"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
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
