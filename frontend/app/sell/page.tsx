import type { Metadata } from "next";

import SellNew from "@/components/SellNew";

export const metadata: Metadata = { title: "Sell your laptop" };

export default function SellPage() {
  return <SellNew />;
}