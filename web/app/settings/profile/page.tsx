import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { NoiseBackground } from "@/components/landing/NoiseBackground";

const profileHighlights = [
  {
    title: "Voice",
    description: "Keep the writing style, brand voice, and personal notes aligned with how you actually sound."
  },
  {
    title: "Rhythm",
    description: "Use the workflow and schedule together so drafts arrive when you can actually review them."
  },
  {
    title: "Delivery",
    description: "Connect Telegram to move drafts between chat and the web without changing the visual language."
  }
];

export default function ProfileSettingsPage() {
  return (
    <div className="relative isolate overflow-hidden bg-[var(--color-canvas)] text-stone-900">
      <NoiseBackground />

      <main className="relative z-10 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
          <section className="rounded-3xl border border-stone-200/90 bg-gradient-to-br from-white via-[#f5f0eb] to-[#e8f0ee] p-8 shadow-sm sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Profile</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Keep your profile, workflow, and delivery settings in one calm surface.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
              This route now shares the same warm editorial treatment as the landing page, so moving between
              onboarding, drafting, and Telegram linking feels like one product.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/setup"
                className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800"
              >
                Open setup
              </Link>
              <Link
                href="/workflow"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-stone-800 backdrop-blur-sm transition hover:border-stone-400"
              >
                Go to workflow
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {profileHighlights.map((item) => (
              <Card key={item.title} className="bg-white/80">
                <h2 className="font-display text-2xl font-semibold text-stone-900">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.description}</p>
              </Card>
            ))}
          </section>

          <Card className="bg-white/80">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Where to edit</p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-stone-900">
                  Use the most specific surface for the task.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
                  The full onboarding and profile editor lives in <Link href="/setup" className="font-semibold text-stone-800 underline decoration-stone-300 underline-offset-4">/setup</Link>,
                  while <Link href="/workflow" className="font-semibold text-stone-800 underline decoration-stone-300 underline-offset-4">/workflow</Link>
                  handles quick draft generation and <Link href="/settings/telegram" className="font-semibold text-stone-800 underline decoration-stone-300 underline-offset-4">/settings/telegram</Link>
                  handles delivery.
                </p>
              </div>

              <Link
                href="/settings/telegram"
                className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/90 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400"
              >
                Link Telegram
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
