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

export const SETUP_PUBLIC_HOOKS: SetupMarketplaceHook[] = [
  {
    id: "hook-curiosity-gap",
    title: "Curiosity Gap",
    author: "Editorial Lab",
    shortDescription: "Create tension by revealing the missing step only after the reader leans in.",
    longDescription:
      "Title: Curiosity Gap\n\nWhen to use:\n- Use when the post needs an immediate stop-scroll opening and a clear unfinished thought.\n- Works well for lessons, contrarian observations, and before/after stories.\n\nExamples:\n- 'I stopped writing this one sentence after I saw what it did to replies.'\n- 'The biggest mistake in our launch was not what we launched, but what we assumed.'\n\nPsychological effect:\n- The audience feels a small information gap and wants to resolve it.\n- That tension increases the chance they keep reading.\n\nLLM notes:\n- Keep the gap specific.\n- Avoid clickbait that fails to pay off.\n- Match the promised answer to the rest of the post.",
    visibility: "public",
    icon: "Sparkles",
    tags: ["attention", "story", "stop-scroll"],
    examples: ["The one mistake nobody mentions", "What changed after we stopped doing X"],
    whenToUse: "Use for the first line when the post needs momentum fast.",
    psychologicalEffect: "Creates anticipation and a need to resolve the missing context."
  },
  {
    id: "hook-contrarian-reframe",
    title: "Contrarian Reframe",
    author: "LinkedIn Agent",
    shortDescription: "Flip a common belief and then defend the better version.",
    longDescription:
      "Title: Contrarian Reframe\n\nWhen to use:\n- Use when the audience already expects the default advice and you have a stronger alternative.\n- Best for opinionated experts who can support the reversal with examples.\n\nExamples:\n- 'Speed is not the problem. Unclear ownership is.'\n- 'Most teams do not need more content. They need fewer topics and better repetition.'\n\nPsychological effect:\n- The reader pauses because the opening challenges a familiar assumption.\n- Curiosity stays high if the post immediately proves the new frame with evidence.\n\nLLM notes:\n- State the old belief clearly before replacing it.\n- Never contradict without offering a useful alternative.",
    visibility: "public",
    icon: "Target",
    tags: ["opinion", "reframe", "authority"],
    examples: ["Why the obvious advice is wrong", "The better rule is smaller than you think"],
    whenToUse: "Use for thought leadership and expert positioning.",
    psychologicalEffect: "Signals confidence and invites the reader to reconsider a default belief."
  },
  {
    id: "hook-proof-by-example",
    title: "Proof by Example",
    author: "Playbook Studio",
    shortDescription: "Open with a concrete case that makes the lesson feel real immediately.",
    longDescription:
      "Title: Proof by Example\n\nWhen to use:\n- Use when the post is built around evidence, a case study, or a repeatable process.\n- Great for posts where the reader needs to trust the point before accepting the lesson.\n\nExamples:\n- 'We changed one line in the onboarding email and conversion jumped.'\n- 'This is the exact sequence we used when a launch went sideways.'\n\nPsychological effect:\n- Concrete details lower resistance because the brain treats the story as credible.\n- The reader can picture the situation before you explain the lesson.\n\nLLM notes:\n- Prefer specific numbers, named roles, and observable actions.\n- Keep abstractions short and return to the example often.",
    visibility: "public",
    icon: "BookOpenText",
    tags: ["evidence", "case study", "practical"],
    examples: ["We changed one thing and saw the result", "Here is the exact sequence we used"],
    whenToUse: "Use when you have a story, metric, or client result to anchor the point.",
    psychologicalEffect: "Builds credibility by making the abstract lesson feel observable and testable."
  },
  {
    id: "hook-audience-callout",
    title: "Audience Callout",
    author: "Audience Research Kit",
    shortDescription: "Name the exact person who should care, then describe their reality.",
    longDescription:
      "Title: Audience Callout\n\nWhen to use:\n- Use when a post should feel personally relevant to a narrow reader.\n- Works especially well for niche operators, founders, and specialists.\n\nExamples:\n- 'If you run growth at a seed-stage startup, this is probably familiar.'\n- 'For operators tired of generic content advice, this is the part that matters.'\n\nPsychological effect:\n- The reader feels seen and classified quickly.\n- Relevance rises because the opening appears tailored to their exact context.\n\nLLM notes:\n- Be precise about role, stage, or responsibility.\n- Avoid broad segments that could apply to everyone.",
    visibility: "public",
    icon: "Users",
    tags: ["audience", "relevance", "narrowcast"],
    examples: ["If you run growth at a seed-stage startup", "For founders who keep rewriting the same post"],
    whenToUse: "Use when you want a sharp relevance signal in the first sentence.",
    psychologicalEffect: "Makes the reader feel directly addressed and increases the chance they keep reading."
  },
  {
    id: "hook-negative-warning",
    title: "Negative Warning",
    author: "Editorial Lab",
    shortDescription: "Lead with the risk of doing the wrong thing, then show the safer path.",
    longDescription:
      "Title: Negative Warning\n\nWhen to use:\n- Use when the post teaches through consequence, risk, or anti-patterns.\n- Good for process posts, growth mistakes, and avoidable failures.\n\nExamples:\n- 'If you publish this way, you will get polite silence instead of replies.'\n- 'The fastest way to weaken the post is to stuff it with seven unrelated ideas.'\n\nPsychological effect:\n- Loss aversion makes the reader pay attention to the warning.\n- The post feels useful because it protects them from a common mistake.\n\nLLM notes:\n- Keep the warning concrete and proportionate.\n- Follow with a clear corrective action.",
    visibility: "public",
    icon: "ShieldAlert",
    tags: ["risk", "mistake", "teaching"],
    examples: ["If you do this, the post collapses", "The fastest way to ruin the angle is..."],
    whenToUse: "Use when the post should warn, sharpen, or correct a common mistake.",
    psychologicalEffect: "Triggers loss aversion and makes the advice feel protective."
  }
];

