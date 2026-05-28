import {
  ClockStub,
  ConfigSourceStub,
  DraftStoreStub,
  HttpDraftStoreAdapter,
  HttpConfigSourceAdapter,
  ImageStub,
  LlmStub,
  SlackStub,
  StorageStub,
  type Clock,
  type ConfigSourceAdapter,
  type DraftStoreAdapter,
  type ImageAdapter,
  type LlmAdapter,
  type SlackAdapter,
  type StorageAdapter
} from "@linkedin-agent/shared";

export interface Container {
  llm: LlmAdapter;
  slack: SlackAdapter;
  clock: Clock;
  configSource: ConfigSourceAdapter;
  image: ImageAdapter;
  storage: StorageAdapter;
  draftStore: DraftStoreAdapter;
  slackDraftChannel: string;
}

function createConfigSource(
  overrides: Partial<Container>
): ConfigSourceAdapter {
  if (overrides.configSource) {
    return overrides.configSource;
  }
  const apiUrl = process.env.API_URL?.trim();
  if (apiUrl) {
    return new HttpConfigSourceAdapter(apiUrl);
  }
  return new ConfigSourceStub();
}

function createDraftStore(
  overrides: Partial<Container>
): DraftStoreAdapter {
  if (overrides.draftStore) {
    return overrides.draftStore;
  }

  const apiUrl = process.env.API_URL?.trim();
  if (apiUrl) {
    return new HttpDraftStoreAdapter(apiUrl);
  }

  return new DraftStoreStub();
}

export function createContainer(overrides: Partial<Container> = {}): Container {
  return {
    llm: overrides.llm ?? new LlmStub(),
    slack: overrides.slack ?? new SlackStub(),
    clock: overrides.clock ?? new ClockStub(),
    configSource: createConfigSource(overrides),
    image: overrides.image ?? new ImageStub(),
    storage: overrides.storage ?? new StorageStub(),
    draftStore: createDraftStore(overrides),
    slackDraftChannel:
      overrides.slackDraftChannel ?? process.env.SLACK_DRAFT_CHANNEL ?? "post-drafts"
  };
}
