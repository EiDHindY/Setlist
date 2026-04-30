'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is currently running as an installed PWA (Standalone mode)
 * or if it is just open in a normal browser tab.
 */
export function useIsInstalled() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if the display mode is standalone (The standard way)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // 2. iOS Safari specific check
    const isIosStandalone = ('standalone' in navigator) && (navigator as any).standalone === true;

    setIsInstalled(isStandalone || isIosStandalone);

    // Listen for changes (in case they install it while the app is open)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isInstalled;
}
