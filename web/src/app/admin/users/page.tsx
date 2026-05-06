'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  Id: string;
  DisplayName: string;
  Email: string;
  CreatedAt: string;
  songCount: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setUsers(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/godmode')}
          className="text-[#586e75] hover:text-[#2aa198] transition-colors text-sm font-mono"
        >
          ← Back to God Mode
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[#2aa198]">All Users</h2>
        <p className="text-xs text-[#586e75] font-mono mt-1">
          {loading ? 'Loading...' : `${users.length} users total`}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#dc322f]/10 border border-[#dc322f]/30 rounded-xl text-[#dc322f] text-sm font-mono">
          ⚠ {error}
        </div>
      )}

      <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 shadow-lg overflow-hidden">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-xs text-[#586e75] uppercase border-b border-[#586e75]/20">
              <th className="px-5 py-4 text-left font-semibold">Name</th>
              <th className="px-5 py-4 text-left font-semibold">Email</th>
              <th className="px-5 py-4 text-left font-semibold">Songs</th>
              <th className="px-5 py-4 text-left font-semibold">Joined At</th>
              <th className="px-5 py-4 text-left font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#586e75]/10">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-[#002b36] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((u) => (
                  <tr
                    key={u.Id}
                    onClick={() => router.push(`/admin/users/${u.Id}`)}
                    className="border-t border-[#586e75]/10 cursor-pointer hover:bg-[#2aa198]/10 transition-colors"
                  >
                    <td className="px-5 py-4 text-[#eee8d5] font-semibold">
                      {u.DisplayName || '—'}
                    </td>
                    <td className="px-5 py-4 text-[#93a1a1]">{u.Email}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded bg-[#268bd2]/20 text-[#268bd2] text-xs font-bold">
                        {u.songCount} songs
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#586e75]">
                      {new Date(u.CreatedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-[#2aa198] text-xs">View →</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
