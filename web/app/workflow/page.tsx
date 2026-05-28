"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { type GenerateDraftResponse } from "@linkedin-agent/shared";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { NoiseBackground } from "@/components/landing/NoiseBackground";
import { useAuthedApi } from "@/lib/useAuthedApi";

const workflowPills = ["One idea", "One draft", "Telegram delivery"];

const workflowSteps = [
  {
    title: "Write the rough thought",
    description: "A lesson, a proof point, a launch note, or a post you want to make feel sharper."
  },
  {
    title: "Queue the draft",
    description: "The API turns your prompt into a draft and returns it to the page when it is ready."
  },
  {
    title: "Review in your channel",
    description: "If Telegram is linked, the worker sends the same draft back to chat for your final pass."
  }
];

export default function WorkflowPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { fetchWithAuth } = useAuthedApi();
  const [idea, setIdea] = useState("");
  const [message, setMessage] = useState("Share one idea. I’ll turn it into a draft.");
  const [draft, setDraft] = useState<GenerateDraftResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateDraft(event: FormEvent) {
    event.preventDefault();
    const trimmedIdea = idea.trim();
    if (!trimmedIdea) {
      setMessage("Add one idea first.");
      return;
    }

    setLoading(true);
    setMessage("Queueing your draft…");
    setDraft(null);

    try {
      const response = await fetchWithAuth("/v1/me/drafts/generate", {
        method: "POST",
        body: JSON.stringify({
          updateRequest: trimmedIdea
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setMessage(body?.error ?? "Draft generation failed");
        return;
      }

      const data = (await response.json()) as GenerateDraftResponse;
      setDraft(data);
      setMessage("Draft generated and delivered to Telegram if your account is linked.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative isolate overflow-hidden bg-[var(--color-canvas)] text-stone-900">
      <NoiseBackground />

      <main className="relative z-10 px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
          {!isLoaded ? (
            <Card className="bg-white/80">
              <p className="text-sm text-stone-600">Loading workflow…</p>
            </Card>
          ) : !isSignedIn ? (
            <section className="rounded-3xl border border-stone-200/90 bg-gradient-to-br from-white via-[#f5f0eb] to-[#e8f0ee] p-8 shadow-sm sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Workflow</p>
              <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                One idea in. Draft out.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
                Sign in to queue a draft from one rough thought. The page keeps the same warm, editorial
                feel as the landing page while the worker turns your note into a reviewable post.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800"
                >
                  Sign in
                </Link>
                <Link
                  href="/settings/telegram"
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-stone-800 backdrop-blur-sm transition hover:border-stone-400"
                >
                  Connect Telegram
                </Link>
              </div>
            </section>
          ) : (
            <>
              <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                <Card className="overflow-hidden bg-gradient-to-br from-white via-[#f5f0eb] to-[#e8f0ee] sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Workflow</p>
                  <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
                    Turn one idea into a draft you can review.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
                    Drop a rough thought, queue it, and bring the result back here or in Telegram. The UI stays
                    aligned with the landing page so the app feels like one system instead of three separate ones.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2">
                    {workflowPills.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full border border-stone-200/90 bg-white/90 px-3 py-1 text-xs font-medium text-stone-700"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>

                  <form onSubmit={generateDraft} className="mt-8 grid gap-4">
                    <label className="grid gap-2 text-sm font-semibold text-stone-700">
                      Your idea
                      <Input
                        textarea
                        value={idea}
                        onChange={(event: any) => setIdea(event.target.value)}
                        placeholder="Example: share a lesson from shipping a hard product decision this week."
                        className="!mt-0 !min-h-[11rem] !rounded-3xl !border-stone-200 !bg-white/90 !px-4 !py-3 !text-base !text-stone-900 !shadow-sm placeholder:!text-stone-400 focus:!border-stone-400"
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" disabled={loading} className="!rounded-2xl !px-6 !py-3.5">
                        {loading ? "Generating…" : "Generate draft"}
                      </Button>
                      <Link
                        href="/settings/profile"
                        className="text-sm font-semibold text-stone-600 transition hover:text-stone-900"
                      >
                        Review profile settings
                      </Link>
                    </div>
                  </form>

                  {message ? <p className="mt-4 text-sm font-medium text-stone-600">{message}</p> : null}
                </Card>

                <div className="grid gap-4">
                  <Card className="bg-white/80">
                    <h2 className="font-display text-2xl font-semibold text-stone-900">What happens next</h2>
                    <div className="mt-4 grid gap-3">
                      {workflowSteps.map((step) => (
                        <div key={step.title} className="rounded-2xl border border-stone-200 bg-white/90 p-4">
                          <p className="text-sm font-semibold text-stone-900">{step.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.description}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="bg-white/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Delivery</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold text-stone-900">Keep the loop in Telegram</h2>
                    <p className="mt-3 text-sm leading-relaxed text-stone-600">
                      Link Telegram to receive the same generated draft in chat, then jump back here for the final
                      pass when you want a wider editing surface.
                    </p>
                    <Link
                      href="/settings/telegram"
                      className="mt-5 inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white/90 px-5 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400"
                    >
                      Open Telegram settings
                    </Link>
                  </Card>
                </div>
              </section>

              {draft ? (
                <Card className="bg-white/85">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Generated draft</p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900">Ready to review</h2>
                    </div>
                    <p className="text-sm font-medium text-stone-500">Delivered to {draft.targets.join(" + ")}</p>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-stone-700">{draft.post}</p>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}