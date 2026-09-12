"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LaptopImage from "@/components/LaptopImage";
import { EmptyState, ErrorBanner, LoadingPage, Spinner, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn, formatCompactPrice, formatDate, initial, pluralize, timeAgo } from "@/lib/utils";
import type { Laptop } from "@/types";

export default function Dashboard() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Laptop[] | null>(null);
  const [loadingListings, setLoadingListings] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }
    refresh().catch(() => {});
    api
      .get<{ items: Laptop[]; total: number }>("/me/listings")
      .then((res) => setListings(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load your listings."))
      .finally(() => setLoadingListings(false));
  }, [user, loading, router, refresh]);

  const removeListing = async (id: number) => {
    if (!window.confirm("Delete this listing and its photos? This can't be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/laptops/${id}`);
      setListings((prev) => prev?.filter((l) => l.id !== id) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete listing.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading || loadingListings) return <LoadingPage label="Loading dashboard" />;

  const active = listings?.filter((l) => l.status === "active").length ?? 0;
  const totalViews = listings?.reduce((sum, l) => sum + l.views, 0) ?? 0;
  const sold = listings?.filter((l) => l.status === "sold").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
            {initial(user?.name ?? "?")}
          </span>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Hi, {user?.name?.split(" ")[0]}</h1>
            <p className="text-sm text-zinc-400">{user?.email}</p>
          </div>
        </div>
        <Link href="/sell" className="btn-primary">+ Sell a laptop</Link>
      </header>

      {error && <div className="mt-6"><ErrorBanner message={error} /></div>}

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Active listings" value={String(active)} accent="#10b981" />
        <StatCard label="Total views" value={totalViews.toLocaleString()} accent="#4b6efb" />
        <StatCard label={`Sold`} value={String(sold)} accent="#a855f7" />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold">
          My listings{" "}
          <span className="text-sm font-normal text-zinc-400">
            ({pluralize(listings?.length ?? 0, "listing")})
          </span>
        </h2>

        {listings && listings.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="🖥️"
              title="No listings yet"
              message="List your first laptop — it takes about two minutes."
              action={
                <Link href="/sell" className="btn-primary mt-2">Start a listing</Link>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {listings?.map((l) => (
              <DashboardRow
                key={l.id}
                laptop={l}
                onDelete={() => removeListing(l.id)}
                deleting={deleting === l.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-2xl font-extrabold" style={{ color: accent }}>{value}</p>
      <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function DashboardRow({
  laptop,
  onDelete,
  deleting,
}: {
  laptop: Laptop;
  onDelete: () => void;
  deleting: boolean;
}) {
  const rating = qualityScore(laptop);
  return (
    <div className="card flex items-center gap-4 p-3 sm:p-4 animate-fade-in">
      <Link href={`/laptops/${laptop.id}`} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-white dark:bg-zinc-900">
        <LaptopImage src={laptop.images?.[0]?.url} alt={laptop.model} className="object-contain" sizes="112px" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/laptops/${laptop.id}`}
            className="truncate text-sm font-semibold hover:text-brand-600 dark:hover:text-brand-400"
          >
            {laptop.brand} {laptop.model}
          </Link>
          <StatusBadge status={laptop.status} />
        </div>
        <p className="mt-1 truncate text-xs text-zinc-400">
          {laptop.ramGB} GB · {laptop.storageGB} GB {laptop.storageType} · {laptop.location}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {laptop.views} views · {timeAgo(laptop.createdAt)} {rating && <span className="text-emerald-500">· {rating}</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        <span className="text-lg font-bold">{formatCompactPrice(laptop.price)}</span>
        <div className="flex gap-1.5">
          <Link href={`/sell/${laptop.id}`} className="btn-outline !px-3 !py-1.5 text-xs">
            Edit
          </Link>
          <button onClick={onDelete} disabled={deleting} className="btn !px-3 !py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40">
            {deleting ? <Spinner className="h-3.5 w-3.5" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function qualityScore(l: Laptop): string {
  if (l.status === "active" && l.images.length >= 3 && l.description.length >= 80) {
    return "★ Top rated listing";
  }
  return "";
}