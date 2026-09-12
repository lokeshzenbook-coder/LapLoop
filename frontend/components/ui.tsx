"use client";

import { cn } from "@/lib/utils";
import { pluralize } from "@/lib/utils";
import { STATUS_LABELS } from "@/types";
import type { ReactNode } from "react";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      aria-label="Loading"
    />
  );
}

export function LoadingPage({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-400">
      <Spinner className="h-7 w-7 text-brand-500" />
      <p className="text-sm">{label}...</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-200/70 dark:bg-zinc-800">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
      <div className={className} />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between pt-1.5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "🔍",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-14 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-zinc-800">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="card animate-fade-in border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
      {message}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
  disabled,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  if (pages <= 1) return null;
  const pagesArr = pageWindow(page, pages);
  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2" aria-label="Pagination">
      <PageBtn disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>
        ← Prev
      </PageBtn>
      {pagesArr.map((p) => (
        <PageBtn
          key={p}
          active={p === page}
          disabled={disabled}
          onClick={() => onPage(p)}
        >
          {p}
        </PageBtn>
      ))}
      <PageBtn disabled={disabled || page >= pages} onClick={() => onPage(page + 1)}>
        Next →
      </PageBtn>
      <span className="ml-3 hidden text-xs text-zinc-400 sm:inline">
        {pluralize(total, "result")}
      </span>
    </nav>
  );
}

function pageWindow(page: number, pages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

function PageBtn({
  children,
  onClick,
  active,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-w-9 rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    sold: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    inactive: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  }[status] ?? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}