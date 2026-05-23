import { Card } from "@/components/ui/Card";

export default function SlackSettingsPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Slack Settings</h1>
      <Card>
        <p className="text-sm text-[var(--color-muted)]">
          Slack install and command handling are in-progress. The first implemented
          command path is <code>/set-repeat &lt;cron&gt;</code>, available through the API
          endpoint <code>/v1/integrations/slack/commands</code>.
        </p>
        <p className="mt-4">
          Use <a href="/workflow">/workflow</a> to simulate schedule updates before wiring
          full Slack OAuth and command verification.
        </p>
      </Card>
    </main>
  );
}
