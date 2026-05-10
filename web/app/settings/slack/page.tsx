export default function SlackSettingsPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Slack Settings</h1>
      <p style={{ color: "#cbd5e1" }}>
        Slack install and command handling are in-progress. The first implemented
        command path is <code>/set-repeat &lt;cron&gt;</code>, available through the API
        endpoint <code>/v1/integrations/slack/commands</code>.
      </p>
      <p>
        Use <a href="/workflow">/workflow</a> to simulate schedule updates before wiring
        full Slack OAuth and command verification.
      </p>
    </main>
  );
}
