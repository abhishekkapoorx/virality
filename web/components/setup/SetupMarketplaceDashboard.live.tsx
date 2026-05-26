"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthedApi } from "@/lib/useAuthedApi";
import {
  createHookLongDescriptionTemplate,
  createPostTypeLongDescriptionTemplate,
  SETUP_MARKETPLACE_DAYS,
  type MarketplaceVisibility,
  type SetupMarketplaceDayKey
} from "@/lib/setupMarketplace";

type SetupMarketplaceDashboardProps = {
  schedule: null | {
    schedule: unknown;
    cronExpr: string | null;
    enabled: boolean;
  };
};

type MarketplacePanel = "hooks" | "post-types" | null;

type CatalogHook = {
  id: string;
  title: string;
  author: string;
  isMine: boolean;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon?: string;
  tags: string[];
  examples: string[];
  whenToUse: string;
  psychologicalEffect: string;
};

type CatalogPostType = {
  id: string;
  title: string;
  author: string;
  isMine: boolean;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon?: string;
  tags: string[];
  structure: string;
  expectedHooks: string[];
  outcome: string;
};

type HookFormState = {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon: string;
  tags: string;
  examples: string;
  whenToUse: string;
  psychologicalEffect: string;
};

type PostTypeFormState = {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon: string;
  tags: string;
  structure: string;
  expectedHooks: string;
  outcome: string;
};

type MarketplaceSelections = {
  selectedHookIds: string[];
  selectedPostStyleIdsByDay: Record<SetupMarketplaceDayKey, string | null>;
};

type MarketplaceResponse = {
  id: string;
  title: string;
  author: string;
  isMine: boolean;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type HookResponse = MarketplaceResponse & {
  examples: string[];
  whenToUse: string;
  psychologicalEffect: string;
};

type PostTypeResponse = MarketplaceResponse & {
  structure: string;
  expectedHooks: string[];
  outcome: string;
};

const EMPTY_DAY_SELECTIONS: Record<SetupMarketplaceDayKey, string | null> = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null
};

const DEFAULT_HOOK_TEMPLATE = createHookLongDescriptionTemplate("My hook idea");
const DEFAULT_POST_TEMPLATE = createPostTypeLongDescriptionTemplate("My post type");

function emptyHookForm(): HookFormState {
  return {
    title: "My hook idea",
    shortDescription: "A short description of the hook's role in the post.",
    longDescription: DEFAULT_HOOK_TEMPLATE,
    visibility: "private",
    icon: "Sparkles",
    tags: "",
    examples: "",
    whenToUse: "",
    psychologicalEffect: ""
  };
}

function emptyPostForm(): PostTypeFormState {
  return {
    title: "My post type",
    shortDescription: "A short description of the post type.",
    longDescription: DEFAULT_POST_TEMPLATE,
    visibility: "private",
    icon: "CalendarDays",
    tags: "",
    structure: "",
    expectedHooks: "",
    outcome: ""
  };
}

function toTags(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function matchesQuery(item: { title: string; author: string; shortDescription: string; longDescription: string; tags: string[]; visibility: MarketplaceVisibility }, query: string) {
  if (!query) return true;
  return [item.title, item.author, item.shortDescription, item.longDescription, item.visibility, ...item.tags]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function IconGlyph({ icon }: { icon?: string }) {
  if (!icon) return null;

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
      {icon.slice(0, 2)}
    </span>
  );
}

function VisibilityBadge({ visibility }: { visibility: MarketplaceVisibility }) {
  return <Badge variant="neutral">{visibility === "public" ? "Public" : "Private"}</Badge>;
}

function MarketplaceListCard({
  item,
  active,
  onSelect
}: {
  item: CatalogHook | CatalogPostType;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.35rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-[var(--color-strong-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,var(--color-accent-3))]"
          : "border-[var(--color-soft-border)] bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <IconGlyph icon={item.icon} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-base text-[var(--color-text)]">{item.title}</h3>
            <VisibilityBadge visibility={item.visibility} />
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-alt)]">{item.author}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{item.shortDescription}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={`${item.id}-${tag}`}
                className="rounded-full border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-alt)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)]"
        >
          +
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Click to open details</p>
    </button>
  );
}

