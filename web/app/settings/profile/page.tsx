import { Card } from "@/components/ui/Card";

export default function ProfileSettingsPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Profile and Workflow Preferences</h1>
      <Card>
        <p className="text-sm text-[var(--color-muted)]">
          This settings route is now focused on post-generation inputs: writing style,
          weekly calendar, carousel design language, and cron schedule.
        </p>
        <p className="mt-4">
          Open <a href="/workflow">/workflow</a> to edit these values and test generation.
          Use <a href="/settings/telegram">/settings/telegram</a> to connect Telegram.
        </p>
      </Card>
    </main>
  );
}
