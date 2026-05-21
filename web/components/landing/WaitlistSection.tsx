"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section
      id="waitlist"
      className="scroll-mt-24 border-t border-stone-200/80 bg-stone-900 px-5 py-20 text-stone-50 sm:px-8"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
          Early access
        </p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Ship LinkedIn posts you&apos;d actually sign your name to
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-400">
          Join the waitlist for pilot access. We&apos;ll reach out when Slack
          onboarding opens for engineering leaders in the first cohort.
        </p>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>
          <input
            id="waitlist-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            disabled={status === "loading" || status === "success"}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-stone-700 bg-stone-800 px-4 py-3.5 text-stone-50 placeholder:text-stone-500 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-600/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="rounded-2xl bg-[#e8d5c4] px-6 py-3.5 text-sm font-semibold text-stone-900 transition hover:bg-[#f0e0d2] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Joining…" : status === "success" ? "Joined" : "Request access"}
          </button>
        </form>

        {message ? (
          <p
            role="status"
            className={`mt-4 text-sm ${status === "error" ? "text-red-300" : "text-emerald-300"}`}
          >
            {message}
          </p>
        ) : null}

        <p className="mt-8 text-xs text-stone-500">
          Already have access?{" "}
          <a href="/workflow" className="font-medium text-stone-300 underline-offset-2 hover:underline">
            Open workflow
          </a>
          {" · "}
          <a
            href="/settings/slack"
            className="font-medium text-stone-300 underline-offset-2 hover:underline"
          >
            Slack settings
          </a>
        </p>
      </div>
    </section>
  );
}
