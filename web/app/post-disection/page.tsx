"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuthedApi } from "@/lib/useAuthedApi";

type MarketplaceVisibility = "public" | "private";

type HookDraft = {
  title: string;
  shortDescription: string;
  longDescription: string;
  icon?: string;
  tags: string;
  examples: string;
  whenToUse: string;
  psychologicalEffect: string;
  visibility: MarketplaceVisibility;
};

type PostStyleDraft = {
  title: string;
  shortDescription: string;
  longDescription: string;
  icon?: string;
  tags: string;
  structure: string;
  expectedHooks: string;
  outcome: string;
  visibility: MarketplaceVisibility;
};

type PostDissectionResult = {
  thesis: string;
  audience: string;
  cta: string;
  emotionalTrigger: string;
  proofType: string;
  alternateHooks: string[];
  hook: {
    title: string;
    shortDescription: string;
    longDescription: string;
    icon?: string;
    tags: string[];
    examples: string[];
    whenToUse: string;
    psychologicalEffect: string;
  };
  postStyle: {
    title: string;
    shortDescription: string;
    longDescription: string;
    icon?: string;
    tags: string[];
    structure: string;
    expectedHooks: string[];
    outcome: string;
  };
};

function joinLines(value: string[]): string {
  return value.join("\n");
}

function splitList(value: string): string[] {
  return value
    .split(/\n|,/) 
    .map((item) => item.trim())
    .filter(Boolean);
}

function toTags(value: string): string[] {
  return splitList(value);
}

function emptyHookDraft(): HookDraft {
  return {
    title: "",
    shortDescription: "",
    longDescription: "",
    icon: "",
    tags: "",
    examples: "",
    whenToUse: "",
    psychologicalEffect: "",
    visibility: "private"
  };
}

function emptyPostStyleDraft(): PostStyleDraft {
  return {
    title: "",
    shortDescription: "",
    longDescription: "",
    icon: "",
    tags: "",
    structure: "",
    expectedHooks: "",
    outcome: "",
    visibility: "private"
  };
}

function VisibilityToggle({ value, onChange }: { value: MarketplaceVisibility; onChange: (next: MarketplaceVisibility) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-[1.1rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-2">
      <button
        type="button"
        onClick={() => onChange("public")}
        className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
          value === "public" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-alt)]"
        }`}
      >
        Public
      </button>
      <button
        type="button"
        onClick={() => onChange("private")}
        className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
          value === "private" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-alt)]"
        }`}
      >
        Private
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">{children}</p>;
}

