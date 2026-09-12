"use client";

import Link from "next/link";
import { useState } from "react";

import LaptopImage from "@/components/LaptopImage";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  cn,
  conditionLabel,
  conditionTone,
  formatCompactPrice,
  formatPrice,
  timeAgo,
} from "@/lib/utils";
import type { Laptop } from "@/types";

export default function LaptopCard({ laptop }: { laptop: Laptop }) {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(!!laptop.isFavorite);
  const [busy, setBusy] = useState(false);
  const cover = laptop.images?.[0]?.url;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/login?next=" + encodeURIComponent(`/laptops/${laptop.id}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post<{ favorite: boolean }>(`/laptops/${laptop.id}/favorite`);
      setFavorite(res.favorite);
    } catch {
      // ignore transient errors
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link
      href={`/laptops/${laptop.id}`}
      className="group card block overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-900/10 dark:hover:shadow-black/40"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white dark:bg-zinc-900">
        <LaptopImage
          src={cover}
          alt={`${laptop.brand} ${laptop.model}`}
          className="object-contain p-2 transition duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
            conditionTone(laptop.condition)
          )}
        >
          {conditionLabel(laptop.condition)}
        </span>
        <button
          onClick={toggleFavorite}
          aria-label="Save to favorites"
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition",
            favorite
              ? "bg-rose-500 text-white"
              : "bg-white/80 text-zinc-500 hover:text-rose-500 dark:bg-zinc-900/80 dark:text-zinc-300",
            busy && "opacity-60"
          )}
        >
          <svg viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {laptop.brand}
            </p>
            <h3 className="mt-0.5 truncate text-sm font-semibold group-hover:text-brand-600 dark:group-hover:text-brand-400">
              {laptop.model}
            </h3>
          </div>
          <p className="whitespace-nowrap text-base font-bold text-zinc-900 dark:text-white">
            {formatPrice(laptop.price)}
          </p>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="chip">{laptop.ramGB} GB</span>
          <span className="chip">{laptop.storageGB} GB {laptop.storageType}</span>
          {laptop.cpu && (
            <span className="chip max-w-[9rem] truncate">{laptop.cpu}</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="max-w-28 truncate">{laptop.location || "—"}</span>
          </span>
          <span>{timeAgo(laptop.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function CompactPrice({ price }: { price: number }) {
  return <span className="font-bold">{formatCompactPrice(price)}</span>;
}