import type { Metadata } from "next";

import AuthPanel from "@/components/AuthPanel";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <AuthPanel mode="register" />;
}