export default function PostDissectionPage() {
  const { fetchWithAuth, isLoaded, isSignedIn } = useAuthedApi();
  const [postText, setPostText] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingHook, setSavingHook] = useState(false);
  const [savingPostStyle, setSavingPostStyle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PostDissectionResult | null>(null);
  const [hookDraft, setHookDraft] = useState<HookDraft>(emptyHookDraft());
  const [postStyleDraft, setPostStyleDraft] = useState<PostStyleDraft>(emptyPostStyleDraft());

  async function analyzePost() {
    const trimmed = postText.trim();
    if (!trimmed) {
      setError("Paste a post first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage("Dissecting post...");

    try {
      const response = await fetchWithAuth("/v1/me/post-disection/analyze", {
        method: "POST",
        body: JSON.stringify({ postText: trimmed })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(typeof payload?.error === "string" ? payload.error : "Failed to analyze post");
        setResult(null);
        return;
      }

      const data = (await response.json()) as PostDissectionResult;
      setResult(data);
      setHookDraft({
        title: data.hook.title,
        shortDescription: data.hook.shortDescription,
        longDescription: data.hook.longDescription,
        icon: data.hook.icon ?? "",
        tags: data.hook.tags.join(", "),
        examples: joinLines(data.hook.examples),
        whenToUse: data.hook.whenToUse,
        psychologicalEffect: data.hook.psychologicalEffect,
        visibility: "private"
      });
      setPostStyleDraft({
        title: data.postStyle.title,
        shortDescription: data.postStyle.shortDescription,
        longDescription: data.postStyle.longDescription,
        icon: data.postStyle.icon ?? "",
        tags: data.postStyle.tags.join(", "),
        structure: data.postStyle.structure,
        expectedHooks: data.postStyle.expectedHooks.join("\n"),
        outcome: data.postStyle.outcome,
        visibility: "private"
      });
      setMessage("Analysis ready. Review the extracted hook and post style, then save each one.");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Failed to analyze post");
    } finally {
      setLoading(false);
    }
  }

  async function saveHook() {
    if (!result) return;
    setSavingHook(true);
    setError(null);
    setMessage("Saving hook...");

    try {
      const response = await fetchWithAuth("/v1/me/marketplace/hooks", {
        method: "POST",
        body: JSON.stringify({
          title: hookDraft.title,
          shortDescription: hookDraft.shortDescription,
          longDescription: hookDraft.longDescription,
          visibility: hookDraft.visibility,
          icon: hookDraft.icon?.trim() || undefined,
          tags: toTags(hookDraft.tags),
          examples: splitList(hookDraft.examples),
          whenToUse: hookDraft.whenToUse,
          psychologicalEffect: hookDraft.psychologicalEffect
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(typeof payload?.error === "string" ? payload.error : "Failed to save hook");
        return;
      }

      setMessage(`Saved hook as ${hookDraft.visibility}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save hook");
    } finally {
      setSavingHook(false);
    }
  }

  async function savePostStyle() {
    if (!result) return;
    setSavingPostStyle(true);
    setError(null);
    setMessage("Saving post style...");

    try {
      const response = await fetchWithAuth("/v1/me/marketplace/post-styles", {
        method: "POST",
        body: JSON.stringify({
          title: postStyleDraft.title,
          shortDescription: postStyleDraft.shortDescription,
          longDescription: postStyleDraft.longDescription,
          visibility: postStyleDraft.visibility,
          icon: postStyleDraft.icon?.trim() || undefined,
          tags: toTags(postStyleDraft.tags),
          structure: postStyleDraft.structure,
          expectedHooks: splitList(postStyleDraft.expectedHooks),
          outcome: postStyleDraft.outcome
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(typeof payload?.error === "string" ? payload.error : "Failed to save post style");
        return;
      }

      setMessage(`Saved post style as ${postStyleDraft.visibility}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save post style");
    } finally {
      setSavingPostStyle(false);
    }
  }

  return (
    <main className="relative isolate overflow-hidden bg-[var(--color-canvas)] text-stone-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(234,213,190,0.48),transparent_32%),radial-gradient(circle_at_top_right,_rgba(217,236,231,0.54),transparent_28%),linear-gradient(180deg,rgba(250,249,247,1)_0%,rgba(248,245,240,1)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col px-5 py-10 sm:px-8 sm:py-12">
        <div className="max-w-3xl">
          <Badge variant="neutral">Post dissection</Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Dissect any post into a reusable hook and post style.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
            Paste a creator&apos;s post, extract the opening hook and the structural style, then save each result as public or private.
            The analysis also surfaces the angle, audience, CTA, emotional trigger, proof type, and alternate hook ideas.
          </p>
        </div>

        <div className="mt-8 grid gap-6">
          <Card className="border-[var(--color-soft-border)] bg-white/92 backdrop-blur-sm">
            <SectionLabel>Paste post</SectionLabel>
            <Input
              label="Post text"
              textarea
              value={postText}
              onChange={(event) => setPostText(event.target.value)}
              placeholder="Paste a LinkedIn post from any creator here..."
              className="min-h-[22rem] border-[var(--color-soft-border)] bg-white text-[var(--color-text)] placeholder:text-[var(--color-muted-alt)]"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => void analyzePost()} disabled={loading || !isLoaded || !isSignedIn} className="rounded-full px-5">
                {loading ? "Analyzing…" : "Analyze post"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPostText("");
                  setResult(null);
                  setHookDraft(emptyHookDraft());
                  setPostStyleDraft(emptyPostStyleDraft());
                  setError(null);
                  setMessage(null);
                }}
                className="rounded-full px-5"
              >
                Reset
              </Button>
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
            {message ? <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">{message}</p> : null}

            {result ? (
              <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-4">
                <div>
                  <SectionLabel>Thesis</SectionLabel>
                  <p className="text-sm leading-7 text-[var(--color-ink)]">{result.thesis}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <SectionLabel>Audience</SectionLabel>
                    <p className="text-sm leading-7 text-[var(--color-ink)]">{result.audience}</p>
                  </div>
                  <div>
                    <SectionLabel>CTA</SectionLabel>
                    <p className="text-sm leading-7 text-[var(--color-ink)]">{result.cta}</p>
                  </div>
                  <div>
                    <SectionLabel>Emotional trigger</SectionLabel>
                    <p className="text-sm leading-7 text-[var(--color-ink)]">{result.emotionalTrigger}</p>
                  </div>
                  <div>
                    <SectionLabel>Proof type</SectionLabel>
                    <p className="text-sm leading-7 text-[var(--color-ink)]">{result.proofType}</p>
                  </div>
                </div>
                <div>
                  <SectionLabel>Alternate hooks</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {result.alternateHooks.map((hook) => (
                      <Badge key={hook} variant="accent" className="max-w-full whitespace-normal text-left leading-5">
                        {hook}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </Card>

          {result ? (
            <>
              <Card className="border-[var(--color-soft-border)] bg-white/92 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <SectionLabel>Hook</SectionLabel>
                    <h2 className="m-0 font-display text-2xl text-[var(--color-text)]">Save the extracted hook</h2>
                  </div>
                  <Badge variant="neutral">Draft</Badge>
                </div>

                <div className="mt-4 grid gap-3">
                  <Input label="Title" value={hookDraft.title} onChange={(event) => setHookDraft({ ...hookDraft, title: event.target.value })} placeholder="Hook title" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="Short description" value={hookDraft.shortDescription} onChange={(event) => setHookDraft({ ...hookDraft, shortDescription: event.target.value })} placeholder="Short description" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="Long description" textarea value={hookDraft.longDescription} onChange={(event) => setHookDraft({ ...hookDraft, longDescription: event.target.value })} placeholder="Long description" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Optional icon name" value={hookDraft.icon ?? ""} onChange={(event) => setHookDraft({ ...hookDraft, icon: event.target.value })} placeholder="Icon" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                    <Input label="Tags, comma separated" value={hookDraft.tags} onChange={(event) => setHookDraft({ ...hookDraft, tags: event.target.value })} placeholder="Tags" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  </div>
                  <Input label="Examples" textarea value={hookDraft.examples} onChange={(event) => setHookDraft({ ...hookDraft, examples: event.target.value })} placeholder="Examples, one per line" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="When to use" textarea value={hookDraft.whenToUse} onChange={(event) => setHookDraft({ ...hookDraft, whenToUse: event.target.value })} placeholder="When to use" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="Psychological effect" textarea value={hookDraft.psychologicalEffect} onChange={(event) => setHookDraft({ ...hookDraft, psychologicalEffect: event.target.value })} placeholder="Psychological effect" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <VisibilityToggle value={hookDraft.visibility} onChange={(next) => setHookDraft({ ...hookDraft, visibility: next })} />
                  <Button type="button" onClick={() => void saveHook()} disabled={!result || savingHook} className="rounded-full">
                    {savingHook ? "Saving hook…" : "Save hook"}
                  </Button>
                </div>
              </Card>

              <Card className="border-[var(--color-soft-border)] bg-white/92 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <SectionLabel>Post style</SectionLabel>
                    <h2 className="m-0 font-display text-2xl text-[var(--color-text)]">Save the structural pattern</h2>
                  </div>
                  <Badge variant="neutral">Draft</Badge>
                </div>

                <div className="mt-4 grid gap-3">
                  <Input label="Title" value={postStyleDraft.title} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, title: event.target.value })} placeholder="Post style title" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="Short description" value={postStyleDraft.shortDescription} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, shortDescription: event.target.value })} placeholder="Short description" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="Long description" textarea value={postStyleDraft.longDescription} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, longDescription: event.target.value })} placeholder="Long description" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Optional icon name" value={postStyleDraft.icon ?? ""} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, icon: event.target.value })} placeholder="Icon" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                    <Input label="Tags, comma separated" value={postStyleDraft.tags} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, tags: event.target.value })} placeholder="Tags" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  </div>
                  <Input label="Structure" textarea value={postStyleDraft.structure} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, structure: event.target.value })} placeholder="Structure" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="Expected hooks" textarea value={postStyleDraft.expectedHooks} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, expectedHooks: event.target.value })} placeholder="Expected hooks, one per line or comma separated" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <Input label="Expected outcome" textarea value={postStyleDraft.outcome} onChange={(event) => setPostStyleDraft({ ...postStyleDraft, outcome: event.target.value })} placeholder="Expected outcome" className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]" />
                  <VisibilityToggle value={postStyleDraft.visibility} onChange={(next) => setPostStyleDraft({ ...postStyleDraft, visibility: next })} />
                  <Button type="button" onClick={() => void savePostStyle()} disabled={!result || savingPostStyle} className="rounded-full">
                    {savingPostStyle ? "Saving style…" : "Save post style"}
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <Card className="border-[var(--color-soft-border)] bg-white/82 backdrop-blur-sm">
              <SectionLabel>Locked sections</SectionLabel>
              <h2 className="font-display text-2xl text-[var(--color-text)]">Analyze a post to unlock the hook and post style editors</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-ink)]">
                After the analysis runs, these sections expand below the analyze card so you can review and save the extracted outputs.
              </p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}