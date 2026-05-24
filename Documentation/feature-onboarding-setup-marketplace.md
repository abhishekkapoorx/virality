# Feature Plan - Onboarding, Setup Dashboard, and Marketplace

Last updated: 2026-05-23

This document describes the next major product slice: turn the current workflow page into a setup experience that collects user inputs, generates a structured profile, stores it per user, and then exposes a modern dashboard with scheduling and marketplace controls.

Cross-check with [ARCHITECTURE.md](./ARCHITECTURE.md), [planned-routes.md](./planned-routes.md), and [PRD.md](./PRD.md).

---

## 1) Product goal

Replace the current freeform workflow page with a guided setup flow that does two things:

1. For new or incomplete users, collect onboarding answers, generate a structured content profile with the LLM, and persist it.
2. For completed users, show a dashboard that summarizes the saved configuration, weekly schedule, selected marketplace items, and downstream generation status.

The setup experience should feel like a product onboarding flow, not a settings form.

---

## 2) User experience

### 2.1 Route behavior

- Preferred canonical route: `/setup`
- Backward-compatible alias: `/workflow` can redirect to `/setup`
- If the user does not have a complete setup, show the onboarding wizard.
- If the user already completed setup, show the dashboard view with their saved content.

### 2.2 Onboarding flow

The onboarding flow should ask 5 to 6 questions, then pass the answers to the LLM to generate a structured profile.

Recommended questions:

1. What industry do you work in?
2. Who are the 3 or more ideal customers or readers you want to reach?
3. What kinds of topics or post angles do you want to focus on?
4. How would you describe your writing style today?
5. What should your brand voice feel like?
6. What important personal details, proof points, or constraints should the system remember when writing posts?

The system should convert these answers into structured fields, not store only raw text.

### 2.3 Dashboard view

Once setup is complete, the page should show:

- Industry
- ICPs
- Writing style
- Brand voice
- Personalization notes
- Selected post styles
- Selected hooks
- Weekly schedule
- Next scheduled run
- Status of downstream draft generation

The dashboard should use a clean, modern layout with cards, grouped sections, and clear empty states.

### 2.4 Marketplace UX

Users should be able to browse and drag items from two marketplaces:

- Post styles marketplace
- Hooks marketplace

Marketplace items can be:

- Private, visible only to the creator
- Public, visible to all users

Search should be available during drag-and-drop selection so users can quickly find styles or hooks.

---

## 3) Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | `/setup` must show onboarding when the user has no completed setup | P0 |
| FR-2 | `/setup` must show dashboard state when setup is already complete | P0 |
| FR-3 | Onboarding collects 5 to 6 guided answers | P0 |
| FR-4 | LLM converts onboarding answers into structured profile fields | P0 |
| FR-5 | Structured profile is stored per user in the database | P0 |
| FR-6 | User can configure weekly schedule from the same setup page | P0 |
| FR-7 | Weekly schedule resolves to backend cron/job configuration | P0 |
| FR-8 | Users can browse public and private post styles in a marketplace | P1 |
| FR-9 | Users can browse public and private hooks in a marketplace | P1 |
| FR-10 | Users can search and drag items into their selected stack | P1 |
| FR-11 | Downstream draft generation must consume the saved setup profile, styles, hooks, and schedule | P0 |

---

## 4) Proposed build order

### Phase 1 - Data and API foundation

- Add database models for setup state, structured profile data, schedule config, styles, and hooks.
- Add user-scoped routes for loading and saving setup data.
- Add marketplace routes for browsing and creating styles/hooks.

### Phase 2 - Onboarding wizard

- Replace the current workflow form with a step-based onboarding flow.
- Persist raw answers and the generated structured profile.
- Mark setup complete only after the structured profile is successfully stored.

### Phase 3 - Dashboard shell

- Render the saved profile in a modern dashboard.
- Add schedule controls and selected marketplace items.
- Include empty states for styles and hooks when nothing is selected yet.

### Phase 4 - Marketplace selection

- Build search and drag-and-drop selection for styles and hooks.
- Support public visibility and private ownership.
- Allow users to create their own reusable templates.

### Phase 5 - Scheduler integration

- Translate the selected weekly schedule into backend cron configuration.
- Trigger the downstream draft pipeline on schedule.
- Surface schedule health and the next run on the dashboard.

### Phase 6 - Downstream generation wiring

- Feed the stored profile, styles, hooks, and schedule into the existing draft generation pipeline.
- Keep the output structured so the worker can consume it without re-parsing UI state.

---

## 5) Acceptance criteria

- A new user lands on `/setup`, completes onboarding, and sees a saved dashboard.
- A returning user lands on `/setup` and sees their saved setup instead of the questionnaire.
- The system stores one structured profile per user and can render it back clearly.
- The user can choose schedule slots and marketplace items without leaving the page.
- The downstream agent can read the saved configuration and use it to generate post drafts.

---

## 6) Open questions

1. Should `/workflow` remain as a redirect only, or stay as a second canonical route?
2. Do we want one profile per user or versioned profile snapshots per update?
3. Should marketplace hooks/styles be curated templates, user-generated templates, or both from day one?
4. Should the weekly schedule be stored as a human-friendly grid plus derived cron, or only as cron?
5. Should onboarding answers be editable before the LLM generates the structured profile?
