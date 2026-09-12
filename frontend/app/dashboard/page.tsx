import type { Metadata } from "next";

import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = { title: "My dashboard" };

export default function DashboardPage() {
  return <Dashboard />;
}