export const SETUP_PUBLIC_POST_TYPES: SetupMarketplacePostType[] = [
  {
    id: "post-case-study",
    title: "Case Study",
    author: "Editorial Lab",
    shortDescription: "Turn one outcome into a compact narrative with proof and a lesson.",
    longDescription:
      "Title: Case Study\n\nStructure:\n- Context: what changed and why it mattered.\n- Tension: the obstacle, constraint, or false start.\n- Intervention: the move, test, or decision.\n- Result: the measurable or visible outcome.\n- Lesson: the repeatable principle the reader can apply.\n\nExpected hooks to use:\n- Proof by Example\n- Curiosity Gap\n- Audience Callout\n\nOutcome:\n- The reader should trust the lesson because the story proves it happened.",
    visibility: "public",
    icon: "Layers3",
    tags: ["proof", "story", "results"],
    structure: "Context -> tension -> intervention -> result -> lesson",
    expectedHooks: ["Proof by Example", "Curiosity Gap", "Audience Callout"],
    outcome: "Makes the advice feel concrete, credible, and actionable."
  },
  {
    id: "post-framework",
    title: "Framework Breakdown",
    author: "Playbook Studio",
    shortDescription: "Explain a reusable mental model and show how to apply it.",
    longDescription:
      "Title: Framework Breakdown\n\nStructure:\n- Open with the problem the framework solves.\n- Define the framework in plain language.\n- Show the components or steps.\n- Demonstrate one example in action.\n- Close with the practical takeaway.\n\nExpected hooks to use:\n- Contrarian Reframe\n- Proof by Example\n- Negative Warning\n\nOutcome:\n- The reader leaves with a reusable model they can name and repeat.",
    visibility: "public",
    icon: "Workflow",
    tags: ["framework", "teaching", "repeatable"],
    structure: "Problem -> framework -> components -> example -> takeaway",
    expectedHooks: ["Contrarian Reframe", "Proof by Example", "Negative Warning"],
    outcome: "Turns expertise into a reusable model that readers can remember."
  },
  {
    id: "post-build-in-public",
    title: "Build in Public",
    author: "LinkedIn Agent",
    shortDescription: "Share the work-in-progress, the numbers, and the lesson behind the work.",
    longDescription:
      "Title: Build in Public\n\nStructure:\n- State the project, experiment, or milestone.\n- Share the current status and the visible signal.\n- Explain what surprised you or what is still unresolved.\n- Reveal the next step.\n- Invite the reader into the process.\n\nExpected hooks to use:\n- Audience Callout\n- Curiosity Gap\n- Proof by Example\n\nOutcome:\n- The reader experiences the journey as credible, transparent, and in motion.",
    visibility: "public",
    icon: "Hammer",
    tags: ["build", "transparency", "journey"],
    structure: "Project -> status -> surprise -> next step -> invitation",
    expectedHooks: ["Audience Callout", "Curiosity Gap", "Proof by Example"],
    outcome: "Creates momentum by showing progress instead of only polished conclusions."
  },
  {
    id: "post-lessons-learned",
    title: "Lessons Learned",
    author: "Editorial Lab",
    shortDescription: "Capture the mistake, the correction, and the principle that followed.",
    longDescription:
      "Title: Lessons Learned\n\nStructure:\n- Start with the mistake or surprise.\n- Describe what you tried first.\n- Explain why it failed or underperformed.\n- Show the corrected approach.\n- End with the principle that now guides the work.\n\nExpected hooks to use:\n- Negative Warning\n- Proof by Example\n- Contrarian Reframe\n\nOutcome:\n- The reader gets a practical lesson with a clear before/after shape.",
    visibility: "public",
    icon: "GraduationCap",
    tags: ["lesson", "mistake", "reflection"],
    structure: "Mistake -> attempt -> failure -> correction -> principle",
    expectedHooks: ["Negative Warning", "Proof by Example", "Contrarian Reframe"],
    outcome: "Turns a failure or surprise into a useful operating rule."
  },
  {
    id: "post-myth-buster",
    title: "Myth Buster",
    author: "Audience Research Kit",
    shortDescription: "Break a popular belief, then replace it with a better rule.",
    longDescription:
      "Title: Myth Buster\n\nStructure:\n- Name the myth clearly.\n- Explain why it sounds reasonable.\n- Show where it breaks down in practice.\n- Replace it with a better rule or lens.\n- Close with the practical implication.\n\nExpected hooks to use:\n- Contrarian Reframe\n- Negative Warning\n- Audience Callout\n\nOutcome:\n- The reader gets a memorable correction they can repeat to others.",
    visibility: "public",
    icon: "CircleSlash2",
    tags: ["myth", "correction", "opinion"],
    structure: "Myth -> why it sounds right -> why it breaks -> better rule -> implication",
    expectedHooks: ["Contrarian Reframe", "Negative Warning", "Audience Callout"],
    outcome: "Replaces a vague belief with a sharper rule the reader can actually use."
  }
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

export function getDefaultSelectedHookIds(): string[] {
  return [SETUP_PUBLIC_HOOKS[0].id, SETUP_PUBLIC_HOOKS[2].id];
}

export function getDefaultSelectedPostTypesByDay(): Record<SetupMarketplaceDayKey, string | null> {
  return {
    monday: SETUP_PUBLIC_POST_TYPES[0].id,
    tuesday: null,
    wednesday: SETUP_PUBLIC_POST_TYPES[1].id,
    thursday: null,
    friday: SETUP_PUBLIC_POST_TYPES[2].id,
    saturday: null,
    sunday: null
  };
}