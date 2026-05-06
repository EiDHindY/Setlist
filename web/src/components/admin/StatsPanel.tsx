'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalSongs: number;
  totalUsers: number;
  recentUsers: { Id: string; DisplayName: string; Email: string; CreatedAt: string }[];
}

function StatCard({
  label,
  value,
  color,
  loading,
  onClick,
}: {
  label: string;
  value: number | string;
  color: string;
  loading: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-6 bg-[#073642] rounded-xl border border-[#586e75]/20 shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#2aa198]/50 hover:shadow-[0_0_20px_rgba(42,161,152,0.15)] hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-xs tracking-widest uppercase text-[#93a1a1] font-semibold">{label}</h3>
        {onClick && (
          <span className="text-[10px] text-[#2aa198]/60 font-mono tracking-widest uppercase">Click to explore →</span>
        )}
      </div>
      {loading ? (
        <div className="mt-3 h-10 w-24 bg-[#002b36] rounded animate-pulse" />
      ) : (
        <p className={`text-4xl font-bold mt-2 tracking-tight ${color}`}>{value}</p>
      )}
    </div>
  );
}

function RecentTable({
  title,
  rows,
  columns,
  loading,
  onRowClick,
}: {
  title: string;
  rows: any[];
  columns: { key: string; label: string }[];
  loading: boolean;
  onRowClick?: (row: any) => void;
}) {
  return (
    <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#586e75]/20">
        <h3 className="text-sm font-semibold tracking-widest uppercase text-[#93a1a1]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-xs text-[#586e75] uppercase">
              {columns.map((c) => (
                <th key={c.key} className="px-5 py-3 text-left font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-[#586e75]/10">
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-3">
                      <div className="h-4 bg-[#002b36] rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-6 text-center text-[#586e75]">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={`border-t border-[#586e75]/10 transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-[#2aa198]/10' : 'hover:bg-[#002b36]/50'
                  }`}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-5 py-3 text-[#93a1a1] truncate max-w-xs">
                      {c.key === 'CreatedAt'
                        ? new Date(row[c.key]).toLocaleString()
                        : row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-[#dc322f]/10 border border-[#dc322f]/30 rounded-xl text-[#dc322f] text-sm font-mono">
          ⚠ API Error: {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
        <StatCard
          label="Total Songs"
          value={stats?.totalSongs ?? 0}
          color="text-[#268bd2]"
          loading={loading}
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          color="text-[#2aa198]"
          loading={loading}
          onClick={() => router.push('/admin/users')}
        />
      </div>

      {/* Recently Joined Users */}
      <RecentTable
        title="Recently Joined Users"
        rows={stats?.recentUsers ?? []}
        loading={loading}
        onRowClick={(row) => router.push(`/admin/users/${row.Id}`)}
        columns={[
          { key: 'DisplayName', label: 'Name' },
          { key: 'Email', label: 'Email' },
          { key: 'CreatedAt', label: 'Joined At' },
        ]}
      />
    </div>
  );
}
