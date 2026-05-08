'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';

interface OnlineUser {
  userId: string;
  displayName: string;
  onlineAt: string;
}

export default function OnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const channel = supabaseClient.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<OnlineUser>();
        const online: OnlineUser[] = Object.values(state)
          .map((presences: any) => presences[0])
          .filter(Boolean)
          .map((p: any) => ({
            userId: p.userId,
            displayName: p.displayName,
            onlineAt: p.onlineAt,
          }));
        setUsers(online);
      })
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') setStatus('Live');
        else if (s === 'CLOSED') setStatus('Disconnected');
        else if (s === 'CHANNEL_ERROR') setStatus('Error');
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#586e75]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'Live' ? 'bg-[#859900] animate-pulse' : 'bg-[#586e75]'}`} />
          <h3 className="text-sm font-semibold tracking-widest uppercase text-[#93a1a1]">
            Online Right Now
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#586e75]">{status}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#859900]/20 text-[#859900] text-xs font-bold font-mono">
            {users.length} online
          </span>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-8 text-center text-[#586e75] text-sm font-mono">
          No users online right now.
        </div>
      ) : (
        <ul className="divide-y divide-[#586e75]/10">
          {users.map((u) => (
            <li key={u.userId} className="px-5 py-3 flex items-center justify-between hover:bg-[#002b36]/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#859900] animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#eee8d5] font-semibold">{u.displayName}</p>
                  <p className="text-xs text-[#586e75] font-mono">{u.userId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#586e75] font-mono">
                  since {new Date(u.onlineAt).toLocaleTimeString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
