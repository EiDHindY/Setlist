'use client';

import { useEffect, useRef } from 'react';

// Global flag to prevent programmatic history pops from triggering listeners
let isProgrammaticBack = false;
export const getIsProgrammaticBack = () => isProgrammaticBack;

// Global counter of open modals. If > 0, useTabHistory should ignore popstate events
let activeModalCount = 0;
export const getActiveModalCount = () => activeModalCount;

// Global stack to track open modals in order
const modalStack: string[] = [];

/**
 * Hook to manage mobile hardware back button/swipe back gesture.
 * Uses history.pushState to intercept the back gesture safely.
 */
export function useHardwareBack(isOpen: boolean, onClose: () => void, modalId: string) {
  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    activeModalCount++;
    modalStack.push(modalId);

    // Push a new state with our modalId.
    // We KEEP the existing Next.js state and tab history state, so the history stack remains pristine.
    window.history.pushState({ ...window.history.state, modalId }, '');

    let poppedByBrowser = false;

    const handlePopState = (e: PopStateEvent) => {
      if (isProgrammaticBack) return;
      
      // If THIS modal is at the top of the stack, the user pressed back
      if (modalStack[modalStack.length - 1] === modalId) {
        poppedByBrowser = true;
        onCloseRef.current();
      }
    };

    // Delay listener registration slightly so we don't catch any immediate popstates from rapid navigations
    const timeoutId = setTimeout(() => {
      window.addEventListener('popstate', handlePopState);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      activeModalCount--;
      window.removeEventListener('popstate', handlePopState);
      
      const index = modalStack.lastIndexOf(modalId);
      if (index !== -1) {
        const wasTop = index === modalStack.length - 1;
        modalStack.splice(index, 1);

        // If the modal was closed programmatically (e.g. by clicking an on-screen X button),
        // we must manually pop the browser history to keep it in sync.
        if (wasTop && !poppedByBrowser) {
          isProgrammaticBack = true;
          window.history.back();
          setTimeout(() => {
            isProgrammaticBack = false;
          }, 100);
        }
      }
    };
  }, [isOpen, modalId]);
}
