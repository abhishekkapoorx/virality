"use client";

import { useMemo } from "react";
import type { SetupDetailedDocs } from "@linkedin-agent/shared";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type SetupDetailedDocsEditorProps = {
  docs: SetupDetailedDocs;
  saving: boolean;
  onChange: (docs: SetupDetailedDocs) => void;
  onSave: () => void;
};

export function SetupDetailedDocsEditor({ docs, saving, onChange, onSave }: SetupDetailedDocsEditorProps) {
  const icpCards = useMemo(() => docs.icpCards ?? [], [docs.icpCards]);

  function updateField<K extends keyof SetupDetailedDocs>(key: K, value: SetupDetailedDocs[K]) {
    onChange({ ...docs, [key]: value });
  }

  function updateIcpCard(index: number, next: SetupDetailedDocs["icpCards"][number]) {
    const nextCards = icpCards.map((card, cardIndex) => (cardIndex === index ? next : card));
    updateField("icpCards", nextCards);
  }

  function parseCommaList(raw: string): string[] {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return (
    <Card className="mt-4 border-stone-300 bg-[#fcfaf6]">
      <h2 className="mt-0 text-xl text-stone-900">Detailed profile docs</h2>
      <p className="text-sm text-stone-600">
        These are AI-generated and fully editable. They drive better downstream writing quality.
      </p>

      <div className="mt-4 grid gap-4">
        <Input
          textarea
          value={docs.industryNarrative}
          onChange={(event) => updateField("industryNarrative", event.target.value)}
          placeholder="Industry narrative"
          className="border-stone-300 bg-white text-stone-900"
        />

        <Input
          value={docs.topicLanes.join(", ")}
          onChange={(event) => updateField("topicLanes", parseCommaList(event.target.value))}
          placeholder="Topic lanes (comma-separated)"
          className="border-stone-300 bg-white text-stone-900"
        />

        <Input
          textarea
          value={docs.writingStyleGuide}
          onChange={(event) => updateField("writingStyleGuide", event.target.value)}
          placeholder="Writing style guide"
          className="border-stone-300 bg-white text-stone-900"
        />

        <Input
          textarea
          value={docs.brandVoiceGuide}
          onChange={(event) => updateField("brandVoiceGuide", event.target.value)}
          placeholder="Brand voice guide"
          className="border-stone-300 bg-white text-stone-900"
        />

        <Input
          textarea
          value={docs.personalizationGuide}
          onChange={(event) => updateField("personalizationGuide", event.target.value)}
          placeholder="Personalization guide"
          className="border-stone-300 bg-white text-stone-900"
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {icpCards.map((card, index) => (
          <Card key={`${card.label}-${index}`} className="border-stone-300 bg-white">
            <p className="m-0 text-xs font-semibold uppercase tracking-wide text-stone-500">
              ICP card {index + 1}
            </p>

            <div className="mt-3 grid gap-3">
              <Input
                value={card.label}
                onChange={(event) => updateIcpCard(index, { ...card, label: event.target.value })}
                placeholder="Label"
              />
              <Input
                value={card.role}
                onChange={(event) => updateIcpCard(index, { ...card, role: event.target.value })}
                placeholder="Role"
              />
              <Input
                value={card.context}
                onChange={(event) => updateIcpCard(index, { ...card, context: event.target.value })}
                placeholder="Context"
              />
              <Input
                textarea
                value={card.painPoints.join("\n")}
                onChange={(event) =>
                  updateIcpCard(index, {
                    ...card,
                    painPoints: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                }
                placeholder="Pain points (one per line)"
              />
              <Input
                textarea
                value={card.messageAngles.join("\n")}
                onChange={(event) =>
                  updateIcpCard(index, {
                    ...card,
                    messageAngles: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                }
                placeholder="Message angles (one per line)"
              />
              <Input
                value={card.desiredOutcome}
                onChange={(event) =>
                  updateIcpCard(index, { ...card, desiredOutcome: event.target.value })
                }
                placeholder="Desired outcome"
              />
              <Input
                value={card.ctaStyle}
                onChange={(event) => updateIcpCard(index, { ...card, ctaStyle: event.target.value })}
                placeholder="CTA style"
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-2xl border border-stone-700 bg-stone-900 text-stone-100 hover:bg-stone-800"
        >
          {saving ? "Saving docs..." : "Save detailed docs"}
        </Button>
      </div>
    </Card>
  );
}
