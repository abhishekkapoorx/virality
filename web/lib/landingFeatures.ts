export type BentoSize = "tall" | "wide" | "square";

export type CoreFeature = {
  id: string;
  title: string;
  description: string;
  size: BentoSize;
};

/** Six MVP pillars — user outcomes (see Documentation/PRD.md) */
export const CORE_FEATURES: CoreFeature[] = [
  {
    id: "slack-loop",
    title: "Draft where your team is",
    description:
      "Share a rough idea in Slack. Get a post back with Approve, Refine, or Reject—no new tab to babysit.",
    size: "tall"
  },
  {
    id: "on-brand",
    title: "Sounds like you wrote it",
    description:
      "Your style, topics for the week, and voice rules travel with every draft—so posts stay on-brand over time.",
    size: "square"
  },
  {
    id: "policy",
    title: "Guardrails before you post",
    description:
      "Tone and claim checks catch what you’d never want on LinkedIn. You fix it before it goes live.",
    size: "square"
  },
  {
    id: "human-loop",
    title: "You hit publish",
    description:
      "Nothing goes to LinkedIn without you. Approve in Slack, copy to LinkedIn, keep your reputation yours.",
    size: "wide"
  },
  {
    id: "carousel",
    title: "Carousels included",
    description:
      "When a post needs slides, you get a carousel that matches how you like them designed—not a generic template.",
    size: "square"
  },
  {
    id: "delivery",
    title: "Slack and the web",
    description:
      "Review in Slack on your phone. Tweak context on the web when you’re planning the month ahead.",
    size: "square"
  }
];

/** Interactive demo steps — outcome language only */
export const PRODUCT_FLOW_STEPS = [
  {
    id: "input",
    label: "Share an idea",
    headline: "A note, bullets, or a link is enough",
    detail:
      "Drop it in Slack like you would ask a colleague. Your voice and preferences are already loaded.",
    preview: "input" as const
  },
  {
    id: "draft",
    label: "Get a draft",
    headline: "A post—and slides when you need them",
    detail:
      "Minutes later, a draft lands in thread. Read it on mobile or desktop before anyone else sees it.",
    preview: "draft" as const
  },
  {
    id: "refine",
    label: "Refine",
    headline: "Nudge it until it’s right",
    detail:
      "Too long? Too safe? Say what to change. You get a fresh version without starting over.",
    preview: "refine" as const
  },
  {
    id: "approve",
    label: "Approve & post",
    headline: "When it’s ready, it’s yours",
    detail:
      "Approve means you’re happy to publish. Post on LinkedIn on your timeline—your account, your call.",
    preview: "approve" as const
  }
] as const;

export type FlowPreview = (typeof PRODUCT_FLOW_STEPS)[number]["preview"];
