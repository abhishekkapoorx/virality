import { DELIVERY_CHANNELS } from "@linkedin-agent/shared";

export default function HomePage() {
  return (
    <main style={{ padding: "3rem", maxWidth: 980, margin: "0 auto", lineHeight: 1.6 }}>
      <p style={{ marginBottom: "0.5rem", color: "#94a3b8", fontWeight: 600 }}>LinkedIn Agent</p>
      <h1 style={{ fontSize: "2.25rem", marginBottom: "1rem" }}>
        Generate better LinkedIn posts with your style, schedule, and Slack workflow.
      </h1>
      <p style={{ maxWidth: 760, color: "#cbd5e1", marginBottom: "1.5rem" }}>
        Save writing style, weekly calendar, and carousel design language once. The workflow produces a draft,
        creates a carousel artifact, and sends both to Slack and the web dashboard.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <a
          href="/workflow"
          style={{
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            padding: "0.7rem 1.1rem",
            borderRadius: "0.6rem",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          Start Workflow
        </a>
        <a
          href="/settings/profile"
          style={{
            border: "1px solid #cbd5e1",
            color: "#f8fafc",
            padding: "0.7rem 1.1rem",
            borderRadius: "0.6rem",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          Set Schedule
        </a>
      </div>

      <section style={{ border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>First-slice workflow</h2>
        <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "#cbd5e1" }}>
          <li>Load per-user writing style, weekly calendar, carousel design language, and cron schedule.</li>
          <li>Generate post draft with optional update request feedback loop.</li>
          <li>Generate carousel artifact (placeholder in this slice).</li>
          <li>Return output to delivery channels: {DELIVERY_CHANNELS.join(" + ")}.</li>
          <li>Configure recurring runs via web settings or Slack <code>/set-repeat &lt;cron&gt;</code>.</li>
        </ol>
      </section>
    </main>
  );
}
