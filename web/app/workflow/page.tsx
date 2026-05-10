"use client";

import { CSSProperties, FormEvent, useMemo, useState } from "react";
import type {
  GenerateDraftResponse,
  WorkflowPreferencesRecord
} from "@linkedin-agent/shared";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const defaultUserId = "demo-user";

export default function WorkflowPage() {
  const [userId, setUserId] = useState(defaultUserId);
  const [writingStyle, setWritingStyle] = useState(
    "Professional, direct, practical."
  );
  const [weeklyCalendar, setWeeklyCalendar] = useState(
    "Mon-Fri 09:00-18:00 IST"
  );
  const [carouselDesignLanguage, setCarouselDesignLanguage] = useState(
    "Clean dark cards with concise bullets"
  );
  const [cronExpression, setCronExpression] = useState("0 9 * * 1");
  const [updateRequest, setUpdateRequest] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<GenerateDraftResponse | null>(null);

  const profilePayload = useMemo(
    () => ({
      userId,
      writingStyle,
      weeklyCalendar,
      carouselDesignLanguage,
      cronExpression
    }),
    [userId, writingStyle, weeklyCalendar, carouselDesignLanguage, cronExpression]
  );

  async function savePreferences(e: FormEvent) {
    e.preventDefault();
    setMessage("Saving preferences...");
    const res = await fetch(`${apiBase}/v1/me/workflow-preferences`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profilePayload)
    });
    if (!res.ok) {
      setMessage("Failed to save preferences");
      return;
    }
    const data = (await res.json()) as WorkflowPreferencesRecord;
    setCronExpression(data.cronExpression);
    setMessage(`Saved at ${new Date(data.updatedAt).toLocaleTimeString()}`);
  }

  async function generateDraft() {
    setMessage("Generating draft...");
    const res = await fetch(`${apiBase}/v1/me/drafts/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        updateRequest: updateRequest.trim() || undefined
      })
    });
    if (!res.ok) {
      setMessage("Draft generation failed");
      return;
    }
    const data = (await res.json()) as GenerateDraftResponse;
    setDraft(data);
    setMessage("Draft generated");
  }

  async function saveRepeatFromSlack() {
    setMessage("Updating /set-repeat schedule...");
    const res = await fetch(`${apiBase}/v1/integrations/slack/commands`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        command: "/set-repeat",
        text: cronExpression,
        user_id: userId
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
      <h1 style={{ marginBottom: "0.5rem" }}>Post Generation Workflow</h1>
      <p style={{ color: "#cbd5e1", marginTop: 0 }}>
        Configure per-user context, generate post + carousel, and set cron cadence
        via web or Slack style command.
      </p>

      <form onSubmit={savePreferences} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          User ID
          <input value={userId} onChange={(e) => setUserId(e.target.value)} style={inputStyle} />
        </label>
        <label>
          Writing style
          <textarea value={writingStyle} onChange={(e) => setWritingStyle(e.target.value)} style={textareaStyle} />
        </label>
        <label>
          Weekly calendar
          <textarea value={weeklyCalendar} onChange={(e) => setWeeklyCalendar(e.target.value)} style={textareaStyle} />
        </label>
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
          <input value={cronExpression} onChange={(e) => setCronExpression(e.target.value)} style={inputStyle} />
        </label>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="submit" style={primaryBtn}>
            Save Preferences
          </button>
          <button type="button" style={secondaryBtn} onClick={saveRepeatFromSlack}>
            Simulate /set-repeat
          </button>
        </div>
      </form>

      <section style={{ marginTop: "1.5rem", display: "grid", gap: "0.75rem" }}>
        <label>
          Update request (optional)
          <textarea
            value={updateRequest}
            onChange={(e) => setUpdateRequest(e.target.value)}
            style={textareaStyle}
            placeholder="Example: make the opening hook stronger and shorter."
          />
        </label>
        <button type="button" style={primaryBtn} onClick={generateDraft}>
          Generate Draft + Carousel
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
