"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthedApi } from "@/lib/useAuthedApi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SetupQuestionActions } from "@/components/setup/SetupQuestionActions";
import { SetupEnrichmentPreview } from "@/components/setup/SetupEnrichmentPreview";

type SetupBundle = {
  profile: null | {
    industry: string | null;
    icps: unknown;
    writingStyle: string | null;
    brandVoice: string | null;
    personalizationNotes: string | null;
    postConstraints: unknown;
    exampleAngles: unknown;
    version: number;
  };
  latestAnswers: null | {
    answers: {
      industry?: string;
      icps?: string[];
      topics?: string;
      writingStyle?: string;
      brandVoice?: string;
      personalizationNotes?: string;
    };
  };
  schedule: null | {
    schedule: unknown;
    cronExpr: string | null;
    enabled: boolean;
  };
  isComplete: boolean;
};

type SetupProfileView = NonNullable<SetupBundle["profile"]>;

type SetupAnswersState = {
  industry: string;
  icps: string[];
  topics: string;
  writingStyle: string;
  brandVoice: string;
  personalizationNotes: string;
};

type SetupDraftState = {
  icpsText: string;
};

type SetupEnrichmentPreviewState = {
  proofPoint: string;
  targetOutcome: string;
  constraint: string;
  enrichedAnswer: string;
};

type QuestionKey = keyof SetupAnswersState;

type SetupQuestion = {
  key: QuestionKey;
  title: string;
  helper: string;
  placeholder: string;
  multiline?: boolean;
};

const setupQuestions: SetupQuestion[] = [
  {
    key: "industry",
    title: "What industry do you work in?",
    helper: "Be specific so the draft angle matches your market.",
    placeholder: "Example: B2B SaaS for finance teams"
  },
  {
    key: "icps",
    title: "Who are your ideal customers or readers?",
    helper: "Add at least 3. One per line works best.",
    placeholder: "Example:\nVP Finance at Series B startups\nHead of RevOps at PLG SaaS\nFounder-led SMB owner",
    multiline: true
  },
  {
    key: "topics",
    title: "What topics or post angles should we focus on?",
    helper: "Mention repeatable content pillars.",
    placeholder: "Example: GTM lessons, onboarding mistakes, pricing experiments",
    multiline: true
  },
  {
    key: "writingStyle",
    title: "How would you describe your writing style today?",
    helper: "Tone, sentence length, and structure all help.",
    placeholder: "Example: concise, practical, low fluff"
  },
  {
    key: "brandVoice",
    title: "What should your brand voice feel like?",
    helper: "Describe emotional tone and personality.",
    placeholder: "Example: expert but approachable, opinionated but respectful"
  },
  {
    key: "personalizationNotes",
    title: "What details or constraints should the system remember?",
    helper: "Share proof points, achievements, do-not-say rules, and constraints.",
    placeholder: "Example: 8 years in fintech, avoid hype language, include practical next steps",
    multiline: true
  }
];

function parseIcps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function serializeIcps(value: string[]): string {
  return value.join("\n");
}

function parseIcpsText(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const maybeError = (payload as Record<string, unknown>).error;
  if (typeof maybeError === "string" && maybeError.length > 0) return maybeError;
  return fallback;
}

