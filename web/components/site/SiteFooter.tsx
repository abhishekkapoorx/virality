"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";

const footerLinks = [
  { href: "/setup", label: "Setup" },
  { href: "/post-disection", label: "Post dissection" },
  { href: "/workflow", label: "Workflow" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/telegram", label: "Telegram" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200/80 bg-[#faf9f7]/95 px-5 py-8 text-xs text-stone-600 backdrop-blur-sm sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">LinkedIn Agent · Human-in-the-loop content workflow</div>

        <nav className="flex flex-wrap items-center justify-center gap-4 text-stone-600">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-stone-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-stone-600">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost">Sign in</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/setup" className="transition hover:text-stone-900">
              Open setup
            </Link>
          </SignedIn>
        </div>
      </div>
    </footer>
  );
}
