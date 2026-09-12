import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="text-5xl">🔌</span>
      <h1 className="text-2xl font-bold">404 — page not found</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        That laptop listing or page doesn&apos;t exist (anymore).
      </p>
      <Link href="/" className="btn-primary">Back to the marketplace</Link>
    </div>
  );
}