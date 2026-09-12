import type { Metadata } from "next";

import HomeContent from "@/components/HomeContent";

export const metadata: Metadata = {
  title: "Buy & Sell Used Laptops",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeContent />;
}