"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ListingForm from "@/components/ListingForm";
import { LoadingPage } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Laptop } from "@/types";

function SellEdit({ id }: { id: number }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=" + encodeURIComponent(`/sell/${id}`));
    }
  }, [loading, user, router, id]);

  const { data: laptop, loading: laptopLoading, error } = useLaptop(id);

  if (loading || laptopLoading) return <LoadingPage label="Loading listing" />;

  if (laptop && laptop.seller && user && laptop.seller.id !== user.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">You can only edit your own listings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Edit your listing</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Update the details, photos or status of #{id}.
        </p>
      </header>
      <ListingForm key={laptop?.id} laptopId={id} initial={laptop ?? undefined} />
    </div>
  );
}

function useLaptop(id: number) {
  const router = useRouter();
  const [state, setState] = useState<{
    data: Laptop | null;
    loading: boolean;
    error: string;
  }>({ data: null, loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    api
      .get<Laptop>(`/laptops/${id}`)
      .then((l) => !cancelled && setState({ data: l, loading: false, error: "" }))
      .catch((e) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error: e?.message ?? "Not found" });
        if (e?.status === 404) router.replace("/");
      });
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return state;
}

export default SellEdit;