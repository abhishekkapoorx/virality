"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function LandingNavAuth() {
  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal">
          <button
            type="button"
            className="hidden rounded-2xl px-4 py-2 text-sm font-medium text-stone-600 transition hover:text-stone-900 sm:inline-block"
          >
            Sign in
          </button>
        </SignInButton>
        {/* Sign up removed: only Sign in button is shown to signed-out users */}
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <a
        href="#waitlist"
        className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800"
      >
        Join waitlist
      </a>
    </div>
  );
}
