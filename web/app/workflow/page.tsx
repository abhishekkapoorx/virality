"use client";

import { CSSProperties, FormEvent, useEffect, useState } from "react";
import {
  DEMO_USER_ID,
  type GenerateDraftResponse,
  type UserWorkflowContext
} from "@linkedin-agent/shared";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const demoUserId =
  process.env.NEXT_PUBLIC_DEMO_USER_ID?.trim() || DEMO_USER_ID;

export default function WorkflowPage() {
  const [configText, setConfigText] = useState("");
  const [styleText, setStyleText] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const [hookSystemText, setHookSystemText] = useState("");
  const [carouselDesignLanguage, setCarouselDesignLanguage] = useState("");
  const [cronExpression, setCronExpression] = useState("0 9 * * 1");
  const [updateRequest, setUpdateRequest] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<GenerateDraftResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadContext();
  }, []);

  async function loadContext() {
    setLoading(true);
    setMessage("Loading saved context…");
    try {
      const res = await fetch(
        `${apiBase}/v1/me/workflow-context?userId=${encodeURIComponent(demoUserId)}`
      );
      if (!res.ok) {
        setMessage("Failed to load workflow context (is Postgres running?)");
        return;
      }
      const data = (await res.json()) as UserWorkflowContext;
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
    const res = await fetch(`${apiBase}/v1/me/workflow-context`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: demoUserId,
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
    const res = await fetch(`${apiBase}/v1/me/drafts/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: demoUserId,
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
    setMessage("Updating /set-repeat schedule…");
    const res = await fetch(`${apiBase}/v1/integrations/slack/commands`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        command: "/set-repeat",
        text: cronExpression,
        user_id: demoUserId
      })
    });
    const body = await res.json();
    if (!res.ok) {
      setMessage(body.error ?? "Failed to update schedule");
      return;
    }
    setMessage(`Slack repeat updated to: ${body.cronExpression}`);
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Workflow context</h1>
      <p style={{ color: "#cbd5e1", marginTop: 0 }}>
        Per-user prompt context stored in Postgres (replaces the n8n Google Docs).
        Auth will map sessions to user ids later; for now everything saves under a
        fixed demo user.
      </p>

      <p style={badge}>
        Active user: <code>{demoUserId}</code> (constant until Clerk is wired)
      </p>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : (
        <form onSubmit={saveContext} style={{ display: "grid", gap: "1rem" }}>
          <fieldset style={fieldset}>
            <legend style={legend}>LinkedIn config</legend>
            <p style={hint}>
              Formerly the LinkedIn_Config Google Doc — hashtags, audience, brand rules.
            </p>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              style={textareaLarge}
            />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Style guide</legend>
            <p style={hint}>Formerly Style_Guide — voice, BUT→THEREFORE, sentence rhythm.</p>
            <textarea
              value={styleText}
              onChange={(e) => setStyleText(e.target.value)}
              style={textareaLarge}
            />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Weekly post schedule</legend>
            <p style={hint}>
              Formerly Weekly_Post_Schedule — which post type runs on each weekday.
            </p>
            <textarea
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              style={textareaLarge}
            />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Content hook system</legend>
            <p style={hint}>
              Formerly Content_Hook_System — hook categories and when to use them.
            </p>
            <textarea
              value={hookSystemText}
              onChange={(e) => setHookSystemText(e.target.value)}
              style={textareaLarge}
            />
          </fieldset>

          <fieldset style={fieldset}>
            <legend style={legend}>Carousel & schedule</legend>
            <label>
              Carousel design language
              <textarea
                value={carouselDesignLanguage}
                onChange={(e) => setCarouselDesignLanguage(e.target.value)}
                style={textareaStyle}
              />
            </label>
            <label>
              Cron expression
              <input
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                style={inputStyle}
              />
            </label>
          </fieldset>

          <div style={buttonRow}>
            <button type="submit" style={primaryBtn}>
              Save to Postgres
            </button>
            <button type="button" style={secondaryBtn} onClick={saveRepeatFromSlack}>
              Simulate /set-repeat
            </button>
          </div>
        </form>
      )}

      <section style={{ marginTop: "2rem", display: "grid", gap: "0.75rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Test generation</h2>
        <label>
          Update request (optional — passed as user feedback to the graph)
          <textarea
            value={updateRequest}
            onChange={(e) => setUpdateRequest(e.target.value)}
            style={textareaStyle}
            placeholder="Example: make the opening hook stronger and shorter."
          />
        </label>
        <button type="button" style={primaryBtn} onClick={generateDraft}>
          Generate draft (API stub)
        </button>
      </section>

      {message && <p style={{ marginTop: "1rem", color: "#93c5fd" }}>{message}</p>}

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
  background: "#1e293b",
  border: "1px solid #334155",
  fontSize: "0.9rem",
  marginBottom: "1rem"
};

const fieldset: CSSProperties = {
  border: "1px solid #334155",
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
  color: "#94a3b8"
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
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc"
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
  background: "#2563eb",
  color: "white",
  border: 0,
  borderRadius: "0.55rem",
  padding: "0.65rem 1rem",
  cursor: "pointer",
  fontWeight: 600
};

const secondaryBtn: CSSProperties = {
  background: "#1e293b",
  color: "#e2e8f0",
  border: "1px solid #334155",
  borderRadius: "0.55rem",
  padding: "0.65rem 1rem",
  cursor: "pointer",
  fontWeight: 600
};

const card: CSSProperties = {
  marginTop: "1.5rem",
  border: "1px solid #334155",
  borderRadius: "0.75rem",
  padding: "1rem",
  background: "#0f172a"
};
