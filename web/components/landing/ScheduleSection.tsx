"use client";

import { useState } from "react";
import { SCHEDULE_OUTCOMES, SCHEDULE_PRESETS } from "@/lib/scheduleLanding";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PRESET_DAYS: Record<string, boolean[]> = {
  "weekly-mon": [true, false, false, false, false, false, false],
  weekdays: [true, true, true, true, true, false, false],
  biweekly: [true, false, false, false, false, false, false]
};

export function ScheduleSection() {
  const [presetId, setPresetId] = useState<string>(SCHEDULE_PRESETS[0].id);
  const preset =
    SCHEDULE_PRESETS.find((p) => p.id === presetId) ?? SCHEDULE_PRESETS[0];
  const active = PRESET_DAYS[presetId] ?? PRESET_DAYS["weekly-mon"];

  return (
    <section id="schedule" className="scroll-mt-24 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Post on your schedule
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Consistent LinkedIn presence, without living in a content calendar
            </h2>
            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Tell us when you want your next draft. We prepare it in your voice
              and drop it in Slack—you review, refine if needed, and publish when
              it feels right.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {SCHEDULE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetId(p.id)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                    presetId === p.id
                      ? "border-stone-900 bg-stone-900 text-stone-50"
                      : "border-stone-200 bg-white/80 text-stone-700 hover:border-stone-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm leading-relaxed text-stone-600">
              {preset.blurb}
            </p>

            <a
              href="/workflow"
              className="mt-8 inline-flex rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            >
              Set your rhythm
            </a>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-white/80 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                When drafts land
              </p>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {WEEK.map((day, i) => (
                  <div key={day} className="text-center">
                    <span className="text-[10px] font-medium text-stone-500">
                      {day}
                    </span>
                    <div
                      className={`mx-auto mt-2 flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold transition-colors duration-300 ${
                        active[i]
                          ? "bg-stone-900 text-stone-50"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {active[i] ? "●" : "—"}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-stone-500">
                Dark days are when your draft is prepared for review
              </p>
            </div>

            <ul className="space-y-3">
              {SCHEDULE_OUTCOMES.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-stone-200/90 bg-[#faf9f7] p-5 transition hover:border-stone-300"
                >
                  <h3 className="font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
