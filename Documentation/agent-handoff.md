# Agent Handoff

## Task Summary

Expand the `/setup` dashboard into a marketplace experience for hooks and post types, with searchable selection, detailed views, custom item creation, and a day-by-day schedule surface.

## Working Plan

- Keep the existing onboarding flow intact.
- Add a marketplace dashboard slice for hooks and post types on completed setup.
- Let users search public items, inspect detail views, create their own private/public entries, and assign post types to weekdays.
- Run lint and capture current status and follow-ups.

## Completed Changes

	- search-triggered marketplace modal for hooks and post types
	- detailed item view in the same modal
	- user-created item forms with public/private toggle
	- selected hooks list
	- weekday schedule containers for post type assignment
	- browser-local persistence for marketplace state
	- `OnboardingAnswersDraftSchema`
	- `OnboardingAnswersDraft`
	- Supports partial answer persistence with merge-from-latest behavior.
	- Introduces `SetupValidationError` for user-fixable generation failures.
	- Adds `enrichOnboardingAnswer(question, answer)` helper.
	- `PUT /v1/me/setup/answers` now accepts draft answers.
	- `POST /v1/me/setup/generate` accepts optional draft payload and persists before generation.
	- `POST /v1/me/setup/enrich` returns an enriched answer.
	- One-question-at-a-time centered onboarding panel.
	- `Generate with AI` per-question action.
	- `Back` and `Next` navigation with final step triggering profile generation.
	- Draft save action and improved error/status messaging.
	- Landing-style visuals (display heading, soft gradient atmosphere, card-centered layout).

## Current Project Structure Relevant to the Task

- `web/app/setup/page.tsx`: step-based onboarding UI + dashboard mode.
- `web/components/setup/SetupMarketplaceDashboard.tsx`: hooks/post types marketplace, detail modal, and weekday schedule grid.
- `web/lib/setupMarketplace.ts`: marketplace seed data, template generators, and default selections.
- `web/app/setup/page.tsx`: dashboard now includes saved ICP card grid and a prominent editable detailed-docs section.
- `web/app/setup/page.tsx`: shows a generate button when detailed docs are missing.
- `web/app/setup/page.tsx`: editable profile summary section + regenerate detailed docs button.
- `web/app/setup/page.tsx`: dashboard Edit button opens a modal for profile editing.
- `web/components/setup/SetupDetailedDocsEditor.tsx`: editable detailed docs + ICP cards UI.
- `api/src/routes/meSetup.ts`: setup load/save/generate/complete + enrich route.
- `api/src/routes/meSetup.ts`: profile-summary update route for editable generated fields.
- `api/src/services/setupService.ts`: setup persistence/generation/enrichment logic.
- `api/src/services/setupService.ts`: profile summary update helper.
- `packages/shared/src/schemas/onboarding.ts`: strict + draft onboarding schemas.
- `packages/shared/src/prompts/setupDetailedDocs.ts`: prompt builder for structured detailed docs generation.
 Validation completed: `pnpm --filter @linkedin-agent/web lint` and `pnpm --filter @linkedin-agent/web typecheck`.
- `Documentation/design-language.md`: visual direction used in setup refactor.

## Current Status

Setup is wired for step-by-step draft saving and profile generation, and the completed dashboard now includes a marketplace experience for hooks and post types.

After users save detailed docs, the setup dashboard shows persisted ICPs as distinct cards for easier review.

The editable detailed-docs form is now displayed prominently on `/setup`, not hidden below the fold.

If a profile exists but `detailedDocs` is missing, `/setup` now shows a dedicated generate button that re-runs the detailed-doc LLM flow from the stored onboarding answers.

The generated profile summary itself is now editable, so users can change industry, ICPs, writing style, brand voice, and personalization notes before regenerating the detailed docs.

Profile generation now writes the enriched detailed docs directly to `UserSetupProfile.detailedDocs`, and the generator normalizes to exactly three ICP cards.

Detailed docs are now LLM-only: if the model does not return the full enriched shape, profile generation fails instead of inventing placeholder content.

Marketplace selections currently persist in the browser via `localStorage`; backend persistence and API routes for marketplace items are still pending.

Validation completed: `pnpm --filter @linkedin-agent/shared build`, `pnpm lint`, `pnpm --filter @linkedin-agent/api typecheck`, and `pnpm --filter @linkedin-agent/web typecheck`.

Recent runtime root cause: Groq returned fenced JSON (```json ... ```), which caused `JSON.parse` to throw and terminate the API request path before a response was sent.

## Open Follow-ups or Risks

- Enrichment now uses Groq via LangChain; verify `GROQ_API_KEY` and optional `GROQ_MODEL` are present in the API environment.
- Final setup completion still depends on profile + schedule bundle semantics (`isComplete` is true when both exist).
- Marketplace state is local-only right now; connect the new UI to the Prisma marketplace models and user-selected rows in the next pass.
- If any environment skipped migrations earlier, rerun `prisma migrate deploy` to avoid `P2021` table-not-found errors on `/v1/me/setup*` routes.
