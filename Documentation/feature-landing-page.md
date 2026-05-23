# Landing page (`/`)

Last updated: 2026-05-23  
Implementation: `web/app/page.tsx`, `web/components/landing/*`

Cross-links: [feature-plan1.md](./feature-plan1.md) (priority pivot), [ARCHITECTURE.md](./ARCHITECTURE.md) §9 (trigger paths), [planned-routes.md](./planned-routes.md) §2.1.

---

## Purpose

Public marketing shell with waitlist CTA. Product copy aligns with [PRD.md](./PRD.md) and the near-term pivot in feature-plan1—not internal planning labels (no “journey map” or “marketing funnel” sections on the page).

---

## Page structure (scroll order)

| Section | Anchor | Content |
|---------|--------|---------|
| Hero | — | Value prop, waitlist + “Watch the flow” CTAs, animated **Telegram** preview (copy still says Slack in code until landing refresh) |
| Interactive flow | `#flow` | Clickable/auto-advancing demo of draft loop (input → draft → refine → approve) |
| Core features | `#features` | Six bento cards (Telegram loop, on-brand gen, policy, manual publish, carousel, delivery) |
| **Cron scheduling** | `#schedule` | **Dedicated highlight** for per-user cron (see below) |
| How it works | `#how-it-works` | Telegram vs web roles; summary pills |
| Waitlist | `#waitlist` | Email capture via `POST /api/waitlist` |

Nav: Flow · Features · **Scheduling** · How it works · Join waitlist.

---

## Scheduling section (`#schedule`)

Engineering detail: feature-plan1 §3 and ARCHITECTURE §9 (`cronExpression`, `/set_repeat` or web-only schedule, worker tick). **The landing page does not show APIs, cron syntax, or internal paths**—only user outcomes.

### Copy principles (public page)

- Focus on goals: consistency on LinkedIn, drafts ready to review, user stays in control.
- Presets in plain language (e.g. “Every Monday morning”), not Unix cron strings.
- Three outcome cards (consistency, set from app or Telegram, approve before publish)—no endpoint names.

### Landing UX

- Preset chips + week heatmap (“when drafts land”).
- Outcome cards from `SCHEDULE_OUTCOMES` in `web/lib/scheduleLanding.ts`.
- CTA: “Set your rhythm” → `/workflow`.

Source constants: `web/lib/scheduleLanding.ts`. Component: `web/components/landing/ScheduleSection.tsx`.

---

## Maintenance

When scheduling behavior, routes, or field names change, update this file and ARCHITECTURE §9 in the same change set as code.
