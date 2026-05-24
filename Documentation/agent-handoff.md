# Agent Handoff

## Task Summary

Fix setup flow reliability (save/generate profile), then redesign setup UX into a one-question-at-a-time centered onboarding panel with AI enrichment and landing-page visual language.

## Working Plan

- Make setup answer persistence support draft/partial saves for step-based onboarding.
- Make generation endpoint accept current draft payload and return clear validation errors.
- Add answer enrichment endpoint for the per-question "Generate with AI" action.
- Refactor setup UI into a centered step wizard that saves drafts, enriches current answer, and generates/completes setup.
- Run lint and capture current status and follow-ups.

## Completed Changes

- Added draft onboarding schema in `packages/shared/src/schemas/onboarding.ts`:
	- `OnboardingAnswersDraftSchema`
	- `OnboardingAnswersDraft`
- Updated setup service in `api/src/services/setupService.ts`:
	- Supports partial answer persistence with merge-from-latest behavior.
	- Introduces `SetupValidationError` for user-fixable generation failures.
	- Adds `enrichOnboardingAnswer(question, answer)` helper.
- Updated setup routes in `api/src/routes/meSetup.ts`:
	- `PUT /v1/me/setup/answers` now accepts draft answers.
	- `POST /v1/me/setup/generate` accepts optional draft payload and persists before generation.
	- `POST /v1/me/setup/enrich` returns an enriched answer.
- Refactored setup page in `web/app/setup/page.tsx`:
	- One-question-at-a-time centered onboarding panel.
	- `Generate with AI` per-question action.
	- `Back` and `Next` navigation with final step triggering profile generation.
	- Draft save action and improved error/status messaging.
	- Landing-style visuals (display heading, soft gradient atmosphere, card-centered layout).
- Added `web/components/setup/SetupQuestionActions.tsx` to encapsulate the setup action buttons.
- Added `web/components/setup/SetupEnrichmentPreview.tsx` to show the generated proof point, target outcome, constraint, and enriched answer.
- Updated setup enrichment so the user's original answer stays in the textbox; only the generated preview updates below.
- Wired `POST /v1/me/setup/enrich` to a real LangChain `ChatGroq` call in `api/src/services/setupService.ts` (requires `GROQ_API_KEY`, optional `GROQ_MODEL`).
- Added a `Use enriched version` button so the generated answer can be copied back into the active setup field.
- Changed the setup save draft button to a light neutral surface with stronger contrast.
- Fixed the Question 2 ICP textarea to keep raw multiline input while typing and normalize only on save/generate.
- Removed the save-draft bundle reload so the setup page no longer flashes its loading state or shifts layout on save.
- Added `packages/shared/src/prompts/setupEnrichment.ts` and wired the API enrich flow to a structured prompt builder.
- Updated setup palette to remove blue accents and use black/brown/cream styling aligned with landing page tone.
- Added missing Prisma migration for setup models: `api/prisma/migrations/20260524055514_setup_models/migration.sql`.
- Applied migration to local/container dev database so setup endpoints no longer fail with missing-table errors.
- Re-themed shared UI tokens away from blue toward a warm black/brown/cream palette.
- Swapped setup enrichment from a direct OpenAI fetch to LangChain `ChatGroq` in `api/src/services/setupService.ts`.
- Updated the setup enrichment prompt to request the JSON fields the preview UI renders.
- Normalized the shared web API fetch wrapper to use a `Headers` object in `web/lib/apiClient.ts`.
- Fixed nullable setup bundle access in `web/app/setup/page.tsx` before hydrating the latest answers.
- Fixed `/v1/me/setup/enrich` to await the async enrichment helper and unwrap Groq-fenced JSON before parsing.

## Current Project Structure Relevant to the Task

- `web/app/setup/page.tsx`: step-based onboarding UI + dashboard mode.
- `api/src/routes/meSetup.ts`: setup load/save/generate/complete + enrich route.
- `api/src/services/setupService.ts`: setup persistence/generation/enrichment logic.
- `packages/shared/src/schemas/onboarding.ts`: strict + draft onboarding schemas.
- `Documentation/design-language.md`: visual direction used in setup refactor.

## Current Status

Setup is now wired for step-by-step draft saving and profile generation. UI flow is centered, one question at a time, and includes per-question enrichment via LangChain Groq.

Validation completed: `pnpm lint`, `pnpm --filter @linkedin-agent/api typecheck`, and `pnpm --filter web typecheck`.

Recent runtime root cause: Groq returned fenced JSON (```json ... ```), which caused `JSON.parse` to throw and terminate the API request path before a response was sent.

## Open Follow-ups or Risks

- Enrichment now uses Groq via LangChain; verify `GROQ_API_KEY` and optional `GROQ_MODEL` are present in the API environment.
- Final setup completion still depends on profile + schedule bundle semantics (`isComplete` is true when both exist).
- Marketplace/schedule editing UI on the setup page remains to be implemented in a subsequent pass.
- If any environment skipped migrations earlier, rerun `prisma migrate deploy` to avoid `P2021` table-not-found errors on `/v1/me/setup*` routes.
