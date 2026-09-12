"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function InquiryForm({ laptopId, sellerName }: { laptopId: number; sellerName: string }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login?next=" + encodeURIComponent(`/laptops/${laptopId}`);
      return;
    }
    if (message.trim().length < 5) {
      setStatus("error");
      setError("Please write a short message.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      await api.post(`/laptops/${laptopId}/inquiry`, { message });
      setStatus("sent");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send your message.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center dark:bg-emerald-950/40">
        <p className="text-lg">✓</p>
        <h4 className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Message sent to {sellerName}
        </h4>
        <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/70">
          They'll reach out through LoopMessage shortly.
        </p>
        <button onClick={() => setStatus("idle")} className="btn-ghost mt-3 text-xs">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          user
            ? `Ask ${sellerName} about the laptop…`
            : `Log in to message ${sellerName}.`
        }
        rows={4}
        className="input resize-none"
        disabled={!user}
      />
      {status === "error" && <p className="text-xs text-rose-500">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={!user || status === "sending"}>
        {status === "sending" ? "Sending…" : user ? "Contact seller" : "Log in to contact"}
      </button>
      <p className="text-center text-xs text-zinc-400">
        You won&apos;t be charged — the seller replies directly.
      </p>
    </form>
  );
}