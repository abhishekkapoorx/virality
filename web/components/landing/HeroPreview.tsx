"use client";

import { useEffect, useState } from "react";

const LINES = [
  "Draft ready — Approve · Refine · Reject",
  "Written in your voice",
  "Ready when you are to post"
];

export function HeroPreview() {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLine((n) => (n + 1) % LINES.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative rounded-3xl border border-stone-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e8a87c]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-stone-400">
          Live preview
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="rounded-2xl bg-stone-100/80 px-4 py-3">
          <p className="text-xs text-stone-500">You</p>
          <p className="mt-1 text-sm text-stone-800">
            Notes from our eng review—turn into a LinkedIn post?
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-[#faf9f7] px-4 py-3">
          <p className="text-xs font-medium text-stone-500">LinkedIn Agent</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-800">
            Here&apos;s a draft in your voice, tied to what you wanted to say
            this week…
          </p>
          <div className="mt-3 flex gap-2">
            {["Approve", "Refine", "Reject"].map((a) => (
              <span
                key={a}
                className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 shadow-sm"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p
        key={line}
        className="mt-5 text-center text-xs font-medium text-stone-500 transition-opacity duration-500"
      >
        {LINES[line]}
      </p>
    </div>
  );
}
