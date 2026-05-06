'use client';

import { useEffect } from 'react';
import { supabase } from '@/utils/supabase';

// This hook makes the current user broadcast their presence
// to the shared 'online-users' channel while they have the app open.
// It cleans up automatically when they close/leave the tab.
export function usePresence(userId: string | null, displayName: string | null) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId,
          displayName: displayName ?? 'Unknown User',
          onlineAt: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, displayName]);
}
