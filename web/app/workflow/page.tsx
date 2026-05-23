"use client";

import { useAuth } from "@clerk/nextjs";
import { CSSProperties, FormEvent, useEffect, useState } from "react";
import {
  type GenerateDraftResponse,
  type UserWorkflowContext
} from "@linkedin-agent/shared";

import { useAuthedApi } from "@/lib/useAuthedApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function WorkflowPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { fetchWithAuth } = useAuthedApi();
  const [configText, setConfigText] = useState("");
  const [styleText, setStyleText] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const [hookSystemText, setHookSystemText] = useState("");
  const [carouselDesignLanguage, setCarouselDesignLanguage] = useState("");
  const [cronExpression, setCronExpression] = useState("0 9 * * 1");
  const [updateRequest, setUpdateRequest] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<GenerateDraftResponse | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void loadContext();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  async function loadContext() {
    setLoading(true);
    setMessage("Loading saved context…");
    try {
      const res = await fetchWithAuth("/v1/me/workflow-context");
      if (!res.ok) {
        setMessage("Failed to load workflow context (is Postgres running?)");
        return;
      }
      const data = (await res.json()) as UserWorkflowContext;
      setActiveUserId(data.userId);
      setConfigText(data.configText);
      setStyleText(data.styleText);
      setScheduleText(data.scheduleText);
      setHookSystemText(data.hookSystemText);
      setCarouselDesignLanguage(data.carouselDesignLanguage);
      setCronExpression(data.cronExpression);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  async function saveContext(e: FormEvent) {
    e.preventDefault();
    setMessage("Saving to database…");
    const res = await fetchWithAuth("/v1/me/workflow-context", {
      method: "PUT",
      body: JSON.stringify({
        configText,
        styleText,
        scheduleText,
        hookSystemText,
        carouselDesignLanguage,
        cronExpression
      })
    });
    if (!res.ok) {
      setMessage("Failed to save workflow context");
      return;
    }
    const data = (await res.json()) as UserWorkflowContext;
    setMessage(`Saved at ${new Date(data.updatedAt).toLocaleTimeString()}`);
  }

  async function generateDraft() {
    setMessage("Generating draft…");
    const res = await fetchWithAuth("/v1/me/drafts/generate", {
      method: "POST",
      body: JSON.stringify({
        updateRequest: updateRequest.trim() || undefined
      })
    });
    if (!res.ok) {
      setMessage("Draft generation failed");
      return;
    }
    const data = (await res.json()) as GenerateDraftResponse;
    setDraft(data);
    setMessage("Draft generated (worker graph uses the same Postgres context when API_URL is set)");
  }

  async function saveRepeatFromSlack() {
    if (!activeUserId) return;
    setMessage("Updating /set-repeat schedule…");
    const res = await fetchWithAuth("/v1/integrations/slack/commands", {
      method: "POST",
      body: JSON.stringify({
        command: "/set-repeat",
        text: cronExpression,
        user_id: activeUserId
      })
    });
    const body = await res.json();
    if (!res.ok) {
      setMessage(body.error ?? "Failed to update schedule");
      return;
    }
    setMessage(`Slack repeat updated to: ${body.cronExpression}`);
  }

  if (!isLoaded) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }}>
        <p style={{ color: "var(--color-muted-alt)" }}>Loading…</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Sign in required</h1>
        <p style={{ color: "var(--color-muted-alt)" }}>
          <a href="/sign-in" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Sign in
          </a>{" "}
          to configure your workflow context.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Workflow context</h1>
      <p style={{ color: "var(--color-muted-alt)", marginTop: 0 }}>
        Your writing style, calendar, and schedule—saved to your account.
      </p>

      {activeUserId ? (
        <p style={badge}>
          Signed in · workspace id <code>{activeUserId.slice(0, 12)}…</code>
        </p>
      ) : null}

      {loading ? (
        <p style={{ color: "var(--color-muted)" }}>Loading…</p>
      ) : (
        <form onSubmit={saveContext} style={{ display: "grid", gap: "1rem" }}>
          <fieldset style={fieldset}>
            <legend style={legend}>LinkedIn config</legend>
            <p style={hint}>
              Formerly the LinkedIn_Config Google Doc — hashtags, audience, brand rules.
            </p>
            <Input textarea value={configText} onChange={(e: any) => setConfigText(e.target.value)} />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Style guide</legend>
            <p style={hint}>Formerly Style_Guide — voice, BUT→THEREFORE, sentence rhythm.</p>
            <Input textarea value={styleText} onChange={(e: any) => setStyleText(e.target.value)} />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Weekly post schedule</legend>
            <p style={hint}>
              Formerly Weekly_Post_Schedule — which post type runs on each weekday.
            </p>
            <Input textarea value={scheduleText} onChange={(e: any) => setScheduleText(e.target.value)} />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Content hook system</legend>
            <p style={hint}>
              Formerly Content_Hook_System — hook categories and when to use them.
            </p>
            <Input textarea value={hookSystemText} onChange={(e: any) => setHookSystemText(e.target.value)} />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Carousel & schedule</legend>
            <label>
              Carousel design language
              <Input textarea value={carouselDesignLanguage} onChange={(e: any) => setCarouselDesignLanguage(e.target.value)} />
            </label>
            <label>
              Cron expression
              <Input value={cronExpression} onChange={(e: any) => setCronExpression(e.target.value)} />
            </label>
          </fieldset>

          <div style={buttonRow}>
            <Button type="submit">Save to Postgres</Button>
            <Button variant="secondary" type="button" onClick={saveRepeatFromSlack}>
              Simulate /set-repeat
            </Button>
          </div>
        </form>
      )}

      <section style={{ marginTop: "2rem", display: "grid", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Test generation</h2>
        <label>
          Update request (optional — passed as user feedback to the graph)
          <Input textarea value={updateRequest} onChange={(e: any) => setUpdateRequest(e.target.value)} placeholder="Example: make the opening hook stronger and shorter." />
        </label>
        <Button type="button" onClick={generateDraft}>
          Generate draft (API stub)
        </Button>
      </section>

      {message && <p style={{ marginTop: "1rem", color: "var(--color-primary)" }}>{message}</p>}

      {draft && (
        <section style={card}>
          <h2>Generated output</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{draft.post}</p>
          <p>
            <strong>Carousel:</strong> {draft.carouselArtifactUrl}
          </p>
          <p>
            <strong>Targets:</strong> {draft.targets.join(" + ")}
          </p>
        </section>
      )}
    </main>
  );
}

