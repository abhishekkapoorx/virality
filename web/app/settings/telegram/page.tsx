"use client";

import { useEffect, useState } from "react";

import { useAuthedApi } from "../../../lib/useAuthedApi";

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
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "2rem 1.25rem",
        display: "grid",
        gap: "1rem"
      }}
    >
      <section
        style={{
          border: "1px solid rgba(148, 163, 184, 0.18)",
          borderRadius: 20,
          padding: "1.5rem",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))",
          color: "#e2e8f0"
        }}
      >
        <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 12 }}>
          Telegram
        </p>
        <h1 style={{ margin: "0.5rem 0 0.75rem", fontSize: "2rem" }}>Connect your bot account</h1>
        <p style={{ margin: 0, color: "#cbd5e1", maxWidth: 680 }}>
          Generate a short-lived deep link from your Clerk session, then open it in Telegram to bind this chat to your profile.
          On mobile you can tap the link directly; on desktop you can copy it and open it on your phone.
        </p>
      </section>

      <section
        style={{
          border: "1px solid rgba(148, 163, 184, 0.14)",
          borderRadius: 20,
          padding: "1.25rem",
          background: "#0f172a",
          color: "#e2e8f0",
          display: "grid",
          gap: "0.85rem"
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Connection status</h2>
          <p style={{ margin: "0.35rem 0 0", color: "#94a3b8" }}>
            {loading ? "Loading Telegram link state..." : status?.connected ? "Connected" : "Not connected"}
          </p>
        </div>

        <div style={{ display: "grid", gap: "0.4rem", color: "#cbd5e1" }}>
          <div>Telegram user id: {status?.telegramUserId ?? "—"}</div>
          <div>Linked at: {formatTimestamp(status?.telegramLinkedAt ?? null)}</div>
          <div>Link expires: {expiresAt ? formatTimestamp(expiresAt) : "No active link"}</div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={issueLink}
            disabled={busy}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "0.8rem 1.1rem",
              background: "#38bdf8",
              color: "#082f49",
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer"
            }}
          >
            Generate connect link
          </button>

          <button
            type="button"
            onClick={disconnect}
            disabled={busy || !status?.connected}
            style={{
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: 999,
              padding: "0.8rem 1.1rem",
              background: "transparent",
              color: "#e2e8f0",
              fontWeight: 600,
              cursor: busy || !status?.connected ? "not-allowed" : "pointer"
            }}
          >
            Disconnect
          </button>
        </div>

        {deepLink ? (
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(56, 189, 248, 0.28)",
              background: "rgba(8, 47, 73, 0.55)",
              padding: "1rem",
              display: "grid",
              gap: "0.75rem"
            }}
          >
            <div style={{ fontWeight: 700 }}>Connect link</div>
            <a href={deepLink} target="_blank" rel="noreferrer" style={{ color: "#7dd3fc", wordBreak: "break-all" }}>
              {deepLink}
            </a>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={copyLink}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  borderRadius: 999,
                  padding: "0.7rem 1rem",
                  background: "transparent",
                  color: "#e2e8f0",
                  cursor: "pointer"
                }}
              >
                Copy link
              </button>
              <a
                href={deepLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  borderRadius: 999,
                  padding: "0.7rem 1rem",
                  background: "#22c55e",
                  color: "#052e16",
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                Open in Telegram
              </a>
            </div>
          </div>
        ) : null}

        {message ? <p style={{ margin: 0, color: "#93c5fd" }}>{message}</p> : null}
      </section>
    </main>
  );
}