export default function ProfileSettingsPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1>Profile and Workflow Preferences</h1>
      <p style={{ color: "#cbd5e1" }}>
        This settings route is now focused on post-generation inputs:
        writing style, weekly calendar, carousel design language, and cron schedule.
      </p>
      <p>
        Open <a href="/workflow">/workflow</a> to edit these values and test generation.
      </p>
    </main>
  );
}
