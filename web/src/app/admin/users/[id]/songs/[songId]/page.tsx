'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface SongDetail {
  song: Record<string, any>;
  userSong: Record<string, any> | null;
  versions: any[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-[#002b36] rounded-xl p-4 border border-[#586e75]/20 flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-widest text-[#586e75] font-semibold">{label}</p>
      <p className={`text-3xl font-bold tracking-tight font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#586e75] font-mono">{sub}</p>}
    </div>
  );
}

export default function UserSongDetailPage() {
  const [data, setData] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const songId = params.songId as string;

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/songs/${songId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, songId]);

  const formatPlayTime = (totalSeconds: number) => {
    if (!totalSeconds) return '0s';
    if (totalSeconds < 60) return `${totalSeconds}s`;
    if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatVersionDuration = (seconds: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const song = data?.song;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push(`/admin/users/${userId}`)}
        className="text-[#586e75] hover:text-[#2aa198] transition-colors text-sm font-mono"
      >
        ← Back to User Detail
      </button>

      {error && (
        <div className="p-4 bg-[#dc322f]/10 border border-[#dc322f]/30 rounded-xl text-[#dc322f] text-sm font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Song Header */}
      <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 p-6 shadow-lg">
        {loading ? (
          <div className="space-y-3">
            <div className="h-8 w-48 bg-[#002b36] rounded animate-pulse" />
            <div className="h-4 w-36 bg-[#002b36] rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#eee8d5]">{song?.Title || 'Unknown Song'}</h2>
              <p className="text-[#2aa198] font-mono text-base mt-1">{song?.Artist}</p>
              {data?.userSong?.AddedAt && (
                <p className="text-xs text-[#586e75] font-mono mt-2">
                  Added to library: {new Date(data.userSong.AddedAt).toLocaleString()}
                </p>
              )}
            </div>
            {song?.AlbumArtUrl && (
              <img
                src={song.AlbumArtUrl}
                alt="Album Art"
                className="w-20 h-20 rounded-xl shadow-md border border-[#586e75]/20 flex-shrink-0"
              />
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div>
        <h3 className="text-xs tracking-widest uppercase text-[#93a1a1] font-semibold mb-4">Song Stats</h3>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#073642] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Play Count"
              value={song?.PlayCount ?? 0}
              sub={song?.PlayCount === 1 ? 'time played' : 'times played'}
              color="text-[#268bd2]"
            />
            <StatCard
              label="Total Play Time"
              value={formatPlayTime(song?.TotalPlaySeconds ?? 0)}
              sub={`${song?.TotalPlaySeconds ?? 0} raw seconds`}
              color="text-[#2aa198]"
            />
            <StatCard
              label="Matches Won"
              value={song?.MatchesWon ?? 0}
              sub="in Clash Arena"
              color="text-[#b58900]"
            />
            <StatCard
              label="Tournaments Won"
              value={song?.TournamentsWon ?? 0}
              sub="tournament victories"
              color="text-[#cb4b16]"
            />
            <StatCard
              label="Win Rate"
              value={`${((song?.WinRate ?? 0) * 100).toFixed(1)}%`}
              sub="across all matches"
              color={
                (song?.WinRate ?? 0) >= 0.6
                  ? 'text-[#859900]'
                  : (song?.WinRate ?? 0) >= 0.4
                  ? 'text-[#b58900]'
                  : 'text-[#dc322f]'
              }
            />
          </div>
        )}
      </div>

      {/* Versions Table */}
      <div className="bg-[#073642] rounded-xl border border-[#586e75]/20 shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#586e75]/20 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-[#93a1a1]">
            User's Versions
          </h3>
          {!loading && (
            <span className="text-xs font-mono text-[#268bd2]">
              {data?.versions.length ?? 0} version{(data?.versions.length ?? 0) !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-xs text-[#586e75] uppercase">
              <th className="px-5 py-3 text-left font-semibold">Version Title</th>
              <th className="px-5 py-3 text-left font-semibold">YouTube ID</th>
              <th className="px-5 py-3 text-left font-semibold">Channel</th>
              <th className="px-5 py-3 text-left font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#586e75]/10">
                    {[1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-[#002b36] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.versions.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[#586e75]">
                    No versions saved for this song by this user.
                  </td>
                </tr>
              )
              : (data?.versions ?? []).map((v) => (
                  <tr key={v.Id} className="border-t border-[#586e75]/10 hover:bg-[#002b36]/50 transition-colors">
                    <td className="px-5 py-3 text-[#eee8d5]">{v.Title}</td>
                    <td className="px-5 py-3">
                      <a
                        href={`https://youtube.com/watch?v=${v.YouTubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#268bd2] hover:text-[#2aa198] transition-colors underline"
                      >
                        {v.YouTubeId}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-[#93a1a1]">{v.ChannelName || '—'}</td>
                    <td className="px-5 py-3 text-[#586e75]">{formatVersionDuration(v.Duration)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
