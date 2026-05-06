'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { supabaseClient } from '@/lib/supabase-client';

export default function LiveFeed() {
  const { events, addEvent } = useAdminStore();
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    // Subscribe to all changes in the public schema
    const channel = supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public', // Listen to all tables in the public schema
        },
        (payload) => {
          addEvent({
            table: payload.table,
            action: payload.eventType as any,
            payload: payload.new || payload.old || payload,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('Connected & Listening');
        } else if (status === 'CLOSED') {
          setStatus('Disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('Error connecting to Realtime. Check if it is enabled for tables in Supabase Dashboard.');
        }
      });

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [addEvent]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm tracking-widest uppercase text-[#cb4b16] font-semibold flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status === 'Connected & Listening' ? 'bg-[#cb4b16] animate-pulse' : 'bg-[#586e75]'}`}></span>
          Live Database Feed
        </h3>
        <span className="text-xs text-[#586e75] font-mono">{status}</span>
      </div>
      
      <div className="bg-[#00141a] rounded-xl p-4 font-mono text-xs text-[#839496] h-96 overflow-y-auto border border-[#073642] shadow-inner relative">
        <div className="sticky top-0 left-0 w-full h-8 bg-gradient-to-b from-[#00141a] to-transparent pointer-events-none mb-2"></div>
        
        {events.length === 0 ? (
          <div className="opacity-50 pb-4 text-center mt-10">
             <p>[SYSTEM] Listening to 'public' schema.</p>
             <p className="mt-2 text-[#b58900]">Waiting for database changes...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-8">
            {events.map((ev) => (
              <div key={ev.id} className="border-l-2 border-[#cb4b16]/30 pl-3">
                <div className="flex gap-2 items-center mb-1">
                  <span className="text-[#586e75]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ev.action === 'INSERT' ? 'bg-[#859900]/20 text-[#859900]' :
                    ev.action === 'UPDATE' ? 'bg-[#b58900]/20 text-[#b58900]' :
                    'bg-[#dc322f]/20 text-[#dc322f]'
                  }`}>
                    {ev.action}
                  </span>
                  <span className="text-[#2aa198] font-bold">{ev.table}</span>
                </div>
                <pre className="text-[#93a1a1] overflow-x-auto p-2 bg-black/20 rounded">
                  {JSON.stringify(ev.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
        
        <div className="sticky bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#00141a] to-transparent pointer-events-none mt-2"></div>
      </div>
    </div>
  );
}
