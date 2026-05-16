'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayback } from '@/contexts/PlaybackContext';

const TRIGGER_THRESHOLD = 130; // px to pull before refresh triggers
const MAX_PULL = 160;           // max visual pull distance

/**
 * Dual-purpose component:
 * 1. Always blocks Chrome Android's native pull-to-refresh.
 * 2. When the player is NOT expanded, shows a custom pull-to-refresh
 *    indicator and reloads the page when pulled far enough.
 */
export default function PreventPullToRefresh() {
  const { state } = usePlayback();
  const isPlayerExpanded = state.isExpanded;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);           // live value for closures
  // Keep a ref so the touchmove listener always reads the latest value
  const isPlayerExpandedRef = useRef(isPlayerExpanded);

  useEffect(() => {
    isPlayerExpandedRef.current = isPlayerExpanded;
  }, [isPlayerExpanded]);

  useEffect(() => {
    /**
     * Walk up the DOM from the touched element and find the nearest
     * ancestor that is actually scrollable. Return its scrollTop.
     * Falls back to window.scrollY if nothing scrollable is found.
     */
    const getScrollTop = (target: EventTarget | null): number => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflow = style.overflowY;
        const isScrollable = (overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight;
        if (isScrollable) return el.scrollTop;
        el = el.parentElement;
      }
      return window.scrollY;
    };

    const onTouchStart = (e: TouchEvent) => {
      const scrollTop = getScrollTop(e.target);
      // Only arm the pull-to-refresh if the scrollable container is at the top
      if (scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      } else {
        pulling.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - startY.current;
      const scrollTop = getScrollTop(e.target);

      // Always block the browser's native pull-to-refresh when at top + swiping down
      if (deltaY > 0 && scrollTop === 0) {
        e.preventDefault();
      }

      // Custom PTR only when player is closed and we're pulling down from the top
      if (!isPlayerExpandedRef.current && pulling.current && deltaY > 0 && scrollTop === 0) {
        // Apply resistance so it feels physical
        const resistance = 0.45;
        const clamped = Math.min(deltaY * resistance, MAX_PULL);
        pullDistanceRef.current = clamped;
        setPullDistance(clamped);
      } else if (pulling.current && scrollTop > 0) {
        // User scrolled down — cancel any in-progress pull
        pullDistanceRef.current = 0;
        setPullDistance(0);
        pulling.current = false;
      }
    };

    const onTouchEnd = () => {
      if (!isPlayerExpandedRef.current && pulling.current && pullDistanceRef.current >= TRIGGER_THRESHOLD) {
        setIsRefreshing(true);
        // Small delay so the user sees the spinner before reload
        setTimeout(() => window.location.reload(), 500);
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
      pulling.current = false;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render anything if player is open or nothing is happening
  if (isPlayerExpanded || (pullDistance === 0 && !isRefreshing)) return null;

  const progress = Math.min(pullDistance / TRIGGER_THRESHOLD, 1);
  const isTriggered = pullDistance >= TRIGGER_THRESHOLD || isRefreshing;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex flex-col items-center justify-end pb-2 pointer-events-none"
      style={{
        height: `${isRefreshing ? 72 : Math.max(pullDistance, 0)}px`,
        transition: pullDistance === 0 ? 'height 0.3s ease' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          opacity: Math.min(progress * 1.5, 1),
          transform: `scale(${isTriggered ? 1.15 : 0.6 + progress * 0.4})`,
          transition: isTriggered
            ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, border-color 0.2s ease'
            : pullDistance === 0 ? 'all 0.3s ease' : 'none',
          background: isTriggered ? 'rgba(42, 161, 152, 0.25)' : 'rgba(7, 54, 66, 0.9)',
          border: isTriggered ? '1.5px solid rgba(42, 161, 152, 0.9)' : '1px solid rgba(42, 161, 152, 0.35)',
          backdropFilter: 'blur(12px)',
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        {isTriggered && !isRefreshing ? (
          /* Checkmark — "release to refresh" */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#2aa198" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          /* Spinning arc */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={isTriggered ? '#2aa198' : '#2aa198'}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 270}deg)`,
              animation: isRefreshing ? 'ptr-spin 0.7s linear infinite' : 'none',
              transition: 'none',
            }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: isTriggered ? '#2aa198' : 'rgba(147, 161, 161, 0.8)',
          opacity: Math.min(progress * 2, 1),
          transition: 'color 0.2s ease',
          fontFamily: 'var(--font-outfit, sans-serif)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {isRefreshing ? 'Refreshing…' : isTriggered ? 'Release to refresh' : 'Pull to refresh'}
      </span>

      <style>{`
        @keyframes ptr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
