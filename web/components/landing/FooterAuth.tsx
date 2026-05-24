"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export function FooterAuth() {
  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="transition hover:text-stone-300 no-underline">Sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <a href="/workflow" className="transition hover:text-stone-300">
          Workflow
        </a>
      </SignedIn>
    </div>
  );
}
