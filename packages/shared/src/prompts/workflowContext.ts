/**
 * Bundled context produced by n8n "Concated Context" (Merge + Code node).
 * In production this is loaded from DB-backed instruction profiles; the n8n
 * workflow used four Google Docs instead.
 */
export interface WorkflowContextBundle {
  configText: string;
  styleText: string;
  scheduleText: string;
  hookSystemText: string;
  todayDay: string;
  userFeedback: string;
}
