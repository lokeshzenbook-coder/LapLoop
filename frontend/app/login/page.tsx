import type { Metadata } from "next";

import AuthPanel from "@/components/AuthPanel";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <AuthPanel mode="login" />;
}