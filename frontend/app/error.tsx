"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-5xl">⚠️</span>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  );
}