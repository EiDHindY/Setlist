'use client';


import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface UserDetail {
  user: Record<string, any>;
  songs: { Id: string; Title: string; Artist: string; Duration: number; addedAt: string }[];
  setlists: { Id: string; Name: string; CreatedAt: string }[];
}

export default function UserDetailPage() {
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="text-[#586e75] hover:text-[#2aa198] transition-colors text-sm font-mono"
        >
          ← Back to Users
        </button>
      </div>

      {error && (
        <div className="p-4 bg-[#dc322f]/10 border border-[#dc322f]/30 rounded-xl text-[#dc322f] text-sm font-mono">
          ⚠ {error}
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 p-6 shadow-lg">
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-48 bg-[#002b36] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#002b36] rounded animate-pulse" />
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-[#eee8d5]">
              {data?.user.DisplayName || 'Unknown User'}
            </h2>
            <p className="text-[#586e75] font-mono text-sm mt-1">{data?.user.Email}</p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(data?.user ?? {}).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#586e75] font-semibold">{key}</p>
                  <p className="text-xs text-[#93a1a1] font-mono break-all">
                    {val === null || val === undefined
                      ? '—'
                      : typeof val === 'object'
                      ? JSON.stringify(val)
                      : String(val)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Songs Table */}
      <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#586e75]/20 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-[#93a1a1]">Library</h3>
          {!loading && (
            <span className="text-xs font-mono text-[#268bd2]">{data?.songs.length ?? 0} songs</span>
          )}
        </div>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-xs text-[#586e75] uppercase">
              <th className="px-5 py-3 text-left font-semibold">Title</th>
              <th className="px-5 py-3 text-left font-semibold">Artist</th>
              <th className="px-5 py-3 text-left font-semibold">Duration</th>
              <th className="px-5 py-3 text-left font-semibold">Added At</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#586e75]/10">
                    {[1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-[#002b36] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : (data?.songs ?? []).map((song) => (
                  <tr 
                    key={song.Id} 
                    onClick={() => router.push(`/admin/users/${id}/songs/${song.Id}`)}
                    className="border-t border-[#586e75]/10 hover:bg-[#2aa198]/10 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 text-[#eee8d5]">{song.Title}</td>
                    <td className="px-5 py-3 text-[#93a1a1]">{song.Artist}</td>
                    <td className="px-5 py-3 text-[#586e75]">{formatDuration(song.Duration)}</td>
                    <td className="px-5 py-3 text-[#586e75]">
                      {new Date(song.addedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Setlists */}
      {!loading && (data?.setlists ?? []).length > 0 && (
        <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 shadow-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#586e75]/20">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-[#93a1a1]">Setlists</h3>
          </div>
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-xs text-[#586e75] uppercase">
                <th className="px-5 py-3 text-left font-semibold">Name</th>
                <th className="px-5 py-3 text-left font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {data?.setlists.map((sl) => (
                <tr key={sl.Id} className="border-t border-[#586e75]/10 hover:bg-[#002b36]/50 transition-colors">
                  <td className="px-5 py-3 text-[#eee8d5]">{sl.Name}</td>
                  <td className="px-5 py-3 text-[#586e75]">{new Date(sl.CreatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
