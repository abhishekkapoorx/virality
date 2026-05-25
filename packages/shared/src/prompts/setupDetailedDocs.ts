import type { OnboardingAnswers } from "../schemas/onboarding.js";

export interface SetupDetailedDocsPromptInput {
  answers: OnboardingAnswers;
}

export function buildSetupDetailedDocsPrompt(input: SetupDetailedDocsPromptInput): string {
  const answers = input.answers;

  return [
    "# LinkedIn Setup Detailed Docs Generation",
    "",
    "You are generating editable setup documentation for a LinkedIn writing assistant.",
    "Output must be strict JSON only.",
    "",
    "USER ANSWERS:",
    JSON.stringify(answers, null, 2),
    "",
    "RETURN JSON WITH THIS SHAPE:",
    "{",
    '  "industryNarrative": string,',
    '  "topicLanes": string[],',
    '  "writingStyleGuide": string,',
    '  "brandVoiceGuide": string,',
    '  "personalizationGuide": string,',
    '  "icpCards": [',
    "    {",
    '      "label": string,',
    '      "role": string,',
    '      "context": string,',
    '      "painPoints": string[],',
    '      "desiredOutcome": string,',
    '      "messageAngles": string[],',
    '      "ctaStyle": string',
    "    }",
    "  ]",
    "}",
    "",
    "RULES:",
    "- Re-enrich every field from the user's answers; do not copy raw answers verbatim.",
    "- Keep output practical and specific.",
    "- Create exactly 3 ICP cards.",
    "- Make each ICP card meaningfully distinct even if the user only supplied one ICP.",
    "- Use short, clear phrases suitable for card UI and editable fields.",
    "- Avoid markdown and code fences.",
    "- Return JSON only."
  ].join("\n");
}
