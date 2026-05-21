/** Scheduling section — user-facing outcomes only (see Documentation/feature-landing-page.md) */

export const SCHEDULE_PRESETS = [
  {
    id: "weekly-mon",
    label: "Every Monday morning",
    blurb: "Start the week with a draft waiting in Slack—review over coffee, post when ready."
  },
  {
    id: "weekdays",
    label: "Weekday mornings",
    blurb: "Stay visible during the work week without drafting on weekends."
  },
  {
    id: "biweekly",
    label: "Every other week",
    blurb: "A lighter cadence when you publish occasionally but want consistency."
  }
] as const;

export const SCHEDULE_OUTCOMES = [
  {
    id: "consistency",
    title: "Show up without the blank page",
    description:
      "LinkedIn rewards consistency. A steady rhythm means you spend time refining—not staring at an empty compose box."
  },
  {
    id: "where-you-work",
    title: "Set it where you already are",
    description:
      "Choose your timing in the workflow settings, or say it in Slack when the thought strikes. Same schedule, either place."
  },
  {
    id: "still-you",
    title: "You stay in control",
    description:
      "A scheduled draft is a starting point, not a post. Approve or refine in Slack, then publish on LinkedIn yourself."
  }
] as const;
