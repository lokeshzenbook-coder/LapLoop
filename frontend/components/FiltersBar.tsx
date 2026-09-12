"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { BRANDS, CONDITIONS, type Filters, type SortKey } from "@/types";

const RAM_OPTIONS = [0, 8, 16, 32, 64];
const STORAGE_OPTIONS = [0, 256, 512, 1024, 2048];

export default function FiltersBar({
  filters,
  brands,
  onChange,
  onReset,
  hasActive,
  resultCount,
}: {
  filters: Filters;
  brands: string[];
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  hasActive: boolean;
  resultCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const brandOptions = Array.from(new Set([...BRANDS, ...brands])).sort();

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "btn !px-3.5 !py-2 text-xs",
            open ? "btn-primary" : "btn-outline"
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          Filters
          {hasActive && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {activeCount(filters)}
            </span>
          )}
        </button>

        {hasActive && (
          <button
            onClick={onReset}
            className="btn-ghost !px-3 !py-2 text-xs text-rose-500"
          >
            Clear all
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {typeof resultCount === "number" && (
            <span className="hidden text-xs text-zinc-400 sm:inline">
              {resultCount} {resultCount === 1 ? "listing" : "listings"}
            </span>
          )}
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as SortKey })}
            className="input !w-auto !py-2 text-xs"
            aria-label="Sort"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
            <option value="popular">Most viewed</option>
          </select>
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t border-zinc-200 pt-4 animate-fade-in dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="Brand">
              <select
                value={filters.brand}
                onChange={(e) => onChange({ brand: e.target.value })}
                className="input"
              >
                <option value="">All brands</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Condition">
              <select
                value={filters.condition}
                onChange={(e) => onChange({ condition: e.target.value })}
                className="input"
              >
                <option value="">Any condition</option>
                {Object.entries(CONDITIONS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="RAM">
              <select
                value={filters.minRam}
                onChange={(e) => onChange({ minRam: Number(e.target.value) })}
                className="input"
              >
                <option value={0}>Any RAM</option>
                {RAM_OPTIONS.filter((r) => r > 0).map((r) => (
                  <option key={r} value={r}>≥ {r} GB</option>
                ))}
              </select>
            </Field>
            <Field label="Storage">
              <select
                value={filters.minStorage}
                onChange={(e) => onChange({ minStorage: Number(e.target.value) })}
                className="input"
              >
                <option value={0}>Any storage</option>
                {STORAGE_OPTIONS.filter((s) => s > 0).map((s) => (
                  <option key={s} value={s}>≥ {s} GB</option>
                ))}
              </select>
            </Field>
            <Field label="Min price">
              <input
                type="number"
                min="0"
                placeholder="$"
                value={filters.minPrice}
                onChange={(e) => onChange({ minPrice: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Max price">
              <input
                type="number"
                min="0"
                placeholder="$"
                value={filters.maxPrice}
                onChange={(e) => onChange({ maxPrice: e.target.value })}
                className="input"
              />
            </Field>
            <div className="col-span-2 sm:col-span-3 lg:col-span-6">
              <Field label="Location">
                <input
                  type="text"
                  placeholder="City, country…"
                  value={filters.location}
                  onChange={(e) => onChange({ location: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function activeCount(f: Filters): number {
  let n = 0;
  if (f.brand) n++;
  if (f.condition) n++;
  if (f.minRam) n++;
  if (f.minStorage) n++;
  if (f.minPrice) n++;
  if (f.maxPrice) n++;
  if (f.location) n++;
  return n;
}