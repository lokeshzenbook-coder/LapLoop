"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { cn, initial } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Browse" },
  { href: "/dashboard", label: "My listings" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
    setOpen(false);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
            </svg>
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Lap<span className="text-gradient">Loop</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-md">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search laptops… (e.g. MacBook Pro 16GB)"
              className="input pl-9"
              aria-label="Search laptops"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-4">
          <ThemeToggle />
          <Link href="/sell" className="btn-primary hidden !px-3.5 !py-2 text-xs sm:inline-flex">
            + Sell laptop
          </Link>
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  {initial(user.name)}
                </span>
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={logout}
                className="rounded-xl px-2.5 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-outline hidden !px-3.5 !py-2 text-xs md:inline-flex">
              Log in
            </Link>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 md:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-200 px-4 pb-4 pt-3 md:hidden dark:border-zinc-800 animate-fade-in">
          <form onSubmit={submitSearch} className="mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search laptops…"
              className="input"
              aria-label="Search laptops"
            />
          </form>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-medium",
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/sell" onClick={() => setOpen(false)} className="btn-primary mt-1">
              + Sell laptop
            </Link>
            {user ? (
              <div className="mt-1 flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <span className="text-sm font-medium">{user.name}</span>
                <button onClick={logout} className="text-sm text-rose-500">
                  Log out
                </button>
              </div>
            ) : (
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}