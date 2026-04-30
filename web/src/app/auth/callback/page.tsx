"use client";

import { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { Music } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase automatically parses the URL hash in the background.
    // We just wait for the auth state change event to confirm it's done.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        // Flag for page.tsx to show the welcome splash — only on real login
        sessionStorage.setItem('setlist_just_logged_in', '1');
        // Use window.location instead of router.push to force a hard navigation
        // and completely clear the OAuth hash from the URL.
        window.location.href = "/";
      }
    });

    // Fallback in case the event already fired or we just need to redirect
    setTimeout(() => {
      sessionStorage.setItem('setlist_just_logged_in', '1');
      window.location.href = "/";
    }, 2000);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#002b36] flex items-center justify-center flex-col gap-8 p-6 text-center">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 360],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="bg-[#073642] w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl border border-[#586e75]/20"
      >
        <Music className="text-[#2aa198] w-12 h-12" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[#93a1a1] italic">FINALIZING SYNC...</h2>
        <p className="text-[#586e75] font-mono text-sm tracking-widest animate-pulse uppercase">
          Exchanging tokens with Supabase Hub
        </p>
      </div>

      <div className="w-48 h-1 bg-[#073642] rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-[#268bd2] to-transparent"
        />
      </div>
    </div>
  );
}
