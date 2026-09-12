import type { Metadata } from "next";

import LaptopDetail from "@/components/LaptopDetail";

export const metadata: Metadata = {
  title: "Listing",
};

export default async function LaptopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  return <LaptopDetail id={Number.isFinite(id) ? id : 0} />;
}