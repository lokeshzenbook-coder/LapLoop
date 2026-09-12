import type { Metadata } from "next";

import SellEdit from "@/components/SellEdit";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  return <SellEdit id={Number.isFinite(id) ? id : 0} />;
}