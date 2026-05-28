# Agent Handoff

## Task Summary

Remove the Slack settings page and Slack nav links from the web UI for now.

## Working Plan

- Remove the Slack route from the visible UI and delete the page shell so the app no longer advertises it.
- Keep the remaining nav structures consistent after the removal.
- Run web lint to confirm the remaining links and route files are still valid.

## Completed Changes

- `web/components/site/SiteHeader.tsx` no longer exposes Slack in the main nav.
- `web/components/site/SiteFooter.tsx` no longer exposes Slack in the footer nav.
- `web/components/landing/LandingNav.tsx` no longer links to Slack from the marketing header.
- `web/app/settings/slack/page.tsx` was deleted so the Slack settings page is no longer available in the UI.

## Current Project Structure Relevant to the Task

- `web/components/site/SiteHeader.tsx`: authenticated app header nav.
- `web/components/site/SiteFooter.tsx`: authenticated app footer nav.
- `web/components/landing/LandingNav.tsx`: marketing header nav.
- `web/app/settings/slack/page.tsx`: removed Slack settings page.

## Current Status

The Slack UI removal is complete. Web lint passed cleanly after the change.

## Open Follow-ups or Risks

- If Slack returns later, the route file and nav entries will need to be restored together to avoid partial exposure.
