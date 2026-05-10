---
name: maintain-project-docs
description: Keeps canonical project instructions under Documentation/ and applies create-read-update-delete to those files when features are planned, implemented, pivoted, or retired. Use when starting or finishing a feature, changing scope, updating architecture or routes, or when the user mentions docs, PRD, architecture, feature plans, or keeping documentation in sync.
disable-model-invocation: true
---

# Maintain project documentation (Documentation/)

## Canonical location

Treat **`Documentation/`** as the source of truth for product and engineering intent that outlives a single chat. Prefer updating existing files over scattering notes in random markdown paths.

## When to touch docs

| Situation | Action |
|-----------|--------|
| **New feature / milestone** | **Create** or extend a focused doc (e.g. `Documentation/feature-<name>.md` or a dated plan). Cross-link from `PRD.md` or `ARCHITECTURE.md` if it affects scope or system shape. |
| **Pivot / scope change** | **Update** the relevant plan or architecture sections; **delete** or strike superseded claims so readers are not misled. Add a short “Supersedes” or “History” note when helpful. |
| **Implementation shipped** | **Update** `ARCHITECTURE.md` (components, flows, integrations), `planned-routes.md` or API docs if routes/contracts changed, and PRD acceptance notes if milestones moved. |
| **Feature retired / replaced** | **Update** docs to mark deprecated behavior; remove obsolete endpoints or flows from active sections or move to an “Deprecated” subsection. |

## CRUD meaning here

- **Create**: Add new markdown in `Documentation/` when there is no suitable file (feature briefs, ADRs, route plans).
- **Read**: Before changing behavior, open the relevant `Documentation/*.md` files so plans stay aligned with stated intent.
- **Update**: Edit the files that actually describe the changed surface (architecture, routes, PRD sections, feature plans).
- **Delete**: Remove or clearly deprecate outdated instructions—do not leave contradictory guidance in place.

## File routing (this repo)

Use judgment; typical mappings:

- **`ARCHITECTURE.md`** — runtime diagram, components, auth, data flow; update when the system shape changes.
- **`PRD.md`** — product goals, scope, success criteria; update when scope or MVP definition shifts.
- **`planned-routes.md`** — HTTP/API or app routes inventory; update when endpoints or pages change.
- **`feature-*.md`** — per-feature execution plans; create/update on plan/pivot; align with shipped code before closing work.

## Rules

1. **Same session as code**: When implementing or pivoting a feature, apply doc updates in the same change set when practical so repo state stays coherent.
2. **No orphan promises**: If code no longer matches a doc, fix the doc or the code—prefer updating docs when behavior is intentional.
3. **Links**: Use stable relative links between `Documentation/` files where cross-references help (`[ARCHITECTURE.md](./ARCHITECTURE.md)`).
4. **Breath**: Keep edits proportional—touch only sections affected by the change; avoid wholesale rewrites unless the pivot demands it.

## Anti-patterns

- Leaving `Documentation/` stale while shipping behavior changes.
- Duplicating the same truth in README and `Documentation/` without pointing to one owner section.
- Adding large unrelated edits when updating docs for a single feature.
