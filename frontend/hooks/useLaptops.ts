"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { Filters, PaginatedLaptops } from "@/types";

const EMPTY_FILTERS: Filters = {
  q: "",
  brand: "",
  condition: "",
  minRam: 0,
  minStorage: 0,
  minPrice: "",
  maxPrice: "",
  location: "",
  sort: "newest",
};

export function useLaptops(initial?: PaginatedLaptops) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedLaptops | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const load = useCallback(async (f: Filters, p: number) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<PaginatedLaptops>("/laptops", {
        q: f.q,
        brand: f.brand,
        condition: f.condition,
        minRam: f.minRam || undefined,
        minStorage: f.minStorage || undefined,
        minPrice: f.minPrice,
        maxPrice: f.maxPrice,
        location: f.location,
        sort: f.sort,
        page: p,
        limit: 12,
      });
      if (seq !== requestSeq.current) return;
      setData(result);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters, page);
  }, [filters, page, load]);

  const applyFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const setPageSafe = useCallback((p: number) => {
    setPage(Math.max(1, p));
  }, []);

  return {
    filters,
    applyFilters,
    reset,
    page,
    setPage: setPageSafe,
    data,
    loading,
    error,
    hasActiveFilters: JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS),
  };
}