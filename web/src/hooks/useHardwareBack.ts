'use client';

import { useEffect, useRef } from 'react';

// Global stack to track open modals in order
const modalStack: string[] = [];

// Global flag to prevent programmatic history pops from triggering other listeners
let isProgrammaticBack = false;

/**
 * Hook to manage mobile hardware back button/swipe back gesture.
 * Uses an in-memory stack to ensure only the topmost modal/overlay responds to a back action.
 * 
 * @param isOpen Whether the modal/overlay is currently open
 * @param onClose Callback to close the modal/overlay
 * @param modalId A string identifier for debugging/differentiating
 */
export function useHardwareBack(isOpen: boolean, onClose: () => void, modalId: string) {
  const onCloseRef = useRef(onClose);
  
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    // Push this modal onto the global stack
    modalStack.push(modalId);

    // Push state immediately to create a history entry
    window.history.pushState({ ...window.history.state, modalId }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (isProgrammaticBack) return;

      // Only respond if THIS modal is at the top of the stack
      if (modalStack[modalStack.length - 1] === modalId) {
        onCloseRef.current();
        // Do not pop from modalStack here; it will be removed in the cleanup effect
        // when isOpen becomes false.
      }
    };

    const timeoutId = setTimeout(() => {
      window.addEventListener('popstate', handlePopState);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('popstate', handlePopState);

      // Remove this modal from the stack
      const index = modalStack.lastIndexOf(modalId);
      if (index !== -1) {
        // If it was the top of the stack, and we are closing it programmatically (not via popstate),
        // we should pop the browser history to keep it in sync.
        const wasTop = index === modalStack.length - 1;
        modalStack.splice(index, 1);

        if (wasTop) {
          isProgrammaticBack = true;
          window.history.back();
          setTimeout(() => {
            isProgrammaticBack = false;
          }, 150);
        }
      }
    };
  }, [isOpen, modalId]);
}
