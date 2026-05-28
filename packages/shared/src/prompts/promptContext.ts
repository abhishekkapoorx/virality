/**
 * New prompt context shape used across worker and API internal endpoints.
 * Mirrors the previous `WorkflowContextBundle` but uses a clearer name.
 */
export interface PromptContext {
  configText: string;
  styleText: string;
  scheduleText: string;
  hookSystemText: string;
  todayDay: string;
  userFeedback: string;
}

export default {} as PromptContext;
