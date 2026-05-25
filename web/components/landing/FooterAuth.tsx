"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";

export function FooterAuth() {
  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost">Sign in</Button>
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
