"use client";

import { Button } from "@/components/ui/Button";

type SetupQuestionActionsProps = {
  isLastStep: boolean;
  saving: boolean;
  generating: boolean;
  enriching: boolean;
  onBack: () => void;
  onNext: () => void;
  onGenerateWithAi: () => void;
  onSaveDraft: () => void;
};

export function SetupQuestionActions({
  isLastStep,
  saving,
  generating,
  enriching,
  onBack,
  onNext,
  onGenerateWithAi,
  onSaveDraft
}: SetupQuestionActionsProps) {
  return (
    <>
      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant="neutral" type="button" onClick={onGenerateWithAi} disabled={enriching}>
          {enriching ? "Enriching..." : "Generate with AI"}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={onSaveDraft}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save draft"}
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <Button variant="ghost" type="button" onClick={onBack} disabled={saving || generating}>
          Back
        </Button>
        <Button
          variant="neutral"
          type="button"
          onClick={onNext}
          disabled={saving || generating}
        >
          {isLastStep
            ? generating
              ? "Generating..."
              : "Generate profile"
            : "Next"}
        </Button>
      </div>
    </>
  );
}
