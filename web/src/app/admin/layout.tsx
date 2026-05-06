
import { ReactNode } from "react";

const sha = process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev";
const branch = process.env.NEXT_PUBLIC_BUILD_BRANCH ?? "local";
const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME
  ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString()
  : "—";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#002b36] text-[#839496] font-mono z-50 relative">
      <nav className="border-b border-[#073642] p-4 bg-[#002b36]/90 backdrop-blur sticky top-0">
        <div className="flex flex-wrap justify-between items-center max-w-7xl mx-auto gap-3">
          <h1 className="text-xl font-bold text-[#b58900] tracking-widest">
            SETLIST <span className="opacity-50">//</span> GOD MODE
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Build Identity */}
            <a
              href={`https://github.com/EiDHindY/Setlist/commit/${sha}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Built at ${buildTime}`}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#073642] border border-[#586e75]/20 hover:border-[#2aa198]/40 transition-colors"
            >
              <span className="text-[#586e75]">branch:</span>
              <span className="text-[#b58900] font-bold">{branch}</span>
              <span className="text-[#586e75]">@</span>
              <span className="text-[#2aa198] font-bold">{sha}</span>
            </a>
            <span className="text-[#859900] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#859900] animate-pulse"></span>
              SYSTEM SECURE
            </span>
          </div>
        </div>
      </nav>
      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

