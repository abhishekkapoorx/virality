import type { WorkflowContextBundle } from "../prompts/workflowContext.js";

/**
 * Replaces n8n parallel Google Docs fetches (LinkedIn_Config, Style_Guide,
 * Weekly_Post_Schedule, Content_Hook_System). Production: DB instruction profile
 * or synced doc content; stub returns deterministic text for tests.
 */
export interface ConfigSourceInput {
  userId: string;
  tenantId: string;
  userFeedback?: string;
  /** ISO weekday name, e.g. "Monday" — mirrors n8n Concated Context `today_day`. */
  todayDay?: string;
}

export interface ConfigSourceAdapter {
  loadContext(input: ConfigSourceInput): Promise<WorkflowContextBundle>;
}