export default function SetupPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { fetchWithAuth } = useAuthedApi();
  const [bundle, setBundle] = useState<SetupBundle | null>(null);
  const [answers, setAnswers] = useState<SetupAnswersState>({
    industry: "",
    icps: ["", "", ""],
    topics: "",
    writingStyle: "",
    brandVoice: "",
    personalizationNotes: ""
  });
  const [draft, setDraft] = useState<SetupDraftState>({
    icpsText: ""
  });
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<null | { profile: SetupProfileView; version: number }>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentPreview, setEnrichmentPreview] = useState<SetupEnrichmentPreviewState | null>(null);

  const loadBundle = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/v1/me/setup");
      if (!res.ok) {
        setMessage("Failed to load setup bundle");
        return;
      }

      const data = (await res.json()) as SetupBundle;
      setBundle(data);

      const latestAnswers = data.latestAnswers;
      if (latestAnswers) {
        const latestIcps = parseIcps(latestAnswers.answers.icps);
        setAnswers((current) => ({
          ...current,
          industry: latestAnswers.answers.industry ?? current.industry,
          icps: latestIcps.length ? latestIcps : current.icps,
          topics: latestAnswers.answers.topics ?? current.topics,
          writingStyle: latestAnswers.answers.writingStyle ?? current.writingStyle,
          brandVoice: latestAnswers.answers.brandVoice ?? current.brandVoice,
          personalizationNotes: latestAnswers.answers.personalizationNotes ?? current.personalizationNotes
        }));
        setDraft((current) => ({
          ...current,
          icpsText: latestIcps.length ? serializeIcps(latestIcps) : current.icpsText
        }));
      }

      if (data.profile) {
        setProfile({ profile: data.profile, version: data.profile.version });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    void loadBundle();
  }, [isLoaded, isSignedIn, loadBundle]);

  const payload = useMemo(
    () => ({
      industry: answers.industry,
      icps: parseIcpsText(draft.icpsText),
      topics: answers.topics,
      writingStyle: answers.writingStyle,
      brandVoice: answers.brandVoice,
      personalizationNotes: answers.personalizationNotes
    }),
    [answers, draft.icpsText]
  );

  const currentQuestion = setupQuestions[step];

  useEffect(() => {
    setEnrichmentPreview(null);
  }, [step]);

  const currentValue = useMemo(() => {
    const value = currentQuestion.key === "icps" ? draft.icpsText : answers[currentQuestion.key];
    if (Array.isArray(value)) {
      return value.join("\n");
    }
    return value;
  }, [answers, currentQuestion.key, draft.icpsText]);

  function setCurrentValue(value: string) {
    if (currentQuestion.key === "icps") {
      setDraft((current) => ({ ...current, icpsText: value }));
      return;
    }

    setAnswers((previous) => ({ ...previous, [currentQuestion.key]: value }));
  }

  async function saveAnswers(showSuccessMessage = true): Promise<boolean> {
    setSaving(true);
    if (showSuccessMessage) {
      setMessage("Saving answers...");
    }

    try {
      const res = await fetchWithAuth("/v1/me/setup/answers", {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as unknown;
        setMessage(parseErrorMessage(errorPayload, "Failed to save answers"));
        return false;
      }

      if (showSuccessMessage) {
        setMessage("Answers saved");
      }
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function generateProfile() {
    setGenerating(true);
    setMessage("Generating profile...");

    try {
      const res = await fetchWithAuth("/v1/me/setup/generate", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as unknown;
        setMessage(parseErrorMessage(errorPayload, "Failed to generate profile"));
        return;
      }

      const data = (await res.json()) as { profile: SetupProfileView; version: number };
      setProfile(data);
      await loadBundle();
      setMessage("Profile generated. Review and complete setup.");
    } finally {
      setGenerating(false);
    }
  }

  async function completeSetup() {
    setMessage("Completing setup...");
    const res = await fetchWithAuth("/v1/me/setup/complete", { method: "POST" });
    if (!res.ok) {
      const errorPayload = (await res.json().catch(() => null)) as unknown;
      setMessage(parseErrorMessage(errorPayload, "Failed to complete setup"));
      return;
    }
    await loadBundle();
    setMessage("Setup complete. Opened dashboard.");
  }

  async function enrichCurrentAnswer() {
    const baseAnswer = currentValue.trim();
    if (!baseAnswer) {
      setMessage("Add an answer first, then enrich it with AI.");
      return;
    }

    setEnriching(true);
    setMessage("Enriching answer with AI...");

    try {
      const res = await fetchWithAuth("/v1/me/setup/enrich", {
        method: "POST",
        body: JSON.stringify({ question: currentQuestion.title, answer: baseAnswer })
      });

      if (!res.ok) {
        const errorPayload = (await res.json().catch(() => null)) as unknown;
        setMessage(parseErrorMessage(errorPayload, "Failed to enrich answer"));
        return;
      }

      const data = (await res.json()) as SetupEnrichmentPreviewState;
      setEnrichmentPreview(data);
      setMessage("Generated texts are shown below. Your original answer stayed in place.");
    } finally {
      setEnriching(false);
    }
  }

  async function goNext() {
    await saveAnswers(false);
    if (step < setupQuestions.length - 1) {
      setStep((previous) => previous + 1);
      return;
    }

    await generateProfile();
  }

  function goBack() {
    if (step > 0) {
      setStep((previous) => previous - 1);
    }
  }

  const isComplete = Boolean(bundle?.isComplete);
  const profileView = bundle?.profile ?? profile?.profile ?? null;

  const dashboardCards = useMemo(() => {
    if (!profileView) return [];
    return [
      { title: "Industry", value: profileView.industry ?? "Not set" },
      { title: "ICPs", value: Array.isArray(profileView.icps) ? profileView.icps.join(", ") : "Not set" },
      { title: "Writing style", value: profileView.writingStyle ?? "Not set" },
      { title: "Brand voice", value: profileView.brandVoice ?? "Not set" },
      { title: "Personalization", value: profileView.personalizationNotes ?? "Not set" },
      { title: "Profile version", value: String(profileView.version) }
    ];
  }, [profileView]);

  if (!isLoaded) return <p>Loading…</p>;
  if (!isSignedIn) return <p>Please sign in to continue setup.</p>;

  if (loading) {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
        <p style={{ color: "var(--color-ink)" }}>Loading your setup…</p>
      </main>
    );
  }

  if (isComplete && profileView) {
    return (
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
        <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", fontFamily: "var(--font-display)" }}>
              Your setup dashboard
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "var(--color-ink)" }}>
              Your profile is saved and ready for downstream generation.
            </p>
          </div>
          <Button variant="secondary" type="button" onClick={loadBundle}>
            Refresh
          </Button>
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {dashboardCards.map((card) => (
            <Card key={card.title}>
              <p style={{ margin: 0, color: "var(--color-ink)" }}>{card.title}</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "1rem", lineHeight: 1.5 }}>{card.value}</p>
            </Card>
          ))}
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginTop: 16 }}>
          <Card>
            <h2 style={{ marginTop: 0 }}>Selected schedule</h2>
            <p style={{ color: "var(--color-ink)" }}>
              {bundle?.schedule?.enabled ? "Active" : "Not active yet"}
            </p>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(bundle?.schedule?.schedule ?? {}, null, 2)}</pre>
            <p style={{ marginTop: 12 }}>
              Cron: <strong>{bundle?.schedule?.cronExpr ?? "Not set"}</strong>
            </p>
          </Card>

          <Card>
            <h2 style={{ marginTop: 0 }}>Generated profile JSON</h2>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(profileView, null, 2)}</pre>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <div
        style={{
          minHeight: "calc(100vh - 210px)",
          display: "grid",
          placeItems: "center",
          position: "relative"
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "5% 10% auto",
            height: 320,
            background:
              "radial-gradient(circle at 20% 40%, #f0e1d1, transparent 45%), radial-gradient(circle at 80% 20%, #e4cfb7, transparent 40%), radial-gradient(circle at 50% 90%, #f7e5d7, transparent 45%)",
            filter: "blur(18px)",
            opacity: 0.6,
            pointerEvents: "none"
          }}
        />

        <div style={{ width: "100%", maxWidth: 760, position: "relative" }}>
          <p style={{ color: "var(--color-ink)", marginBottom: 8 }}>
            Question {step + 1} of {setupQuestions.length}
          </p>

          <Card>
            <h1
              style={{
                marginTop: 0,
                marginBottom: 12,
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                lineHeight: 1.2
              }}
            >
              {currentQuestion.title}
            </h1>
            <p style={{ color: "var(--color-ink)", marginTop: 0 }}>{currentQuestion.helper}</p>

            <Input
              textarea={currentQuestion.multiline ?? false}
              placeholder={currentQuestion.placeholder}
              value={currentValue}
              className="border-stone-300 bg-[#fcfaf6] text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:ring-stone-700/20"
              onChange={(event) => setCurrentValue(event.target.value)}
            />

            <SetupQuestionActions
              isLastStep={step === setupQuestions.length - 1}
              saving={saving}
              generating={generating}
              enriching={enriching}
              onBack={goBack}
              onNext={() => void goNext()}
              onGenerateWithAi={() => void enrichCurrentAnswer()}
              onSaveDraft={() => void saveAnswers(true)}
            />

            <SetupEnrichmentPreview
              preview={enrichmentPreview}
              onUseEnrichedVersion={() => {
                if (!enrichmentPreview) return;
                setCurrentValue(enrichmentPreview.enrichedAnswer);
                setMessage("Used enriched version in the answer field.");
              }}
            />
          </Card>

          {message ? <p style={{ marginTop: 12, color: "var(--color-ink)" }}>{message}</p> : null}

          {profile ? (
            <Card className="mt-4">
              <h2 style={{ marginTop: 0 }}>Generated profile</h2>
              <p style={{ color: "var(--color-ink)" }}>Version {profile.version}</p>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {JSON.stringify(profile.profile, null, 2)}
              </pre>

              <div style={{ marginTop: 14 }}>
                <Button
                  className="rounded-2xl border border-[#d8bfa1] bg-[#ead5be] text-stone-900 hover:bg-[#e2c8ad]"
                  type="button"
                  onClick={() => void completeSetup()}
                >
                  Complete setup
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
