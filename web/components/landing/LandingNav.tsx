import { LandingNavAuth } from "./LandingNavAuth";
import { Badge } from "@/components/ui/Badge";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#faf9f7]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="group flex items-center gap-2.5">
            <Badge className="h-9 w-9 flex items-center justify-center rounded-2xl text-sm font-semibold" variant="neutral">
              LA
            </Badge>
            <span className="text-sm font-semibold tracking-tight text-stone-900">LinkedIn Agent</span>
          </a>
        <nav className="hidden items-center gap-6 text-sm text-stone-600 md:flex">
          <a href="/workflow" className="transition hover:text-stone-900">
            Workflow
          </a>
          <a href="/settings/profile" className="transition hover:text-stone-900">
            Settings
          </a>
          <a href="#features" className="transition hover:text-stone-900">
            Features
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
