"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PRODUCT_FLOW_STEPS,
  type FlowPreview
} from "@/lib/landingFeatures";

function PreviewPanel({ kind }: { kind: FlowPreview }) {
  const base =
    "rounded-2xl border border-stone-200 bg-stone-50/90 p-4 text-sm transition-all duration-500";

  if (kind === "input") {
    return (
      <div className={base}>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#e8a87c]" />
          <span className="text-xs font-medium text-stone-500">#content-draft</span>
        </div>
        <p className="text-stone-800">
          Thread: Quick thought on why teams ship faster when drafts live in Slack
          instead of another tab…
        </p>
        <p className="mt-3 text-xs text-stone-500">LinkedIn Agent · just now</p>
      </div>
    );
  }

  if (kind === "draft") {
    return (
      <div className={base}>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Draft ready
        </p>
        <p className="mt-3 leading-relaxed text-stone-800">
          Most engineering leaders don&apos;t need another writing tool—they need a
          loop that respects their voice…
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Approve", "Refine", "Reject"].map((action) => (
            <span
              key={action}
              className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700"
            >
              {action}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "refine") {
    return (
      <div className={base}>
        <p className="text-xs text-stone-500">Your feedback</p>
        <p className="mt-1 font-medium text-stone-800">
          Shorter opener. Less jargon. Stronger CTA at the end.
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-stone-800" />
        </div>
        <p className="mt-2 text-xs text-stone-500">Regenerating draft…</p>
      </div>
    );
  }

  return (
    <div className={base}>
      <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Ready for LinkedIn
      </p>
      <p className="mt-3 text-stone-600">
        Copy, tweak if you want, and post when you&apos;re ready.
      </p>
    </div>
  );
}

export function FlowExperience() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const step = PRODUCT_FLOW_STEPS[active];

  const next = useCallback(() => {
    setActive((i) => (i + 1) % PRODUCT_FLOW_STEPS.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(next, 4500);
    return () => window.clearInterval(id);
  }, [paused, next]);

  return (
    <section
      id="flow"
      className="scroll-mt-24 border-y border-stone-200/80 bg-white/60 px-5 py-20 backdrop-blur-sm sm:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            See the loop in motion
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Tap a step—or watch it play through. This is how a draft moves from
            idea to something you&apos;d post.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="flex flex-col gap-2">
            {PRODUCT_FLOW_STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                    isActive
                      ? "border-stone-900 bg-stone-900 text-stone-50 shadow-md"
                      : "border-stone-200 bg-white/80 text-stone-800 hover:border-stone-300 hover:bg-white"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      isActive ? "text-stone-400" : "text-stone-400"
                    }`}
                  >
                    Step {i + 1}
                  </span>
                  <span className="mt-1 block text-base font-semibold">
                    {s.label}
                  </span>
                </button>
              );
            })}
            <div className="mt-4 flex gap-1.5 px-1">
              {PRODUCT_FLOW_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i === active ? "bg-stone-900" : "bg-stone-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-[#faf9f7] via-white to-[#e8f0ee] p-6 sm:p-8">
            <div key={step.id} className="transition-opacity duration-500">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {step.label}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-stone-900">
                {step.headline}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {step.detail}
              </p>
              <div className="mt-8">
                <PreviewPanel kind={step.preview} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
