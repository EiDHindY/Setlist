'use client';

// ── SHARE TARGET HANDLER ────────────────────────────────────────────
// When a user shares a YouTube link FROM another app TO Setlist,
// this page receives it and redirects to the main app with the link.

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function ShareHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Extract shared data
    const sharedUrl = searchParams.get('url') || '';
    const sharedText = searchParams.get('text') || '';
    const sharedTitle = searchParams.get('title') || '';

    // Find a YouTube URL in any of the shared fields
    const combined = `${sharedUrl} ${sharedText} ${sharedTitle}`;
    const youtubeMatch = combined.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
    );

    if (youtubeMatch) {
      // Redirect to main page with the YouTube link as a search query
      const fullUrl = youtubeMatch[0].startsWith('http')
        ? youtubeMatch[0]
        : `https://${youtubeMatch[0]}`;
      router.replace(`/?shared=${encodeURIComponent(fullUrl)}`);
    } else {
      // No YouTube link found, just go home
      router.replace('/');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[var(--sol-base03)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[var(--sol-cyan)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--sol-base1)] text-sm font-[family-name:var(--font-montserrat)]">
          Opening in Setlist...
        </p>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--sol-base03)] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[var(--sol-cyan)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShareHandler />
    </Suspense>
  );
}
