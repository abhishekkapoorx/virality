---
name: worker-jobs
description: Keeps background workers organized (bootstrap, queue consumers, job handlers, shutdown). Use when adding queue processing, Redis/BullMQ consumers, or changing code under worker/, or when the user mentions jobs, workers, or async processing.
disable-model-invocation: true
---

# Worker structure

## Target layout (`worker/src/`)

```
worker/src/
├── index.ts                  # process entry: load env, connect infra, register consumers, signals
├── config.ts                 # optional: parsed env (zod), timeouts, concurrency caps
├── consumers/                # subscribe per queue/channel; thin wiring to handlers
├── jobs/                     # one file per job type: idempotent execute(input) logic
├── lib/                      # redis/queue client singletons, retries, tracing helpers
└── types.ts                  # worker-local types; shared contracts from packages/shared
```

## Rules

1. **`index.ts`** only boots infrastructure and registers **consumers**; no heavy logic inline.
2. **Consumers** map messages to **`jobs/<name>.ts`** functions; keep consumer files small.
3. **Jobs** implement business steps idempotently (safe retry): dedupe keys, “already processed” checks, clear inputs/outputs.
4. **Shared contracts**: DTOs and enums from `packages/shared`; worker does not redefine API shapes.
5. **Observability**: structured logs with `jobName`, `jobId`/`correlationId`; avoid logging secrets.
6. **Lifecycle**: handle `SIGTERM`/`SIGINT` — stop accepting work, drain in-flight, disconnect Redis/queue cleanly.

## Anti-patterns

- Long procedural scripts in `index.ts` instead of split jobs.
- Calling HTTP APIs without timeouts/retries where appropriate.
- Duplicating validation — reuse Zod schemas from shared or api validators packages where possible.
