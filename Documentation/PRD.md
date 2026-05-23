# Product Requirements Document: LinkedIn Agent

**Document status:** Draft  
**Last updated:** 2026-05-23 (Telegram webhook slice documented)  
**Owners:** Product (founder)  
**Related:** `office-hours-linkedin-agent-design-20260427.md`, `office-hours-linkedin-agent-design-extension-20260503.md`, `plan-ceo-review-linkedin-agent-20260503.md`

---

## 1. Overview

### 1.1 Summary

LinkedIn Agent helps busy professionals (first wedge: **engineering managers / CTO-style technical leaders**) turn rough ideas into **on-brand LinkedIn drafts** with a **human approval** step and **manual publish** to LinkedIn. Users interact primarily through a **Telegram bot** for the draft loop; the **web app** handles onboarding, **account linking**, **database-backed instruction profiles**, and audit-friendly configuration. The service runs in the **cloud**.

> **Channel pivot (2026-05-23):** MVP uses Telegram, not Slack. See [decisions/0004-telegram-over-slack-mvp-channel.md](./decisions/0004-telegram-over-slack-mvp-channel.md).

### 1.2 Problem

Creating consistent, high-trust LinkedIn content breaks flow: context switches between docs, chat, and LinkedIn, generic AI drafts drift from voice, and fully automated posting creates **reputational and compliance risk**.

### 1.3 Product principles

1. **Evidence-first:** Pilot metrics before expanding surface area (see Section 9).
2. **Human-in-the-loop:** No autonomous LinkedIn publish in MVP; explicit approve/reject/refine.
3. **Governance is product:** Style/policy checks and audit trails are first-class.
4. **Connector-ready architecture:** Telegram ships first; Slack, WhatsApp, and Discord stay behind the same internal event schema **after** Telegram MVP gates pass.

---

## 2. Goals and non-goals

### 2.1 Goals (MVP)

- Reduce median **idea → approved draft** time versus baseline (target: **50% reduction**, per pilot design).
- Reach **≥60% draft acceptance** with **≤1 meaningful revision round** (definitions in Section 9).
- Maintain **≥99% weekly success rate** for Telegram webhook processing (design extension).
- Allow users to maintain **instruction profiles** in the product database and use **versioned snapshots** on each generation.

### 2.2 Non-goals (MVP)

- Posting to LinkedIn without a human pressing publish in LinkedIn.
- Auto-replies, comment automation, or DMs on LinkedIn.
- Slack workspace connector (deferred; superseded by Telegram for MVP).
- WhatsApp and Discord connectors (explicitly deferred until Telegram pilot clears gates).
- Generic “write anything” assistant unrelated to the LinkedIn draft lifecycle.

---

## 3. Target users

### 3.1 Primary persona (pilot)

**Engineering manager / CTO-style publisher** posting technical leadership content. Comfortable with messaging apps (Telegram for MVP); cares about accuracy, tone, and **personal brand risk**.

### 3.2 Secondary (future)

Community creators (potential Discord), relationship-heavy pros (potential WhatsApp). Not MVP commitments.

---

## 4. Key user journeys

### 4.1 Onboarding (web)

1. Create account / tenant.
2. Link Telegram account to product (deep link from web after sign-in).
3. Create or edit instruction profile in the web app (voice rules, banned claims, examples, CTA defaults).
4. Configure style/policy toggles that mirror programmatic checks (banned claims, tone, CTA rules, hashtag limits).

### 4.2 Draft loop (Telegram)

1. User sends **raw input** (text, bullets, link summary, short voice transcript pasted).
2. System attaches latest **instruction snapshot** (database profile + web overrides) and generates draft.
3. Bot returns draft with inline actions: **Approve**, **Refine**, **Reject**.
4. Refine loops with explicit user feedback; bounded regeneration (policy enforces max rounds).
5. On approve: state **ready to publish**; user publishes manually on LinkedIn; optional paste-back of URL closes loop.

### 4.3 Failure and transparency

- If instruction profile read fails: use **last good snapshot**, notify user in-thread.
- If generation fails: structured error, single automatic retry where safe, then human operator path (per ops model in April doc).

---

