"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/setup", label: "Setup" },
  { href: "/workflow", label: "Workflow" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/telegram", label: "Telegram" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#faf9f7]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <Badge className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold" variant="neutral">
            LA
          </Badge>
          <span className="text-sm font-semibold tracking-tight text-stone-900">LinkedIn Agent</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-stone-600 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-stone-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-2xl px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-stone-900"
              >
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
