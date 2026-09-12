"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ListingForm from "@/components/ListingForm";
import { LoadingPage } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function SellNew() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/sell");
    }
  }, [loading, user, router]);

  if (loading) return <LoadingPage label="Loading" />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Sell your laptop</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          Honest specs + real photos = fast, fair sale. Buyers on LapLoop value
          transparency on condition and battery health.
        </p>
      </header>
      <ListingForm />
    </div>
  );
}