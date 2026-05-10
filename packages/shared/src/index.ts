export type WorkflowState =
  | "intake_received"
  | "draft_generating"
  | "draft_ready"
  | "approved"
  | "rejected"
  | "failed";

export interface HealthResponse {
  service: string;
  status: "ok";
  timestamp: string;
}
