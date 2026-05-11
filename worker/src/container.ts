import {
  ClockStub,
  LlmStub,
  SlackStub,
  type Clock,
  type LlmAdapter,
  type SlackAdapter
} from "@linkedin-agent/shared";

/**
 * Worker DI container.
 *
 * Provides every side-effecting dependency the graph nodes need (LLM, Slack,
 * clock). Real providers (OpenAI/Anthropic, Slack Bolt) are wired here in
 * later slices; tests pass overrides to inject mocks or failing stubs.
 *
 * Rule: nodes MUST NOT import vendor SDKs directly. They take a `Container`
 * as their second argument and call adapter methods.
 */
export interface Container {
  llm: LlmAdapter;
  slack: SlackAdapter;
  clock: Clock;
}

export function createContainer(overrides: Partial<Container> = {}): Container {
  return {
    llm: overrides.llm ?? new LlmStub(),
    slack: overrides.slack ?? new SlackStub(),
    clock: overrides.clock ?? new ClockStub()
  };
}
