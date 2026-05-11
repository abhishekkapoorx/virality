import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

/**
 * Graph state schema for the LangGraph workflow.
 *
 * Two views of state live here:
 *   - `GraphStateSchema` / `GraphState`: Zod-validated shape used at the
 *     boundary (e.g. when a producer hands us an intake payload from API
 *     or queue). Tests can `parse` against this to lock the contract.
 *   - `GraphAnnotation`: LangGraph channel definitions used to wire the
 *     `StateGraph`. Reducer for `transitions` appends events so each node
 *     can return only its delta.
 *
 * Keep these two in sync when adding fields.
 */

export const AuditEventSchema = z.object({
  ts: z.string(),
  from: z.string(),
  to: z.string(),
  note: z.string().optional()
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const GraphStateSchema = z.object({
  conversationId: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  inboundText: z.string().min(1),
  instructionProfileSnapshot: z.record(z.string(), z.unknown()),
  draftText: z.string().optional(),
  error: z.string().optional(),
  transitions: z.array(AuditEventSchema).default([])
});
export type GraphState = z.infer<typeof GraphStateSchema>;

export const GraphAnnotation = Annotation.Root({
  conversationId: Annotation<string>,
  tenantId: Annotation<string>,
  userId: Annotation<string>,
  inboundText: Annotation<string>,
  instructionProfileSnapshot: Annotation<Record<string, unknown>>,
  draftText: Annotation<string | undefined>,
  error: Annotation<string | undefined>,
  transitions: Annotation<AuditEvent[]>({
    reducer: (curr, update) => [...(curr ?? []), ...(update ?? [])],
    default: () => []
  })
});

export type GraphChannels = typeof GraphAnnotation.State;

export const WORKFLOW_STATES = {
  Start: "Start",
  IntakeReceived: "IntakeReceived",
  DraftGenerating: "DraftGenerating",
  DraftReady: "DraftReady",
  Failed: "Failed"
} as const;

export type WorkflowStateName = (typeof WORKFLOW_STATES)[keyof typeof WORKFLOW_STATES];
