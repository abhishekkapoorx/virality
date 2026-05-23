import { BentoFeatures } from "./BentoFeatures";
import { FlowExperience } from "./FlowExperience";
import { HeroPreview } from "./HeroPreview";
import { LandingNav } from "./LandingNav";
import { NoiseBackground } from "./NoiseBackground";
import { ScheduleSection } from "./ScheduleSection";
import { WaitlistSection } from "./WaitlistSection";
import dynamic from "next/dynamic";

const FooterAuth = dynamic(() => import("./FooterAuth").then((m) => m.FooterAuth), { ssr: false });

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#faf9f7] text-stone-900">
      <NoiseBackground />
      <LandingNav />

      <main>
        <section className="px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium text-stone-600 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  For engineering leaders who publish on LinkedIn
                </p>
                <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-[3.35rem]">
                  LinkedIn posts that sound like you—not like a template.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
                  Rough ideas in Slack. On-brand drafts back in thread. You
                  approve, refine, and publish on LinkedIn yourself.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <a
                    href="#waitlist"
                    className="rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800"
                  >
                    Join the waitlist
                  </a>
                  <a
                    href="#flow"
                    className="rounded-2xl border border-stone-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-stone-800 backdrop-blur-sm transition hover:border-stone-400"
                  >
                    Watch the flow
                  </a>
                </div>
              </div>

              <HeroPreview />
            </div>
          </div>
        </section>

        <FlowExperience />

        <BentoFeatures />

        <ScheduleSection />

        <section
          id="how-it-works"
          className="scroll-mt-24 px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-white via-[#f5f0eb] to-[#e8f0ee] p-8 sm:p-10">
              <h2 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
                Less friction from idea to published post
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
                Set your voice and rhythm once. Day to day, stay in Slack for
                drafts and approvals. Publish on LinkedIn when you&apos;re
                proud of the words—not when an algorithm decides.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  "Your voice, every time",
                  "You choose what ships",
                  "Slack + web",
                  "Post on a rhythm"
                ].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-xs font-medium text-stone-700"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <WaitlistSection />

      <footer className="border-t border-stone-800 bg-stone-900 px-5 py-8 text-center text-xs text-stone-500 sm:px-8">
        <div className="mx-auto max-w-6xl flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div>LinkedIn Agent · Human-in-the-loop content workflow</div>
          <nav className="flex gap-4 text-xs items-center">
            <a href="/workflow" className="transition hover:text-stone-300 no-underline">Workflow</a>
            <a href="/settings/profile" className="transition hover:text-stone-300 no-underline">Settings</a>
            <a href="/settings/slack" className="transition hover:text-stone-300 no-underline">Slack</a>
            <div className="ml-2">
              <FooterAuth />
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
