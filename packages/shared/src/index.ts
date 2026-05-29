export * from "./adapters/index.js";
export * from "./draftGeneration.js";
export * from "./prompts/index.js";
export * from "./schemas/index.js";
export { DEMO_USER_ID } from "./constants.js";
// Legacy workflow context types removed — use prompt/context APIs instead.

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

export type DeliveryChannel = "telegram" | "web";

export const DELIVERY_CHANNELS: DeliveryChannel[] = ["telegram", "web"];

export interface WorkflowPreferences {
  writingStyle: string;
  weeklyCalendar: string;
  carouselDesignLanguage: string;
  cronExpression: string;
}

export interface WorkflowPreferencesRecord extends WorkflowPreferences {
  userId: string;
  updatedAt: string;
}

export interface GenerateDraftRequest {
  userId: string;
  updateRequest?: string;
}

export interface GenerateDraftResponse {
  userId: string;
  post: string;
  carouselArtifactUrl: string;
  targets: DeliveryChannel[];
  usedUpdateRequest: string | null;
}

// Onboarding / setup types
export type OnboardingAnswers = import("./schemas/onboarding.js").OnboardingAnswers;
export type SetupProfile = import("./schemas/onboarding.js").SetupProfile;
export type SetupDetailedDocs = import("./schemas/onboarding.js").SetupDetailedDocs;
export type SetupGenerationResponse = import("./schemas/onboarding.js").SetupGenerationResponse;
export type { SetupDetailedDocs as SetupDetailedDocsType } from "./schemas/onboarding.js";
