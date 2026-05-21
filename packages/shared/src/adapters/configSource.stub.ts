import type { ConfigSourceAdapter, ConfigSourceInput } from "./configSource.js";
import type { WorkflowContextBundle } from "../prompts/workflowContext.js";

export class ConfigSourceStub implements ConfigSourceAdapter {
  async loadContext(input: ConfigSourceInput): Promise<WorkflowContextBundle> {
    const today =
      input.todayDay ??
      new Date().toLocaleString("en-US", { weekday: "long" });

    return {
      configText: "STUB_CONFIG: hashtags=#LinkedIn #BuildInPublic",
      styleText: "STUB_STYLE: professional, direct, BUT→THEREFORE loops",
      scheduleText: "STUB_SCHEDULE: Mon=Belief Reversal, Tue=Translation, Wed=Story",
      hookSystemText: "STUB_HOOKS: Negative Warning, Lie Reveal, Curiosity Gap",
      todayDay: today,
      userFeedback: input.userFeedback?.trim() ? input.userFeedback : "None"
    };
  }
}
