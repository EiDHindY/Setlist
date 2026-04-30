"use client";

// ── MAIN PAGE ───────────────────────────────────────────────────────
// Wires together: Auth → SideNav → Library → Search → Song Detail → Player

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Swords, PartyPopper } from "lucide-react";
import AnimatedLogo from "@/components/AnimatedLogo";
import AnimatedLoader from "@/components/AnimatedLoader";
import SplashScreen from "@/components/SplashScreen";
import SideNav from "@/components/SideNav";
import Library from "@/components/Library";
import SearchModal from "@/components/SearchModal";
import SongDetail from "@/components/SongDetail";
import Player from "@/components/Player";
import ProfilePanel from "@/components/ProfilePanel";
import UnderDevelopment from "@/components/UnderDevelopment";
import InstallBanner from "@/components/InstallBanner";
import { syncUserWithBackend } from "@/services/auth";
import type { Song } from "@/types/song";

export default function HomePage() {
  // ── Auth State ────────────────────────────────────────────────────
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  // Start as false — only show splash for genuine new logins, not session restorations
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [synced, setSynced] = useState(false);

  // ── App State ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(1); // Default: COLLECTION
  const [showSearch, setShowSearch] = useState(false);
  const [sharedQuery, setSharedQuery] = useState<string | undefined>(undefined);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [libraryKey, setLibraryKey] = useState(0);

  useEffect(() => {
    setMounted(true);

    // Check if we just came from the OAuth login flow.
    // The auth/callback page sets this flag before redirecting here.
    // This is the ONLY reliable way to show the splash — Supabase's SIGNED_IN
    // event also fires on token refresh, which would retrigger the splash on every
    // tab switch after the token expires (~60 min).
    const justLoggedIn = sessionStorage.getItem('setlist_just_logged_in') === '1';
    if (justLoggedIn) {
      sessionStorage.removeItem('setlist_just_logged_in'); // consume immediately
      setShowSplash(true);
    }

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        setSession(s as unknown as Record<string, unknown>);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Supabase getSession error:", err);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // No splash logic here — handled via sessionStorage flag above.
      // This only keeps session state in sync (sign out, token refresh, etc.)
      setSession(newSession as unknown as Record<string, unknown>);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle URL params: share target, shortcuts, deep links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    // Share Target: /?shared=<youtube-url>
    const shared = params.get('shared');
    if (shared) {
      setSharedQuery(shared);
      setShowSearch(true);
      // Clean URL
      window.history.replaceState({}, '', '/');
    }

    // Shortcut: /?action=search
    const action = params.get('action');
    if (action === 'search') {
      setShowSearch(true);
      window.history.replaceState({}, '', '/');
    }

    // Shortcut: /?tab=1
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(parseInt(tab, 10));
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Sync user with backend on login
  useEffect(() => {
    if (session && !synced) {
      syncUserWithBackend();
      setSynced(true);
    }
  }, [session, synced]);

  const handleSongAdded = useCallback((song: Song) => {
    setLibraryKey((k) => k + 1);
    setSelectedSong(song);
  }, []);

  const handleSongUpdated = useCallback(() => {
    setLibraryKey((k) => k + 1);
  }, []);

  const handleTabChange = useCallback((tabId: number) => {
    setActiveTab(tabId);
    setSelectedSong(null); // Reset detail view when switching tabs
  }, []);

  if (!mounted) return null;

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // ── RENDER CONTENT BASED ON ACTIVE TAB ────────────────────────────
  const renderContent = () => {
    // If a song is selected (from Collection tab), show detail
    if (selectedSong && activeTab === 1) {
      return (
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.25 }}
          className="h-full relative"
        >
          <SongDetail
            song={selectedSong}
            onBack={() => setSelectedSong(null)}
            onSongUpdated={handleSongUpdated}
          />
        </motion.div>
      );
    }

    switch (activeTab) {
      case 0: // HOME
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <UnderDevelopment
              title="Home Dashboard"
              icon={Home}
              description="Your personal music dashboard with stats, recent plays, and recommendations."
            />
          </motion.div>
        );

      case 1: // COLLECTION (Library)
        return (
          <motion.div
            key={`library-${libraryKey}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <Library
              onOpenSearch={() => setShowSearch(true)}
              onSelectSong={setSelectedSong}
            />
          </motion.div>
        );

      case 2: // CLASH
        return (
          <motion.div
            key="clash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <UnderDevelopment
              title="Clash Arena"
              icon={Swords}
              description="Battle your music taste against other users. Vote for the best versions."
            />
          </motion.div>
        );

      case 3: // PARTY
        return (
          <motion.div
            key="party"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <UnderDevelopment
              title="Party Mode"
              icon={PartyPopper}
              description="Create a shared session and listen to music together in real-time via SignalR."
            />
          </motion.div>
        );

      case 4: // PROFILE
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full"
          >
            {session && <ProfilePanel session={session as never} />}
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ── LOGIN PAGE ────────────────────────────────────────────────────
  if (!session && !loading && !showSplash) {
    return (
      <div className="min-h-screen bg-[var(--sol-base03)] selection:bg-[var(--sol-cyan)] selection:text-[var(--sol-base03)]">
        <main className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            <AnimatedLogo isStatic={true} />

            <div className="glass rounded-3xl p-8 shadow-2xl">
              <div
                className="animate-float w-full"
                style={{ animationPlayState: isHovered ? "paused" : "running" }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <button
                  onClick={signInWithGoogle}
                  className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-[var(--sol-base3)] hover:bg-[var(--sol-base1)] text-[var(--sol-base03)] rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.95] overflow-hidden shadow-lg hover:shadow-xl cursor-pointer"
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
        </main>
      </div>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--sol-base03)] selection:bg-[var(--sol-cyan)] selection:text-[var(--sol-base03)]">
      {/* Splash */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen
            key="splash"
            isLoading={loading}
            onComplete={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>

      <InstallBanner />

      {/* Main Layout */}
      {session && !showSplash && (
        <div className="flex h-screen">
          {/* SideNav — now controlled */}
          <SideNav
            avatarUrl={(session as Record<string, Record<string, Record<string, string>>>)?.user?.user_metadata?.avatar_url}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Content Area */}
          <main className="flex-1 ml-[100px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>

          {/* Player — always mounted at root */}
          <Player />
        </div>
      )}

      {/* Loading fallback — only shown when not logged in yet and no splash */}
      {loading && !showSplash && !session && <AnimatedLoader />}

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <SearchModal
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            onSongAdded={handleSongAdded}
            initialQuery={sharedQuery}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
