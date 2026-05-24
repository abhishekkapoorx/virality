"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type SetupEnrichmentPreviewProps = {
  preview: null | {
    proofPoint: string;
    targetOutcome: string;
    constraint: string;
    enrichedAnswer: string;
  };
  onUseEnrichedVersion: () => void;
};

export function SetupEnrichmentPreview({ preview, onUseEnrichedVersion }: SetupEnrichmentPreviewProps) {
  if (!preview) return null;

  return (
    <Card className="mt-4 border-stone-300 bg-[#fcfaf6]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">Generated texts</Badge>
        <span className="text-sm text-stone-600">What the writer can apply immediately</span>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <p className="text-sm font-semibold text-stone-900">Proof point</p>
          <p className="mt-1 text-sm leading-6 text-stone-700">{preview.proofPoint}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-900">Target outcome</p>
          <p className="mt-1 text-sm leading-6 text-stone-700">{preview.targetOutcome}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-900">Constraint</p>
          <p className="mt-1 text-sm leading-6 text-stone-700">{preview.constraint}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#d8c0a2] bg-[#f4e8d8] p-4">
        <p className="text-sm font-semibold text-stone-900">Generated answer</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-800">{preview.enrichedAnswer}</pre>
        <button
          type="button"
          onClick={onUseEnrichedVersion}
          className="mt-4 inline-flex items-center justify-center rounded-2xl border border-stone-700 bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-stone-800"
        >
          Use enriched version
        </button>
      </div>
    </Card>
  );
}
