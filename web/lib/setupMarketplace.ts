export type MarketplaceVisibility = "public" | "private";

export type SetupMarketplaceDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type SetupMarketplaceHook = {
  id: string;
  title: string;
  author: string;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon?: string;
  tags: string[];
  examples: string[];
  whenToUse: string;
  psychologicalEffect: string;
};

export type SetupMarketplacePostType = {
  id: string;
  title: string;
  author: string;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon?: string;
  tags: string[];
  structure: string;
  expectedHooks: string[];
  outcome: string;
};

export const SETUP_MARKETPLACE_DAYS: Array<{ key: SetupMarketplaceDayKey; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" }
];

export function createHookLongDescriptionTemplate(title: string): string {
  return [
    `Title: ${title || "My new hook"}`,
    "",
    "Short description:",
    "- Summarize the hook in one sentence.",
    "",
    "When to use:",
    "- Describe the post context where this opening works best.",
    "",
    "Examples:",
    "- Add 2 to 3 sample opening lines.",
    "",
    "Psychological effect:",
    "- Explain what the reader feels or notices first.",
    "",
    "LLM notes:",
    "- Mention any rules, guardrails, or audience constraints.",
    "- Include the desired tone, pace, and specificity."
  ].join("\n");
}

export function createPostTypeLongDescriptionTemplate(title: string): string {
  return [
    `Title: ${title || "My new post type"}`,
    "",
    "Structure of post:",
    "- Outline the sections the LLM should produce.",
    "",
    "Expected hooks to use:",
    "- List the opening hooks that fit this post type.",
    "",
    "Writing guidance:",
    "- Add length, tone, and pacing constraints.",
    "",
    "Expected outcome:",
    "- Describe what the reader should think, feel, or do after reading."
  ].join("\n");
}
