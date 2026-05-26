# Agent Handoff

## Task Summary

Expand the `/setup` dashboard into a Prisma-backed marketplace experience for hooks and post types, with searchable selection, detailed views, custom item creation, public/private visibility, and weekday post-type assignment.

Follow-up cleanup pass: remove the nested marketplace card button, push hook list filtering into Prisma, and simplify the selections response shape.

## Working Plan

- Keep the existing onboarding flow intact.
- Use Prisma-backed API routes for marketplace CRUD and selection persistence.
- Keep public items separate from user-created items in the setup modal.
- Preserve the setup summary cards while fixing the modal grid so the search row and create/edit section span the full width.
- Run lint and typecheck for the touched packages, then document the final state.
- Keep the marketplace list cards to a single interactive element.
- Move hook visibility/search filtering into the database query.
- Keep the selections response aligned with the dashboard's weekday-only schedule model.

## Completed Changes

	- `api/src/routes/meMarketplace.ts` adds authenticated CRUD for hooks and post types, plus selection persistence.
	- `api/src/services/marketplaceService.ts` reads and mutates only persisted marketplace rows; there is no hardcoded catalog bootstrap.
	- `web/components/setup/SetupMarketplaceDashboard.live.tsx` now reads and writes live marketplace data instead of `localStorage` mocks.
	- `web/components/setup/SetupMarketplaceDashboard.tsx` now re-exports the live Prisma-backed dashboard.
	- Modal layout now uses a 12-column grid so the search row spans the full width and the create/edit section spans the full width.
	- User selections persist through `/v1/me/marketplace/selections` and weekday assignments are saved in the weekly schedule row.
	- `web/components/setup/SetupMarketplaceDashboard.live.tsx` now uses a single card-level interaction for marketplace list items; the plus affordance is decorative only.
	- `api/src/services/marketplaceService.ts` now pushes hook visibility and search filtering into the Prisma `findMany` query.
	- `api/src/services/marketplaceService.ts` now returns only `selectedHookIds` and `selectedPostStyleIdsByDay` from marketplace selections.

## Current Project Structure Relevant to the Task

- `web/app/setup/page.tsx`: step-based onboarding UI + dashboard mode.
- `web/components/setup/SetupMarketplaceDashboard.live.tsx`: live marketplace UI, Prisma-backed selection flow, and create/edit forms.
- `web/components/setup/SetupMarketplaceDashboard.tsx`: thin re-export to the live dashboard implementation.
- `web/lib/setupMarketplace.ts`: marketplace types, day labels, and description templates.
- `api/src/routes/meSetup.ts`: setup load/save/generate/complete + enrich route.
- `api/src/routes/meSetup.ts`: profile-summary update route for editable generated fields.
- `api/src/routes/meMarketplace.ts`: authenticated marketplace CRUD, lookups, and selection persistence routes.
- `api/src/services/marketplaceService.ts`: Prisma-backed marketplace query/mutation helpers.
- `api/src/services/setupService.ts`: setup persistence/generation/enrichment logic.
- `api/src/services/setupService.ts`: profile summary update helper.
- `packages/shared/src/schemas/onboarding.ts`: strict + draft onboarding schemas.
- `packages/shared/src/prompts/setupDetailedDocs.ts`: prompt builder for structured detailed docs generation.
- Validation completed: `pnpm --filter @linkedin-agent/api lint` and `pnpm --filter @linkedin-agent/web lint`.
- `Documentation/design-language.md`: visual direction used in setup refactor.

## Current Status

Setup is still wired for step-by-step draft saving and profile generation, and the completed dashboard now uses a live marketplace for hooks and post types.

The marketplace modal now shows separate public and user-created lists, editable detail panes, and Prisma-backed create/update/delete flows for both item types.

Hook selections and weekday post-type assignments now persist through Prisma instead of browser storage.

The marketplace cleanup pass is complete: the list card no longer nests interactive buttons, hook listing now filters in Prisma, and selection reads now only expose the weekday schedule mapping the UI consumes.

Root cause fixed for the selection-save error: the persistence layer was always issuing Prisma `createMany` calls even when a selection array was empty, which could fail during ordinary save flows. The service now skips empty inserts and only writes the rows that exist.

The save path also now filters stale or inaccessible selection IDs instead of rejecting the request, so a deleted item cannot break an otherwise valid save.

Validation completed successfully for both touched packages; only unrelated pre-existing lint warnings remain in `api/src/index.ts`, `api/src/routes/meWorkflowContext.ts`, and `web/app/workflow/page.tsx`.

## Open Follow-ups or Risks

- Enrichment now uses Groq via LangChain; verify `GROQ_API_KEY` and optional `GROQ_MODEL` are present in the API environment.
- Final setup completion still depends on profile + schedule bundle semantics (`isComplete` is true when both exist).
- If the public marketplace should be tenant-seeded differently in production, replace the inline seed arrays with a migration or admin-backed bootstrap path.
- The marketplace now starts empty unless rows are created through the API or a migration.
- If any environment skipped migrations earlier, rerun `prisma migrate deploy` to avoid `P2021` table-not-found errors on `/v1/me/setup*` routes.
