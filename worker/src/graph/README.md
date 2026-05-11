# Worker graph (LangGraph `StateGraph`)

This folder is the workflow runtime for the LinkedIn Agent. The engine is **[LangGraph](https://langchain-ai.github.io/langgraphjs/)** (`@langchain/langgraph` + `@langchain/core`). See [`Documentation/decisions/0001-langgraph-as-workflow-engine.md`](../../../Documentation/decisions/0001-langgraph-as-workflow-engine.md) for the rationale.

## Layout

```
graph/
  state.ts          # Zod schema + LangGraph Annotation channels (one place to evolve state)
  index.ts          # Graph assembly. ONLY file that imports both nodes and edges.
  nodes/            # One file per node. Signature: async (state, ctx) => Partial<State>
  edges/            # Conditional routing functions. Pure: (state) => "nextNodeKey"
  __tests__/        # Happy-path + failure-path tests against the compiled graph
```

The DI container lives in `worker/src/container.ts` and provides every side-effecting dependency (`llm`, `slack`, `clock`). Real providers are injected here in later slices.

## Modularity rules (non-negotiable)

- **No vendor SDK imports inside nodes.** Nodes depend on adapter interfaces from `@linkedin-agent/shared/adapters/*` and call them via `ctx`. Real implementations (OpenAI, Anthropic, Slack Bolt, …) are wired in `container.ts`.
- **One node per file.** Filename matches the exported function name (camelCase): `intake.ts` exports `intakeNode`, etc.
- **Pure routing.** Edge functions in `edges/` are synchronous and read-only over `state`. They MUST NOT call adapters.
- **State is centralised.** Add new fields to both `GraphStateSchema` (Zod) and `GraphAnnotation` (LangGraph channels) in `state.ts` — never inline a one-off channel inside a node.
- **Append, don't overwrite, for `transitions`.** The reducer is `(curr, update) => [...curr, ...update]`. Return a delta from each node.

## How to add a new node

1. **Pick the canonical name.** Use the verb-first camelCase pattern (e.g. `runPolicyCheck`, `enqueueOutboundDelivery`). The filename matches.
2. **Extend `state.ts` if you need new fields.** Update both the Zod schema and the Annotation. Add a default if the field can be unset early in the graph.
3. **Write the node** under `nodes/<name>.ts`. Signature:

   ```ts
   import type { Container } from "../../container.js";
   import type { GraphState } from "../state.js";

   export async function myNode(
     state: GraphState,
     ctx: Container
   ): Promise<Partial<GraphState>> {
     // ...do work via ctx.llm / ctx.slack / ctx.clock...
     return {
       transitions: [
         { ts: ctx.clock.isoNow(), from: "PreviousState", to: "NewState" }
       ]
     };
   }
   ```

4. **If routing branches**, add an edge in `edges/<name>.ts`:

   ```ts
   import type { GraphState } from "../state.js";
   export type MyRoute = "branchA" | "branchB";
   export function routeMy(state: GraphState): MyRoute { /* pure */ }
   ```

5. **Wire it in `graph/index.ts`.** This is the only file that imports both the node and the edge:

   ```ts
   .addNode("myNode", (s) => myNode(s, container))
   .addConditionalEdges("myNode", routeMy, { branchA: "...", branchB: "..." })
   ```

6. **Add tests** under `__tests__/`:

   - A happy-path test that asserts the final state and the expected `transitions` sequence.
   - A failure-path test that injects a failing stub adapter via `createContainer({ llm: failingLlm })` and asserts the `Failed` terminal state.

7. **Run `pnpm test` from the repo root** before committing. Do not commit on red.

## Persistence note

This slice keeps `transitions` in memory only. Postgres persistence of `AuditEvent` rows (and `WorkflowState` snapshots) lands in **Phase 1 — extend Prisma schema** and is wired into the graph via a future `persistTransition` adapter so the graph itself stays the source of truth for shape.
