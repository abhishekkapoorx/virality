"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoiseBackground } from "@/components/landing/NoiseBackground";
import { useAuthedApi } from "@/lib/useAuthedApi";

type TelegramLinkStatus = {
  connected: boolean;
  telegramUserId: string | null;
  telegramLinkedAt: string | null;
};

type TelegramLinkTokenResponse = {
  token: string;
  expiresAt: string;
  deepLink: string;
};

function formatTimestamp(value: string | null): string {
  if (!value) return "Not connected";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function TelegramSettingsPage() {
  const { fetchWithAuth, isLoaded, isSignedIn } = useAuthedApi();
  const [status, setStatus] = useState<TelegramLinkStatus | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;
    async function loadStatus() {
      setLoading(true);
      try {
        const response = await fetchWithAuth("/v1/me/integrations/telegram");
        if (!response.ok) {
          throw new Error(`Failed to load status (${response.status})`);
        }
        const data = (await response.json()) as TelegramLinkStatus;
        if (!cancelled) setStatus(data);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Failed to load status");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, isLoaded, isSignedIn]);

  async function issueLink() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetchWithAuth("/v1/me/integrations/telegram/link-token", {
        method: "POST"
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; hint?: string };
        throw new Error(body.hint ?? body.error ?? `Failed to create link (${response.status})`);
      }

      const data = (await response.json()) as TelegramLinkTokenResponse;
      setDeepLink(data.deepLink);
      setExpiresAt(data.expiresAt);
      setMessage("Telegram connect link created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create link");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetchWithAuth("/v1/me/integrations/telegram", {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error(`Failed to unlink Telegram (${response.status})`);
      }
      const data = (await response.json()) as TelegramLinkStatus;
      setStatus(data);
      setDeepLink(null);
      setExpiresAt(null);
      setMessage("Telegram disconnected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to unlink Telegram");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!deepLink) return;
    await navigator.clipboard.writeText(deepLink);
    setMessage("Link copied to clipboard.");
  }

  return (
    <div className="relative isolate overflow-hidden bg-[var(--color-canvas)] text-stone-900">
      <NoiseBackground />

      <main className="relative z-10 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 sm:gap-8">
          <section className="rounded-3xl border border-stone-200/90 bg-gradient-to-br from-white via-[#f5f0eb] to-[#e8f0ee] p-8 shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Telegram</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Connect your bot account.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Generate a short-lived deep link from your Clerk session, then open it in Telegram to bind that chat to your profile.
              The page uses the same warm surface and soft cards as the landing page so the delivery flow feels native.
            </p>
          </section>

          {!isLoaded ? (
            <Card className="bg-white/80">
              <p className="text-sm text-stone-600">Loading Telegram link state…</p>
            </Card>
          ) : !isSignedIn ? (
            <Card className="bg-white/80">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Sign in required</p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-stone-900">Link Telegram after you sign in.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
                The Telegram connector uses your Clerk session to create a one-time link token and attach your bot chat to the right account.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800"
                >
                  Sign in
                </Link>
                <Link
                  href="/workflow"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/80 px-5 py-3 text-sm font-semibold text-stone-800 backdrop-blur-sm transition hover:border-stone-400"
                >
                  Back to workflow
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <Card className="bg-white/80">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Connection status</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold text-stone-900">
                      {loading ? "Checking link state…" : status?.connected ? "Telegram is connected" : "Telegram is not connected"}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {loading
                        ? "Loading Telegram link state."
                        : status?.connected
                          ? "This chat is ready to receive drafts and quick feedback."
                          : "Create a new deep link to bind Telegram to this account."}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${status?.connected ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}
                  >
                    {status?.connected ? "Connected" : "Not connected"}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-white/90 p-4 text-sm text-stone-700">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-stone-500">Telegram user id</span>
                    <span className="font-medium text-stone-900">{status?.telegramUserId ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-stone-500">Linked at</span>
                    <span className="font-medium text-stone-900">{formatTimestamp(status?.telegramLinkedAt ?? null)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-stone-500">Link expires</span>
                    <span className="font-medium text-stone-900">{expiresAt ? formatTimestamp(expiresAt) : "No active link"}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" onClick={issueLink} disabled={busy} className="!rounded-2xl !px-6 !py-3.5">
                    {busy ? "Generating…" : "Generate connect link"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={disconnect}
                    disabled={busy || !status?.connected}
                    className="!rounded-2xl !px-6 !py-3.5"
                  >
                    Disconnect
                  </Button>
                </div>

                {message ? <p className="mt-4 text-sm font-medium text-stone-600">{message}</p> : null}

                {deepLink ? (
                  <div className="mt-6 rounded-3xl border border-stone-200 bg-gradient-to-br from-white via-[#f5f0eb] to-[#e8f0ee] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Connect link</p>
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block break-all text-sm font-medium text-stone-800 underline decoration-stone-300 underline-offset-4"
                    >
                      {deepLink}
                    </a>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={copyLink} className="!rounded-2xl !px-5 !py-3">
                        Copy link
                      </Button>
                      <a
                        href={deepLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800"
                      >
                        Open in Telegram
                      </a>
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card className="bg-white/80">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">How linking works</p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-stone-900">Fast, explicit, and reversible.</h2>
                <div className="mt-5 grid gap-3">
                  {[
                    "Create a short-lived deep link from this page.",
                    "Open it in Telegram to bind the chat to your account.",
                    "Use the same chat to send ideas and receive drafts back."
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-stone-200 bg-white/90 p-4 text-sm leading-relaxed text-stone-600">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-stone-200 bg-gradient-to-br from-white via-[#f5f0eb] to-[#e8f0ee] p-4">
                  <p className="text-sm font-semibold text-stone-900">Need a different surface?</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    Open <Link href="/settings/profile" className="font-semibold text-stone-800 underline decoration-stone-300 underline-offset-4">profile settings</Link>{" "}
                    or <Link href="/workflow" className="font-semibold text-stone-800 underline decoration-stone-300 underline-offset-4">workflow</Link> to stay inside the same visual system.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}