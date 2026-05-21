import { LandingNavAuth } from "./LandingNavAuth";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#faf9f7]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold text-stone-50 shadow-sm">
            LA
          </span>
          <span className="text-sm font-semibold tracking-tight text-stone-900">
            LinkedIn Agent
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-stone-600 md:flex">
          <a href="#flow" className="transition hover:text-stone-900">
            Flow
          </a>
          <a href="#features" className="transition hover:text-stone-900">
            Features
          </a>
          <a href="#schedule" className="transition hover:text-stone-900">
            Scheduling
          </a>
          <a href="#how-it-works" className="transition hover:text-stone-900">
            How it works
          </a>
        </nav>
        <LandingNavAuth />
      </div>
    </header>
  );
}
