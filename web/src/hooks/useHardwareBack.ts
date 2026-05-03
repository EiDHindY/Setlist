'use client';

import { useEffect, useRef } from 'react';

// Global counter to track the sequence of modal states
let globalStateId = 0;

/**
 * Hook to manage mobile hardware back button/swipe back gesture.
 * When `isOpen` is true, pushes a state to history.
 * If the user uses the back gesture, calls `onClose()`.
 * If closed programmatically (via UI), cleanly removes the history state.
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
    if (!isOpen) return;

    // Increment global ID for each new state push
    const currentId = ++globalStateId;

    // Push state immediately while preserving Next.js internal state
    window.history.pushState({ ...window.history.state, modalId, id: currentId }, '');

    const handlePopState = (e: PopStateEvent) => {
      // If the state we landed on has a lower ID, it means we went back.
      // (or if it has no id, meaning we went back to a base page without our custom state)
      const incomingId = e.state?.id || 0;
      if (incomingId < currentId) {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // If the component is unmounting or isOpen became false via the UI,
      // and the browser history state is still exactly our state,
      // we need to pop it so the history remains clean.
      // We check the exact ID to ensure we don't pop someone else's state.
      if (window.history.state?.id === currentId) {
        window.history.back();
      }
    };
  }, [isOpen, modalId]);
}
