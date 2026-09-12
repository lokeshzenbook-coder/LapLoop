"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ImageGallery from "@/components/ImageGallery";
import InquiryForm from "@/components/InquiryForm";
import { BrandLogo } from "@/components/BrandLogo";
import { ErrorBanner, LoadingPage, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  cn,
  conditionLabel,
  conditionTone,
  formatDate,
  formatPrice,
  timeAgo,
} from "@/lib/utils";
import type { Laptop } from "@/types";

export default function LaptopDetail({ id }: { id: number }) {
  const { user } = useAuth();
  const [laptop, setLaptop] = useState<Laptop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const l = await api.get<Laptop>(`/laptops/${id}`);
        if (cancelled) return;
        setLaptop(l);
        setFavorite(!!l.isFavorite);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load this listing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) {
      window.location.href = "/login?next=" + encodeURIComponent(`/laptops/${laptop?.id}`);
      return;
    }
    if (favBusy || !laptop) return;
    setFavBusy(true);
    try {
      const res = await api.post<{ favorite: boolean }>(`/laptops/${laptop.id}/favorite`);
      setFavorite(res.favorite);
    } catch {
      // ignore
    } finally {
      setFavBusy(false);
    }
  };

  if (loading) return <LoadingPage label="Loading listing" />;
  if (error || !laptop) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorBanner message={error || "Listing not found."} /></div>;

  const isOwn = user?.id === laptop.seller?.id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400">Home</Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">{laptop.brand}</span>
        <span>/</span>
        <span className="max-w-44 truncate text-zinc-600 dark:text-zinc-300">{laptop.model}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Gallery */}
        <div className="lg:col-span-3">
          <ImageGallery images={laptop.images} title={`${laptop.brand} ${laptop.model}`} />
        </div>

        {/* Main panel */}
        <div className="lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", conditionTone(laptop.condition))}>
                  {conditionLabel(laptop.condition)}
                </span>
                <h1 className="mt-2 text-xl font-bold leading-tight sm:text-2xl">
                  {laptop.brand} {laptop.model}
                </h1>
              </div>
              <button
                onClick={toggleFavorite}
                disabled={favBusy}
                aria-label="Save to favorites"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
                  favorite
                    ? "bg-rose-500 text-white"
                    : "border border-zinc-300 text-zinc-400 hover:text-rose-500 dark:border-zinc-700",
                  favBusy && "opacity-60"
                )}
              >
                {favBusy ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <svg viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-zinc-900 dark:text-white">
              {formatPrice(laptop.price)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {laptop.location}
              </span>
              <span>· listed {timeAgo(laptop.createdAt)}</span>
              <span>· {laptop.views} views</span>
            </div>

            <div className="my-5 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-900">
              <Stat label="RAM" value={`${laptop.ramGB} GB`} />
              <Stat label="Storage" value={`${laptop.storageGB} GB`} />
              <Stat label="Battery" value={`${laptop.batteryHealth}%`} />
            </div>

            <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800">
              {isOwn ? (
                <div className="flex flex-col gap-2">
                  <Link href={`/sell/${laptop.id}`} className="btn-outline w-full">Edit listing</Link>
                  <p className="text-center text-xs text-zinc-400">This is your listing.</p>
                </div>
              ) : (
                <>
                  <h3 className="label">Message the seller</h3>
                  <InquiryForm laptopId={laptop.id} sellerName={laptop.seller?.name ?? "the seller"} />
                </>
              )}
            </div>
          </div>

          {/* Seller card */}
          <div className="mt-4 flex items-center gap-3 p-4">
            <BrandLogo brand={laptop.seller?.name ?? "S"} size={12} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                {laptop.seller?.name}
                <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" /></svg>
                  Verified
                </span>
              </p>
              <p className="truncate text-xs text-zinc-400">
                {laptop.seller?.location || "LapLoop member"} · joined via email verification
              </p>
            </div>
            <span className="ml-auto text-[10px] text-zinc-400">Member since {laptop.seller?.id ? "2026" : "—"}</span>
          </div>
        </div>
      </div>

      {/* Description + specs */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="card p-6 animate-fade-in">
            <h2 className="text-lg font-bold">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {laptop.description || "No description provided. Ask the seller for details."}
            </p>
            <div className="mt-5 border-t border-zinc-100 pt-4 text-xs text-zinc-400 dark:border-zinc-800">
              Listing #L{String(laptop.id).padStart(4, "0")} · listed {formatDate(laptop.createdAt)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6 animate-fade-in">
            <h2 className="text-lg font-bold">Specifications</h2>
            <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
              <SpecRow k="Brand" v={laptop.brand} />
              <SpecRow k="Model" v={laptop.model} />
              <SpecRow k="Processor" v={laptop.cpu} />
              <SpecRow k="RAM" v={`${laptop.ramGB} GB`} />
              <SpecRow k="Storage" v={`${laptop.storageGB} GB ${laptop.storageType}`} />
              <SpecRow k="Graphics" v={laptop.gpu || "Integrated"} />
              <SpecRow k="Display" v={laptop.display || "—"} />
              <SpecRow k="Condition" v={conditionLabel(laptop.condition)} />
              <SpecRow k="Age" v={`${laptop.ageYears} ${laptop.ageYears === 1 ? "year" : "years"}`} />
              <SpecRow k="Battery health" v={`${laptop.batteryHealth}%`} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
    </div>
  );
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-zinc-400">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}