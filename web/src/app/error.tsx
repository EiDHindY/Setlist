'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#002b36] text-red-500 flex-col z-50 fixed inset-0">
      <h2 className="text-xl font-bold mb-4">CRASH DETECTED</h2>
      <pre className="text-sm p-4 bg-black/50 text-white rounded max-w-full overflow-auto break-words">
        {error.message}
        <br/><br/>
        {error.stack}
      </pre>
      <button onClick={reset} className="mt-8 px-6 py-2 bg-red-500 text-white rounded">Retry</button>
    </div>
  );
}
