/**
 * Stub prompt assembly. Real prompt + policy pre-checks land alongside
 * Phase 9 (Policy + LLM). Keep this module pure so it can be unit tested
 * without any adapter or DB access.
 */
export interface DraftPromptInput {
  inboundText: string;
  instructionProfileSnapshot: Record<string, unknown>;
}

export function buildDraftPrompt(input: DraftPromptInput): string {
  const writingStyle = String(
    input.instructionProfileSnapshot.writingStyle ?? "default"
  );
  const weeklyCalendar = String(
    input.instructionProfileSnapshot.weeklyCalendar ?? "unspecified"
  );

  return [
    "[stub draft prompt]",
    `writingStyle=${writingStyle}`,
    `weeklyCalendar=${weeklyCalendar}`,
    `inbound=${input.inboundText}`
  ].join("\n");
}
