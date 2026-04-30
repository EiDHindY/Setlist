'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#002b36] text-red-500 flex-col">
      <h2>Something went wrong in callback!</h2>
      <pre className="text-sm mt-4 p-4 bg-black rounded max-w-full overflow-auto">
        {error.message}
      </pre>
    </div>
  );
}
