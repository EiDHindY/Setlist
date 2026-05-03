'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage tab and sub-tab state, syncing it with the browser's history API.
 * This allows the hardware back button to navigate backwards through tabs and sub-tabs.
 */
export function useTabHistory(defaultTab = 0, defaultSub = 'songs', onExitRequest?: () => void) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activeSubTab, setActiveSubTab] = useState(defaultSub);

  const isPopStateRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Initial mount: replace the current history entry so it has our base state
    if (!mountedRef.current) {
      // Check if there is already a state from a previous session
      if (!window.history.state || typeof window.history.state.tab !== 'number') {
        // First entry: the trap (prevents immediate exit)
        window.history.replaceState({ ...window.history.state, isTrap: true }, '');
        // Second entry: the actual app root
        window.history.pushState({ ...window.history.state, isTrap: false, tab: defaultTab, sub: defaultSub }, '');
      } else {
        // If there is already a state (e.g. page refresh), sync our state to it
        setActiveTab(window.history.state.tab);
        setActiveSubTab(window.history.state.sub || defaultSub);
      }
      mountedRef.current = true;
      return;
    }

    // If the state change was caused by a popstate event, don't push a new history entry
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }

    // Push a new history entry when tab or subtab changes programmatically
    window.history.pushState({ ...window.history.state, isTrap: false, tab: activeTab, sub: activeSubTab }, '');
  }, [activeTab, activeSubTab, defaultTab, defaultSub]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.isTrap) {
        // User hit the back button at the very root!
        if (onExitRequest) {
           onExitRequest();
           // Push the root state back so they don't actually exit if they cancel
           window.history.pushState({ ...window.history.state, isTrap: false, tab: activeTab, sub: activeSubTab }, '');
        }
        return;
      }

      // Check if this popstate event contains our tab state
      if (e.state && typeof e.state.tab === 'number') {
        isPopStateRef.current = true;
        setActiveTab(e.state.tab);
        setActiveSubTab(e.state.sub || defaultSub);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [defaultSub, activeTab, activeSubTab, onExitRequest]);

  const setTab = useCallback((tab: number) => {
    setActiveTab((prev) => prev === tab ? prev : tab);
  }, []);

  const setSubTab = useCallback((sub: string) => {
    setActiveSubTab((prev) => prev === sub ? prev : sub);
  }, []);

  return {
    activeTab,
    activeSubTab,
    setTab,
    setSubTab,
  };
}