function MarketplaceDetailPanel({
  item,
  kind,
  activeDayLabel,
  selected,
  onAdd,
  onEdit,
  onDelete,
  onClose
}: {
  item: CatalogHook | CatalogPostType;
  kind: "hook" | "post-type";
  activeDayLabel?: string;
  selected: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <Card className="border-[var(--color-soft-border)] bg-[var(--color-surface-soft)]/70">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <IconGlyph icon={item.icon} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 font-[var(--font-display)] text-2xl text-[var(--color-text)]">{item.title}</h3>
              <VisibilityBadge visibility={item.visibility} />
            </div>
            <p className="mt-2 text-sm text-[var(--color-muted-alt)]">by {item.author}</p>
            {activeDayLabel ? <p className="mt-1 text-sm text-[var(--color-muted-alt)]">Assigned target: {activeDayLabel}</p> : null}
          </div>
        </div>

        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full px-3 py-2">
          Close
        </Button>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--color-ink)]">{item.longDescription}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <Badge key={`${item.id}-${tag}`} variant="neutral">
            {tag}
          </Badge>
        ))}
      </div>

      {kind === "hook" ? (
        <div className="mt-5 grid gap-4">
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Examples</p>
            <ul className="mt-1 space-y-1 pl-5 text-sm leading-6 text-[var(--color-ink)]">
              {(item as CatalogHook).examples.map((example) => (
                <li key={`${item.id}-${example}`}>{example}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">When to use</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-ink)]">{(item as CatalogHook).whenToUse}</p>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Psychological effect</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-ink)]">{(item as CatalogHook).psychologicalEffect}</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Structure</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-ink)]">{(item as CatalogPostType).structure}</p>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Expected hooks</p>
            <ul className="mt-1 space-y-1 pl-5 text-sm leading-6 text-[var(--color-ink)]">
              {(item as CatalogPostType).expectedHooks.map((hook) => (
                <li key={`${item.id}-${hook}`}>{hook}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Expected outcome</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-ink)]">{(item as CatalogPostType).outcome}</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" onClick={onAdd} className="rounded-full">
          {selected ? "Selected" : kind === "hook" ? "Add hook" : "Assign post type"}
        </Button>
        {item.isMine ? (
          <>
            <Button type="button" variant="ghost" onClick={onEdit} className="rounded-full px-3 py-2">
              Edit
            </Button>
            <Button type="button" variant="ghost" onClick={onDelete} className="rounded-full px-3 py-2">
              Delete
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function HookForm({
  value,
  onChange,
  onSubmit,
  onReset,
  mode
}: {
  value: HookFormState;
  onChange: (next: HookFormState) => void;
  onSubmit: () => void;
  onReset: () => void;
  mode: "create" | "edit";
}) {
  return (
    <Card className="border-[var(--color-soft-border)] bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="m-0 font-[var(--font-display)] text-xl text-[var(--color-text)]">
            {mode === "create" ? "Create your own hook" : "Edit hook"}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted-alt)]">
            User-created items stay separate from the public marketplace and can be private or public.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onReset} className="rounded-full px-3 py-2">
          {mode === "create" ? "Reset template" : "Cancel edit"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        <Input
          value={value.title}
          onChange={(event) => {
            const title = event.target.value;
            onChange({
              ...value,
              title,
              longDescription:
                value.longDescription === DEFAULT_HOOK_TEMPLATE ? createHookLongDescriptionTemplate(title) : value.longDescription
            });
          }}
          placeholder="Title"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          value={value.shortDescription}
          onChange={(event) => onChange({ ...value, shortDescription: event.target.value })}
          placeholder="Short description"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          textarea
          value={value.longDescription}
          onChange={(event) => onChange({ ...value, longDescription: event.target.value })}
          placeholder="Long description for the hook"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={value.icon}
            onChange={(event) => onChange({ ...value, icon: event.target.value })}
            placeholder="Optional icon name"
            className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
          />
          <Input
            value={value.tags}
            onChange={(event) => onChange({ ...value, tags: event.target.value })}
            placeholder="Tags, comma separated"
            className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
          />
        </div>

        <Input
          textarea
          value={value.examples}
          onChange={(event) => onChange({ ...value, examples: event.target.value })}
          placeholder="Examples, one per line"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          textarea
          value={value.whenToUse}
          onChange={(event) => onChange({ ...value, whenToUse: event.target.value })}
          placeholder="When to use"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          textarea
          value={value.psychologicalEffect}
          onChange={(event) => onChange({ ...value, psychologicalEffect: event.target.value })}
          placeholder="Psychological effect"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <div className="flex items-center gap-2 rounded-[1.1rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, visibility: "public" })}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              value.visibility === "public" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-alt)]"
            }`}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, visibility: "private" })}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              value.visibility === "private" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-alt)]"
            }`}
          >
            Private
          </button>
        </div>

        <Button type="button" onClick={onSubmit} className="rounded-full">
          {mode === "create" ? "+ Add to marketplace" : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}

function PostTypeForm({
  value,
  onChange,
  onSubmit,
  onReset,
  mode
}: {
  value: PostTypeFormState;
  onChange: (next: PostTypeFormState) => void;
  onSubmit: () => void;
  onReset: () => void;
  mode: "create" | "edit";
}) {
  return (
    <Card className="border-[var(--color-soft-border)] bg-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="m-0 font-[var(--font-display)] text-xl text-[var(--color-text)]">
            {mode === "create" ? "Create your own post type" : "Edit post type"}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-muted-alt)]">
            User-created items stay separate from the public marketplace and can be private or public.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onReset} className="rounded-full px-3 py-2">
          {mode === "create" ? "Reset template" : "Cancel edit"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        <Input
          value={value.title}
          onChange={(event) => {
            const title = event.target.value;
            onChange({
              ...value,
              title,
              longDescription:
                value.longDescription === DEFAULT_POST_TEMPLATE ? createPostTypeLongDescriptionTemplate(title) : value.longDescription
            });
          }}
          placeholder="Title"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          value={value.shortDescription}
          onChange={(event) => onChange({ ...value, shortDescription: event.target.value })}
          placeholder="Short description"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          textarea
          value={value.longDescription}
          onChange={(event) => onChange({ ...value, longDescription: event.target.value })}
          placeholder="Long description for the post type"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={value.icon}
            onChange={(event) => onChange({ ...value, icon: event.target.value })}
            placeholder="Optional icon name"
            className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
          />
          <Input
            value={value.tags}
            onChange={(event) => onChange({ ...value, tags: event.target.value })}
            placeholder="Tags, comma separated"
            className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
          />
        </div>

        <Input
          textarea
          value={value.structure}
          onChange={(event) => onChange({ ...value, structure: event.target.value })}
          placeholder="Structure"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          textarea
          value={value.expectedHooks}
          onChange={(event) => onChange({ ...value, expectedHooks: event.target.value })}
          placeholder="Expected hooks, one per line or comma separated"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <Input
          textarea
          value={value.outcome}
          onChange={(event) => onChange({ ...value, outcome: event.target.value })}
          placeholder="Expected outcome"
          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
        />

        <div className="flex items-center gap-2 rounded-[1.1rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, visibility: "public" })}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              value.visibility === "public" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-alt)]"
            }`}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, visibility: "private" })}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              value.visibility === "private" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-alt)]"
            }`}
          >
            Private
          </button>
        </div>

        <Button type="button" onClick={onSubmit} className="rounded-full">
          {mode === "create" ? "+ Add to marketplace" : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}

function buildSelectionState(): MarketplaceSelections {
  return {
    selectedHookIds: [],
    selectedPostStyleIdsByDay: { ...EMPTY_DAY_SELECTIONS }
  };
}

function getRequestErrorMessage(response: Response, fallback: string): Promise<string> {
  return response
    .json()
    .then((payload) => (typeof payload?.error === "string" ? payload.error : fallback))
    .catch(() => fallback);
}

export function SetupMarketplaceDashboard({ schedule }: SetupMarketplaceDashboardProps) {
  const { fetchWithAuth, isLoaded, isSignedIn } = useAuthedApi();
  const [panel, setPanel] = useState<MarketplacePanel>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDayKey, setSelectedDayKey] = useState<SetupMarketplaceDayKey>("monday");
  const [hooks, setHooks] = useState<CatalogHook[]>([]);
  const [postStyles, setPostStyles] = useState<CatalogPostType[]>([]);
  const [selections, setSelections] = useState<MarketplaceSelections>(buildSelectionState());
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hookForm, setHookForm] = useState<HookFormState>(emptyHookForm());
  const [postTypeForm, setPostTypeForm] = useState<PostTypeFormState>(emptyPostForm());
  const [editingHookId, setEditingHookId] = useState<string | null>(null);
  const [editingPostTypeId, setEditingPostTypeId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scheduleSummary = schedule?.enabled
    ? `Enabled · ${schedule.cronExpr ?? "custom schedule"}`
    : schedule?.cronExpr
      ? `Disabled · ${schedule.cronExpr}`
      : "No cron schedule yet";

  const selectedDayLabel = SETUP_MARKETPLACE_DAYS.find((day) => day.key === selectedDayKey)?.label ?? selectedDayKey;

  const hookQuery = searchQuery.trim().toLowerCase();
  const postTypeQuery = searchQuery.trim().toLowerCase();

  const currentHooks = useMemo(() => hooks.filter((item) => matchesQuery(item, hookQuery)), [hookQuery, hooks]);
  const currentPostStyles = useMemo(() => postStyles.filter((item) => matchesQuery(item, postTypeQuery)), [postTypeQuery, postStyles]);

  const publicHooks = currentHooks.filter((item) => !item.isMine);
  const yourHooks = currentHooks.filter((item) => item.isMine);
  const publicPostStyles = currentPostStyles.filter((item) => !item.isMine);
  const yourPostStyles = currentPostStyles.filter((item) => item.isMine);

  const activeItem =
    panel === "hooks"
      ? currentHooks.find((item) => item.id === activeItemId) ?? currentHooks[0] ?? null
      : panel === "post-types"
        ? currentPostStyles.find((item) => item.id === activeItemId) ?? currentPostStyles[0] ?? null
        : null;
  const activeHook = panel === "hooks" ? (activeItem as CatalogHook | null) : null;
  const activePostStyle = panel === "post-types" ? (activeItem as CatalogPostType | null) : null;

  const fetchJson = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const response = await fetchWithAuth(path, init);
      if (!response.ok) {
        throw new Error(await getRequestErrorMessage(response, "Request failed"));
      }
      return response.json() as Promise<T>;
    },
    [fetchWithAuth]
  );

  const refreshMarketplace = useCallback(async () => {
    const [nextHooks, nextPostStyles, nextSelections] = await Promise.all([
      fetchJson<HookResponse[]>("/v1/me/marketplace/hooks"),
      fetchJson<PostTypeResponse[]>("/v1/me/marketplace/post-styles"),
      fetchJson<MarketplaceSelections>("/v1/me/marketplace/selections")
    ]);

    setHooks(nextHooks);
    setPostStyles(nextPostStyles);
    setSelections({
      selectedHookIds: nextSelections.selectedHookIds ?? [],
      selectedPostStyleIdsByDay: { ...EMPTY_DAY_SELECTIONS, ...(nextSelections.selectedPostStyleIdsByDay ?? {}) }
    });
  }, [fetchJson]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;

    setLoading(true);
    refreshMarketplace()
      .then(() => {
        if (!cancelled) setStatusMessage("Loaded marketplace data from Prisma.");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatusMessage(error instanceof Error ? error.message : "Failed to load marketplace data.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, refreshMarketplace]);

  useEffect(() => {
    if (panel === "hooks") {
      const firstId = currentHooks[0]?.id ?? null;
      if (activeItemId && currentHooks.some((item) => item.id === activeItemId)) return;
      setActiveItemId(firstId);
    }
    if (panel === "post-types") {
      const firstId = currentPostStyles[0]?.id ?? null;
      if (activeItemId && currentPostStyles.some((item) => item.id === activeItemId)) return;
      setActiveItemId(firstId);
    }
  }, [activeItemId, currentHooks, currentPostStyles, panel]);

  function openHooksMarketplace() {
    setSearchQuery("");
    setPanel("hooks");
    setEditingHookId(null);
    setEditingPostTypeId(null);
    setActiveItemId((current) => current ?? hooks[0]?.id ?? null);
    setStatusMessage(null);
  }

  function openPostTypeMarketplace(dayKey: SetupMarketplaceDayKey) {
    setSearchQuery("");
    setSelectedDayKey(dayKey);
    setPanel("post-types");
    setEditingHookId(null);
    setEditingPostTypeId(null);
    setActiveItemId((current) => current ?? postStyles[0]?.id ?? null);
    setStatusMessage(null);
  }

  function closeMarketplace() {
    setPanel(null);
    setSearchQuery("");
    setStatusMessage(null);
    setEditingHookId(null);
    setEditingPostTypeId(null);
  }

  async function saveSelections(nextSelections: MarketplaceSelections) {
    const response = await fetchWithAuth("/v1/me/marketplace/selections", {
      method: "PUT",
      body: JSON.stringify(nextSelections)
    });

    if (!response.ok) {
      throw new Error(await getRequestErrorMessage(response, "Failed to save marketplace selections"));
    }

    const payload = (await response.json()) as MarketplaceSelections;
    setSelections({
      selectedHookIds: payload.selectedHookIds ?? [],
      selectedPostStyleIdsByDay: { ...EMPTY_DAY_SELECTIONS, ...(payload.selectedPostStyleIdsByDay ?? {}) }
    });
  }

  async function addHookToSelection(hookId: string) {
    const previousSelections = selections;
    const nextSelectedHookIds = selections.selectedHookIds.includes(hookId)
      ? selections.selectedHookIds
      : [...selections.selectedHookIds, hookId];

    setSelections((current) => ({ ...current, selectedHookIds: nextSelectedHookIds }));

    try {
      await saveSelections({ ...selections, selectedHookIds: nextSelectedHookIds });
      setPanel("hooks");
      setActiveItemId(hookId);
      setStatusMessage("Hook selection saved.");
    } catch (error) {
      setSelections(previousSelections);
      setStatusMessage(
        `Unable to save hook selection. ${error instanceof Error ? error.message : "Please try again."}`
      );
    }
  }

  async function removeSelectedHook(hookId: string) {
    const previousSelections = selections;
    const nextSelectedHookIds = selections.selectedHookIds.filter((currentHookId) => currentHookId !== hookId);
    setSelections((current) => ({ ...current, selectedHookIds: nextSelectedHookIds }));

    try {
      await saveSelections({ ...selections, selectedHookIds: nextSelectedHookIds });
      setStatusMessage("Hook removed from your selection.");
    } catch (error) {
      setSelections(previousSelections);
      setStatusMessage(
        `Unable to remove hook from your selection. ${error instanceof Error ? error.message : "Please try again."}`
      );
    }
  }

  async function assignPostType(dayKey: SetupMarketplaceDayKey, postTypeId: string) {
    const previousSelections = selections;
    const nextSelection = { ...selections.selectedPostStyleIdsByDay, [dayKey]: postTypeId };
    setSelections((current) => ({ ...current, selectedPostStyleIdsByDay: nextSelection }));

    try {
      await saveSelections({ ...selections, selectedPostStyleIdsByDay: nextSelection });
      setPanel("post-types");
      setActiveItemId(postTypeId);
      setStatusMessage(`Saved ${selectedDayLabel} schedule item.`);
    } catch (error) {
      setSelections(previousSelections);
      setStatusMessage(
        `Unable to save ${selectedDayLabel} schedule item. ${error instanceof Error ? error.message : "Please try again."}`
      );
    }
  }

  async function clearDay(dayKey: SetupMarketplaceDayKey) {
    const previousSelections = selections;
    const nextSelection = { ...selections.selectedPostStyleIdsByDay, [dayKey]: null };
    setSelections((current) => ({ ...current, selectedPostStyleIdsByDay: nextSelection }));

    try {
      await saveSelections({ ...selections, selectedPostStyleIdsByDay: nextSelection });
      setStatusMessage(`${SETUP_MARKETPLACE_DAYS.find((day) => day.key === dayKey)?.label ?? dayKey} cleared.`);
    } catch (error) {
      setSelections(previousSelections);
      setStatusMessage(
        `Unable to clear ${SETUP_MARKETPLACE_DAYS.find((day) => day.key === dayKey)?.label ?? dayKey}. ${error instanceof Error ? error.message : "Please try again."}`
      );
    }
  }

  function startHookCreate() {
    setEditingHookId(null);
    setHookForm(emptyHookForm());
  }

  function startPostTypeCreate() {
    setEditingPostTypeId(null);
    setPostTypeForm(emptyPostForm());
  }

  function startHookEdit(item: CatalogHook) {
    setEditingHookId(item.id);
    setHookForm({
      title: item.title,
      shortDescription: item.shortDescription,
      longDescription: item.longDescription,
      visibility: item.visibility,
      icon: item.icon ?? "",
      tags: item.tags.join(", "),
      examples: item.examples.join("\n"),
      whenToUse: item.whenToUse,
      psychologicalEffect: item.psychologicalEffect
    });
  }

  function startPostTypeEdit(item: CatalogPostType) {
    setEditingPostTypeId(item.id);
    setPostTypeForm({
      title: item.title,
      shortDescription: item.shortDescription,
      longDescription: item.longDescription,
      visibility: item.visibility,
      icon: item.icon ?? "",
      tags: item.tags.join(", "),
      structure: item.structure,
      expectedHooks: item.expectedHooks.join("\n"),
      outcome: item.outcome
    });
  }

  async function submitHookForm() {
    const payload = {
      title: hookForm.title.trim(),
      shortDescription: hookForm.shortDescription.trim(),
      longDescription: hookForm.longDescription.trim(),
      visibility: hookForm.visibility,
      icon: hookForm.icon.trim() || undefined,
      tags: toTags(hookForm.tags),
      examples: hookForm.examples.split("\n").map((line) => line.trim()).filter(Boolean),
      whenToUse: hookForm.whenToUse.trim(),
      psychologicalEffect: hookForm.psychologicalEffect.trim()
    };

    const response = await fetchWithAuth(
      editingHookId ? `/v1/me/marketplace/hooks/${editingHookId}` : "/v1/me/marketplace/hooks",
      {
        method: editingHookId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(await getRequestErrorMessage(response, "Failed to save hook"));
    }

    const saved = (await response.json()) as HookResponse;
    setStatusMessage(editingHookId ? "Hook updated." : "Hook created.");
    setEditingHookId(null);
    setHookForm(emptyHookForm());
    setPanel("hooks");
    setActiveItemId(saved.id);
    await refreshMarketplace();
  }

  async function submitPostTypeForm() {
    const payload = {
      title: postTypeForm.title.trim(),
      shortDescription: postTypeForm.shortDescription.trim(),
      longDescription: postTypeForm.longDescription.trim(),
      visibility: postTypeForm.visibility,
      icon: postTypeForm.icon.trim() || undefined,
      tags: toTags(postTypeForm.tags),
      structure: postTypeForm.structure.trim(),
      expectedHooks: postTypeForm.expectedHooks
        .split(/[\n,]/)
        .map((part) => part.trim())
        .filter(Boolean),
      outcome: postTypeForm.outcome.trim()
    };

    const response = await fetchWithAuth(
      editingPostTypeId ? `/v1/me/marketplace/post-styles/${editingPostTypeId}` : "/v1/me/marketplace/post-styles",
      {
        method: editingPostTypeId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(await getRequestErrorMessage(response, "Failed to save post type"));
    }

    const saved = (await response.json()) as PostTypeResponse;
    setStatusMessage(editingPostTypeId ? "Post type updated." : "Post type created.");
    setEditingPostTypeId(null);
    setPostTypeForm(emptyPostForm());
    setPanel("post-types");
    setActiveItemId(saved.id);
    await refreshMarketplace();
  }

  async function deleteHook(item: CatalogHook) {
    if (!window.confirm(`Delete ${item.title}?`)) return;

    const response = await fetchWithAuth(`/v1/me/marketplace/hooks/${item.id}`, { method: "DELETE" });
    if (!response.ok && response.status !== 204) {
      throw new Error(await getRequestErrorMessage(response, "Failed to delete hook"));
    }

    setEditingHookId(null);
    setHookForm(emptyHookForm());
    setStatusMessage("Hook deleted.");
    await refreshMarketplace();
  }

  async function deletePostType(item: CatalogPostType) {
    if (!window.confirm(`Delete ${item.title}?`)) return;

    const response = await fetchWithAuth(`/v1/me/marketplace/post-styles/${item.id}`, { method: "DELETE" });
    if (!response.ok && response.status !== 204) {
      throw new Error(await getRequestErrorMessage(response, "Failed to delete post type"));
    }

    setEditingPostTypeId(null);
    setPostTypeForm(emptyPostForm());
    setStatusMessage("Post type deleted.");
    await refreshMarketplace();
  }

  return (
    <div className="mt-6 grid gap-6">
      <Card className="border-[var(--color-soft-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,239,230,0.88))]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Marketplace summary</p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">Hook selection and weekly schedule</h2>
          </div>
          <Badge variant="neutral">{scheduleSummary}</Badge>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-ink)]">
          Browse public and private hooks, add your own reusable templates, and map a post type to each day of the week.
        </p>
        {statusMessage ? <p className="mt-3 text-sm text-[var(--color-muted-alt)]">{statusMessage}</p> : null}
        {loading ? <p className="mt-2 text-sm text-[var(--color-muted-alt)]">Loading marketplace...</p> : null}
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[var(--color-soft-border)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Hooks section</p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">Selected hooks</h3>
            </div>
            <Button type="button" onClick={openHooksMarketplace} className="rounded-full">
              Search marketplace
            </Button>
          </div>

          <button
            type="button"
            onClick={openHooksMarketplace}
            className="mt-4 flex w-full items-center gap-3 rounded-[1.35rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] px-4 py-4 text-left text-[var(--color-muted-alt)] transition hover:border-[var(--color-strong-border)] hover:bg-white"
          >
            <span>Search the hooks marketplace to add a new hook</span>
          </button>

          <div className="mt-5 grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-sm font-semibold text-[var(--color-text)]">Your selected hooks</p>
              <Badge variant="neutral">{selections.selectedHookIds.length} selected</Badge>
            </div>

            {selections.selectedHookIds.length ? (
              <div className="grid gap-3">
                {selections.selectedHookIds
                  .map((hookId) => hooks.find((item) => item.id === hookId))
                  .filter((item): item is CatalogHook => Boolean(item))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-[1.15rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <IconGlyph icon={item.icon} />
                          <div>
                            <p className="m-0 text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
                            <p className="mt-1 text-xs text-[var(--color-muted-alt)]">{item.author}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[var(--color-ink)]">{item.shortDescription}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedHook(item.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-soft-border)] bg-white text-[var(--color-primary)] transition hover:border-[var(--color-strong-border)]"
                      >
                        x
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-5 text-sm text-[var(--color-muted-alt)]">
                No hooks selected yet. Open the marketplace to add one.
              </div>
            )}
          </div>
        </Card>

        <Card className="border-[var(--color-soft-border)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Schedule section</p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">Weekly post schedule</h3>
            </div>
            <Badge variant="neutral">{SETUP_MARKETPLACE_DAYS.length} days</Badge>
          </div>

          <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">Click any day container to open the post type marketplace and assign a format for that day.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {SETUP_MARKETPLACE_DAYS.map(({ key, label }) => {
              const item = selections.selectedPostStyleIdsByDay[key]
                ? postStyles.find((candidate) => candidate.id === selections.selectedPostStyleIdsByDay[key]) ?? null
                : null;

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPostTypeMarketplace(key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openPostTypeMarketplace(key);
                    }
                  }}
                  className={`rounded-[1.35rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    item
                      ? "border-[var(--color-strong-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,var(--color-accent-3))]"
                      : "border-dashed border-[var(--color-soft-border)] bg-[var(--color-surface-soft)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">{label}</p>
                      {item ? (
                        <>
                          <h4 className="mt-2 text-lg text-[var(--color-text)]">{item.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">{item.shortDescription}</p>
                        </>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted-alt)]">Empty container</p>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-label={`Open ${label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openPostTypeMarketplace(key);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)] transition hover:border-[var(--color-strong-border)] hover:bg-white"
                    >
                      +
                    </button>
                  </div>

                  {item ? (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Badge variant="neutral">Filled</Badge>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          clearDay(key);
                        }}
                        className="rounded-full border border-[var(--color-soft-border)] px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-strong-border)] hover:bg-white"
                      >
                        Clear
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {panel ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-7xl">
            <Card className="border-[var(--color-soft-border)] bg-[var(--color-canvas)] p-0 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-soft-border)] px-5 py-4">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
                    {panel === "hooks" ? "Hooks marketplace" : "Post type marketplace"}
                  </p>
                  <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">
                    {panel === "hooks" ? "Browse and add hooks" : "Browse and assign post types"}
                  </h3>
                </div>
                <Button type="button" variant="ghost" className="rounded-full px-3 py-2" onClick={closeMarketplace}>
                  Close
                </Button>
              </div>

              <div className="grid gap-6 px-5 py-5 lg:grid-cols-12">
                <div className="lg:col-span-12">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={`Search ${panel === "hooks" ? "hooks" : "post types"}`}
                    className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                  />
                </div>

                {panel === "hooks" ? (
                  <>
                    <div className="grid gap-4 lg:col-span-7">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Public marketplace</p>
                        <div className="grid gap-3">
                          {publicHooks.map((item) => (
                            <MarketplaceListCard
                              key={item.id}
                              item={item}
                              active={item.id === activeItem?.id}
                              onSelect={() => setActiveItemId(item.id)}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Your creations</p>
                        <div className="grid gap-3">
                          {yourHooks.map((item) => (
                            <MarketplaceListCard
                              key={item.id}
                              item={item}
                              active={item.id === activeItem?.id}
                              onSelect={() => setActiveItemId(item.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:col-span-5">
                      {activeHook ? (
                        <MarketplaceDetailPanel
                          item={activeHook}
                          kind="hook"
                          selected={selections.selectedHookIds.includes(activeHook.id)}
                          onAdd={() => addHookToSelection(activeHook.id)}
                          onEdit={() => startHookEdit(activeHook)}
                          onDelete={() => deleteHook(activeHook)}
                          onClose={closeMarketplace}
                        />
                      ) : (
                        <Card className="border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] text-[var(--color-muted-alt)]">
                          Select an item to open its details.
                        </Card>
                      )}
                    </div>

                    <div className="lg:col-span-12">
                      <HookForm
                        value={hookForm}
                        mode={editingHookId ? "edit" : "create"}
                        onChange={setHookForm}
                        onReset={startHookCreate}
                        onSubmit={() => {
                          void submitHookForm().catch((error) => {
                            console.error("Failed to submit hook form", error);
                          });
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 lg:col-span-7">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Public marketplace</p>
                        <div className="grid gap-3">
                          {publicPostStyles.map((item) => (
                            <MarketplaceListCard
                              key={item.id}
                              item={item}
                              active={item.id === activeItem?.id}
                              onSelect={() => setActiveItemId(item.id)}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">Your creations</p>
                        <div className="grid gap-3">
                          {yourPostStyles.map((item) => (
                            <MarketplaceListCard
                              key={item.id}
                              item={item}
                              active={item.id === activeItem?.id}
                              onSelect={() => setActiveItemId(item.id)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:col-span-5">
                      {activePostStyle ? (
                        <MarketplaceDetailPanel
                          item={activePostStyle}
                          kind="post-type"
                          activeDayLabel={selectedDayLabel}
                          selected={selections.selectedPostStyleIdsByDay[selectedDayKey] === activePostStyle.id}
                          onAdd={() => assignPostType(selectedDayKey, activePostStyle.id)}
                          onEdit={() => startPostTypeEdit(activePostStyle)}
                          onDelete={() => deletePostType(activePostStyle)}
                          onClose={closeMarketplace}
                        />
                      ) : (
                        <Card className="border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] text-[var(--color-muted-alt)]">
                          Select an item to open its details.
                        </Card>
                      )}
                    </div>

                    <div className="lg:col-span-12">
                      <PostTypeForm
                        value={postTypeForm}
                        mode={editingPostTypeId ? "edit" : "create"}
                        onChange={setPostTypeForm}
                        onReset={startPostTypeCreate}
                        onSubmit={() => {
                          void submitPostTypeForm();
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
