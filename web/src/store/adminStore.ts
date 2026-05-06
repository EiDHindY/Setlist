import { create } from 'zustand';

export interface RealtimeEvent {
  id: string;
  timestamp: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  payload: any;
}

interface AdminState {
  events: RealtimeEvent[];
  addEvent: (event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  events: [],
  addEvent: (event) => set((state) => {
    const newEvent: RealtimeEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    // Keep only the last 100 events to prevent memory leaks in the browser
    return { events: [newEvent, ...state.events].slice(0, 100) };
  }),
  clearEvents: () => set({ events: [] }),
}));