const badge: CSSProperties = {
  display: "inline-block",
  padding: "0.35rem 0.65rem",
  borderRadius: "0.4rem",
  background: "var(--color-surface-soft)",
  border: "1px solid var(--color-soft-border)",
  fontSize: "0.9rem",
  marginBottom: "1rem",
  color: "var(--color-ink)"
};

const fieldset: CSSProperties = {
  border: "1px solid var(--color-strong-border)",
  borderRadius: "0.65rem",
  padding: "1rem",
  margin: 0
};

const legend: CSSProperties = {
  padding: "0 0.35rem",
  fontWeight: 600
};

const hint: CSSProperties = {
  margin: "0.25rem 0 0.75rem",
  fontSize: "0.85rem",
  color: "var(--color-muted)"
};

const buttonRow: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap"
};

const inputStyle: CSSProperties = {
  width: "100%",
  marginTop: "0.35rem",
  padding: "0.6rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--color-strong-border)",
  background: "var(--color-dark-surface)",
  color: "var(--color-dark-text-on-surface)"
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "80px"
};

const textareaLarge: CSSProperties = {
  ...textareaStyle,
  minHeight: "140px",
  width: "100%"
};

const primaryBtn: CSSProperties = {
  background: "var(--color-primary)",
  color: "var(--color-surface)",
  border: 0,
  borderRadius: "0.55rem",
  padding: "0.65rem 1rem",
  cursor: "pointer",
  fontWeight: 600
};

const secondaryBtn: CSSProperties = {
  background: "var(--color-dark-surface)",
  color: "var(--color-dark-text-on-surface)",
  border: "1px solid var(--color-strong-border)",
  borderRadius: "0.55rem",
  padding: "0.65rem 1rem",
  cursor: "pointer",
  fontWeight: 600
};

const card: CSSProperties = {
  marginTop: "1.5rem",
  border: "1px solid var(--color-strong-border)",
  borderRadius: "0.75rem",
  padding: "1rem",
  background: "var(--color-dark-surface)",
  color: "var(--color-dark-text-on-surface)"
};
