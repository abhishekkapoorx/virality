import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

import {
  HookSelectionSchema,
  PostTypeSelectionSchema
} from "@linkedin-agent/shared";

/**
 * Graph state for the LinkedIn-Agent workflow (ported from n8n).
 *
 * `GraphStateSchema` — Zod boundary validation.
 * `GraphAnnotation` — LangGraph channels + reducers.
 */

export const AuditEventSchema = z.object({
  ts: z.string(),
  from: z.string(),
  to: z.string(),
  note: z.string().optional()
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const WorkflowContextSchema = z.object({
  configText: z.string(),
  styleText: z.string(),
  scheduleText: z.string(),
  hookSystemText: z.string(),
  todayDay: z.string(),
  userFeedback: z.string()
});
export type WorkflowContext = z.infer<typeof WorkflowContextSchema>;

export const GraphStateSchema = z.object({
  conversationId: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  inboundText: z.string().min(1),
  userFeedback: z.string().optional(),
  /** @deprecated Use workflowContext; kept for API compatibility. */
  instructionProfileSnapshot: z.record(z.string(), z.unknown()).optional(),
  workflowContext: WorkflowContextSchema.optional(),
  postType: PostTypeSelectionSchema.optional(),
  hookChoice: HookSelectionSchema.optional(),
  draftText: z.string().optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
  imageStorageUrl: z.string().optional(),
  slackMessageTs: z.string().optional(),
  slackChannel: z.string().optional(),
  error: z.string().optional(),
  transitions: z.array(AuditEventSchema).default([])
});
export type GraphState = z.infer<typeof GraphStateSchema>;

export const GraphAnnotation = Annotation.Root({
  conversationId: Annotation<string>,
  tenantId: Annotation<string>,
  userId: Annotation<string>,
  inboundText: Annotation<string>,
  userFeedback: Annotation<string | undefined>,
  instructionProfileSnapshot: Annotation<Record<string, unknown> | undefined>,
  workflowContext: Annotation<WorkflowContext | undefined>,
  postType: Annotation<GraphState["postType"]>,
  hookChoice: Annotation<GraphState["hookChoice"]>,
  draftText: Annotation<string | undefined>,
  imagePrompt: Annotation<string | undefined>,
  imageUrl: Annotation<string | undefined>,
  imageStorageUrl: Annotation<string | undefined>,
  slackMessageTs: Annotation<string | undefined>,
  slackChannel: Annotation<string | undefined>,
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
  ContextLoaded: "ContextLoaded",
  PostTypeSelected: "PostTypeSelected",
  HookSelected: "HookSelected",
  DraftGenerating: "DraftGenerating",
  DraftReady: "DraftReady",
  ImageReady: "ImageReady",
  Delivered: "Delivered",
  Completed: "Completed",
  Failed: "Failed"
} as const;

export type WorkflowStateName =
  (typeof WORKFLOW_STATES)[keyof typeof WORKFLOW_STATES];

export const DEFAULT_SLACK_DRAFT_CHANNEL =
  process.env.SLACK_DRAFT_CHANNEL ?? "post-drafts";
