import StatsPanel from "@/components/admin/StatsPanel";
import LiveFeed from "@/components/admin/LiveFeed";
import OnlineUsers from "@/components/admin/OnlineUsers";

export default function GodModePage() {
  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-[#2aa198] mb-1">Bird's Eye View</h2>
        <p className="text-xs text-[#586e75] font-mono">Live snapshot of your database. Auto-refreshes every 30s.</p>
      </div>

      {/* Stats: KPI cards + recent tables */}
      <StatsPanel />

      {/* Who is online right now */}
      <OnlineUsers />

      {/* Realtime database event stream */}
      <LiveFeed />
    </div>
  );
}
