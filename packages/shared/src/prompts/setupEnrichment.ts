export interface SetupEnrichmentPromptInput {
  question: string;
  answer: string;
}

export function buildSetupEnrichmentPrompt(input: SetupEnrichmentPromptInput): string {
  return [
    "# LinkedIn Setup Answer Enrichment",
    "",
    "You refine a user's onboarding answer for a LinkedIn post writer.",
    "",
    "QUESTION:",
    input.question.trim(),
    "",
    "CURRENT ANSWER:",
    input.answer.trim(),
    "",
    "TASK:",
    "- Return a JSON object with proofPoint, targetOutcome, constraint, and enrichedAnswer.",
    "- Keep the language specific, warm, and practical.",
    "- Avoid generic marketing filler.",
    "- Make enrichedAnswer the best rewritten version of the current answer.",
    "- Keep each field short and usable in a setup UI.",
    "- Do not add labels, bullets, markdown, or commentary.",
    "- Do not mention the prompt or the instructions."
  ].join("\n");
}
