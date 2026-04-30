'use client';

// ── SERVICE WORKER REGISTRATION ─────────────────────────────────────────────
// Registers the SW on mount. This is a client-only component.
// ⚠️  Disabled in development — the SW caches the HTML shell and
//    serves it stale on tab return, making the app look like it reloads.

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production — dev mode has HMR which conflicts with SW caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('🔧 Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.error('🛑 SW registration failed:', err);
        });
    }
  }, []);

  return null;
}
