"use client";

import { useEffect } from "react";

import FiltersBar from "@/components/FiltersBar";
import LaptopCard from "@/components/LaptopCard";
import { EmptyState, ErrorBanner, GridSkeleton, Pagination } from "@/components/ui";
import { useLaptops } from "@/hooks/useLaptops";

export default function HomeContent() {
  const { filters, applyFilters, reset, page, setPage, data, loading, error, hasActiveFilters } =
    useLaptops();

  // Hydrate the search term from the URL (?q=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) applyFilters({ q });
    const brand = params.get("brand");
    if (brand) applyFilters({ brand });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-16">
          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Used laptops, <span className="text-gradient">honestly priced</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500 sm:text-base dark:text-zinc-400">
            Verified listings with real photos, full specs and transparent battery health.
            Buy with confidence, sell in minutes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 -mt-8 relative z-10">
          <FiltersBar
            filters={filters}
            brands={data?.brands ?? []}
            onChange={applyFilters}
            onReset={reset}
            hasActive={hasActiveFilters}
            resultCount={data?.total}
          />
        </div>

        {error ? (
          <ErrorBanner message={error} />
        ) : loading && !data ? (
          <GridSkeleton count={8} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? "No laptops match your filters" : "No listings yet"}
            message={
              hasActiveFilters
                ? "Try widening the price range or clearing a filter or two."
                : "Be the first to list a laptop on LapLoop."
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.items.map((laptop) => (
                <LaptopCard key={laptop.id} laptop={laptop} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                page={page}
                pages={data?.pages ?? 1}
                total={data?.total ?? 0}
                onPage={setPage}
                disabled={loading}
              />
            </div>
          </>
        )}
      </section>
    </>
  );
}