## 5. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Telegram bot webhook with verified secret; account link from web | P0 |
| FR-2 | Map Telegram `chat_id` / user to internal `conversation_id` | P0 |
| FR-3 | Deterministic workflow engine: states include intake, draft, refine, approved, rejected, failed | P0 |
| FR-4 | Approve / Refine / Reject actions usable from Telegram callback queries | P0 |
| FR-5 | LLM generation uses bundled prompts + **instruction_bundle_version** metadata | P0 |
| FR-6 | Programmatic style/policy gate **blocks** approval when failed (fail-closed) | P0 |
| FR-7 | Web UI for Telegram link status and instruction profile management | P0 |
| FR-8 | Store encrypted bot/link metadata; revoke on disconnect | P0 |
| FR-9 | Append-only audit fields: approver, timestamps, draft hash/version, prompt/policy version ids | P0 |
| FR-10 | Metrics events: `input_received`, `draft_generated`, `user_feedback_received`, `draft_regenerated`, `approved_for_publish`, `published_manual`, `cycle_closed` | P0 |
| FR-11 | Internal adapter schema documented: `InboundMessage`, `OutboundPayload`, `ActionPayload` | P1 |
| FR-12 | Versioned instruction profile history with rollback to prior version | P1 |
| FR-13 | WhatsApp connector | P3 (post-gate) |
| FR-14 | Discord connector | P3 (post-gate) |

---

## 6. Non-functional requirements

| ID | Requirement | Notes |
|----|-------------|-------|
| NFR-1 | Multi-tenant isolation for all reads/writes | Test with hostile ID tamper cases |
| NFR-2 | Secrets at rest encryption (KMS) | Telegram bot tokens and other integration secrets |
| NFR-3 | Structured logs + metrics per Section 8 of CEO review | Alerts on Telegram adapter failures |
| NFR-4 | Idempotent Telegram update handling | Duplicate `update_id` must not double-draft |
| NFR-5 | Prompt injection defenses | Policy layer + training/playbook for unsupported claims |
| NFR-6 | Availability target | Align with pilot SLA; publish internally |

---

## 7. Compliance and policy

**Allowed:** drafting from user inputs; regeneration from explicit feedback; manual publish by human.

**Forbidden:** autonomous LinkedIn posting; automated comments/DMs.

**Audit:** immutable fields listed in FR-9; retain per jurisdiction/policy decision (legal review TODO).

---

## 8. Architecture constraints (product-facing)

- **Approach B:** Orchestration API + workflow engine + **thin Telegram adapter**; future channels implement same internal events.
- **Web is canonical** for Clerk auth, Telegram linking, and long-lived instruction configuration; Telegram is canonical for **turn-by-turn** collab in MVP.

---

## 9. Success metrics and pilot gates

Use operational definitions from `office-hours-linkedin-agent-design-20260427.md`:

- **Acceptance rate**, **meaningful revision** definition, **quality lift** score.
- Cohort size and week 2 / week 4 **continue/kill** gates.

**Additive:** Telegram adapter health; optional split cohort for users with advanced instruction profiles enabled vs baseline.

---

## 10. Rollout plan

1. **Phase 0 (1 week):** Three contextual interviews with screen share (April assignment); baseline instrumentation definitions.
2. **Phase 1 (MVP build):** Telegram loop + web link + policy gates + audit + metrics.  
   **In progress (2026-05-23):** Telegram webhook accepts messages and replies (intake ack, `/start`, inline button stubs) — see [feature-telegram-bot.md](./feature-telegram-bot.md). Account link + draft workflow not yet connected.
3. **Phase 1b (pilot, 4 weeks):** 5 active users target; feature-flag advanced instruction profile editing for subset.
4. **Phase 2:** Second connector (e.g. Slack or Discord) **only if** gates pass; adapter spec frozen after two Telegram flows validated.

---

## 11. Open questions

1. **B2B vs prosumer packaging** (workspace-wide vs individual billing).
2. **Instruction profile schema**: what is editable by users vs system-managed fields?
3. **EU data residency** if pilots require it.
4. **Instruction conflicts** when profile edits happen mid-refine-loop.
5. **Pricing hypothesis** and willingness-to-pay test design.

---

## 12. Out of scope appendix

See `plan-ceo-review-linkedin-agent-20260503.md` NOT in scope list.

---

## 13. Glossary

- **HITL:** Human-in-the-loop.
- **Instruction bundle:** Snapshot of user voice/guardrails sourced from database profile + web overrides, hashed/versioned.
- **Adapter:** Channel-specific translation layer (Telegram first for MVP).
