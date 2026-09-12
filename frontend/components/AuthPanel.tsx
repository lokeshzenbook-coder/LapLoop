"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { ErrorBanner, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

function AuthPanel({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ name, email, password, location });
      }
      router.push(next || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="card p-6 sm:p-8 animate-fade-in">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{isLogin ? "Welcome back" : "Join LapLoop"}</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {isLogin
              ? "Log in to sell laptops and message sellers."
              : "Create a free account and list your first laptop."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input
                id="name"
                className="input"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder={isLogin ? "Your password" : "At least 6 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          {!isLogin && (
            <div>
              <label className="label" htmlFor="location">City, country <span className="normal-case text-zinc-400">(optional)</span></label>
              <input
                id="location"
                className="input"
                placeholder="Berlin, Germany"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="address-level2"
              />
            </div>
          )}

          {error && <ErrorBanner message={error} />}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? <Spinner className="text-white" /> : null}
            {isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {isLogin ? (
            <>
              New to LapLoop?{" "}
              <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="card mt-4 flex items-start gap-3 p-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="text-base">🔒</span>
        <p>
          Passwords are hashed with bcrypt and never stored in plain text. Sessions use
          short-lived JSON Web Tokens.
        </p>
      </div>
    </div>
  );
}

export default function AuthPanelWrapper({ mode }: { mode: "login" | "register" }) {
  return (
    <Suspense fallback={null}>
      <AuthPanel mode={mode} />
    </Suspense>
  );
}