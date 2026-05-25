"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  createHookLongDescriptionTemplate,
  createPostTypeLongDescriptionTemplate,
  getDefaultSelectedHookIds,
  getDefaultSelectedPostTypesByDay,
  SETUP_MARKETPLACE_DAYS,
  SETUP_PUBLIC_HOOKS,
  SETUP_PUBLIC_POST_TYPES,
  type MarketplaceVisibility,
  type SetupMarketplaceDayKey,
  type SetupMarketplaceHook,
  type SetupMarketplacePostType
} from "@/lib/setupMarketplace";

type SetupMarketplaceDashboardProps = {
  schedule: null | {
    schedule: unknown;
    cronExpr: string | null;
    enabled: boolean;
  };
};

type MarketplacePanel = "hooks" | "post-types" | null;

type HookDraft = {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon: string;
};

type PostTypeDraft = {
  title: string;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon: string;
};

type StoredMarketplaceState = {
  selectedHookIds: string[];
  selectedPostTypesByDay: Record<SetupMarketplaceDayKey, string | null>;
  customHooks: SetupMarketplaceHook[];
  customPostTypes: SetupMarketplacePostType[];
};

type SetupMarketplaceItemBase = {
  id: string;
  title: string;
  author: string;
  shortDescription: string;
  longDescription: string;
  visibility: MarketplaceVisibility;
  icon?: string;
  tags?: string[];
};

const STORAGE_KEY = "linkedin-agent.setup-marketplace.v1";
const DEFAULT_HOOK_TEMPLATE = createHookLongDescriptionTemplate("My hook idea");
const DEFAULT_POST_TEMPLATE = createPostTypeLongDescriptionTemplate("My post type");

function makeHookDraft(): HookDraft {
  return {
    title: "My hook idea",
    shortDescription: "A short description of the hook's role in the post.",
    longDescription: DEFAULT_HOOK_TEMPLATE,
    visibility: "private",
    icon: "Sparkles"
  };
}

function makePostTypeDraft(): PostTypeDraft {
  return {
    title: "My post type",
    shortDescription: "A short description of the post type.",
    longDescription: DEFAULT_POST_TEMPLATE,
    visibility: "private",
    icon: "CalendarDays"
  };
}

function toLookupMap<T extends SetupMarketplaceItemBase>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((accumulator, item) => {
    accumulator[item.id] = item;
    return accumulator;
  }, {});
}

function matchesQuery(item: SetupMarketplaceItemBase, query: string): boolean {
  if (!query) return true;
  const haystack = [item.title, item.author, item.shortDescription, item.longDescription, item.visibility]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
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
  return (
    <Badge variant="neutral">{visibility === "public" ? "Public" : "Private"}</Badge>
  );
}

function MarketplaceListCard({
  item,
  active,
  onSelect,
  onAdd,
  addLabel
}: {
  item: SetupMarketplaceItemBase;
  active: boolean;
  onSelect: () => void;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
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
            {(item.tags ?? []).slice(0, 3).map((tag: string) => (
              <span
                key={`${item.id}-${tag}`}
                className="rounded-full border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-alt)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label={addLabel}
          onClick={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] text-[var(--color-primary)] transition hover:border-[var(--color-strong-border)] hover:bg-white"
        >
          +
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
        Click to open details
      </p>
    </div>
  );
}

function MarketplaceDetailPanel({
  item,
  kind,
  onAdd,
  addLabel,
  onClose
}: {
  item: SetupMarketplaceItemBase;
  kind: "hook" | "post-type";
  onAdd: () => void;
  addLabel: string;
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
          </div>
        </div>

        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full px-3 py-2">
          Close
        </Button>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--color-ink)]">{item.shortDescription}</p>
      <div className="mt-5 rounded-[1.35rem] border border-[var(--color-soft-border)] bg-white p-4">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
          Long description
        </p>
        <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--color-text)]">{item.longDescription}</pre>
      </div>

      {kind === "hook" ? (
        <div className="mt-4 grid gap-3 text-sm text-[var(--color-ink)]">
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">When to use</p>
            <p className="mt-1 leading-6">{(item as SetupMarketplaceHook).whenToUse}</p>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Examples</p>
            <ul className="mt-1 space-y-1 pl-5">
              {(item as SetupMarketplaceHook).examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Psychological effect</p>
            <p className="mt-1 leading-6">{(item as SetupMarketplaceHook).psychologicalEffect}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 text-sm text-[var(--color-ink)]">
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Structure</p>
            <p className="mt-1 leading-6">{(item as SetupMarketplacePostType).structure}</p>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Expected hooks</p>
            <ul className="mt-1 space-y-1 pl-5">
              {(item as SetupMarketplacePostType).expectedHooks.map((hook) => (
                <li key={hook}>{hook}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="m-0 font-semibold text-[var(--color-text)]">Expected outcome</p>
            <p className="mt-1 leading-6">{(item as SetupMarketplacePostType).outcome}</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" onClick={onAdd} className="rounded-full">
          +
          {addLabel}
        </Button>
      </div>
    </Card>
  );
}

export function SetupMarketplaceDashboard({ schedule }: SetupMarketplaceDashboardProps) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<MarketplacePanel>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<SetupMarketplaceDayKey>("monday");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHookIds, setSelectedHookIds] = useState<string[]>(getDefaultSelectedHookIds());
  const [selectedPostTypesByDay, setSelectedPostTypesByDay] = useState<Record<SetupMarketplaceDayKey, string | null>>(
    getDefaultSelectedPostTypesByDay()
  );
  const [customHooks, setCustomHooks] = useState<SetupMarketplaceHook[]>([]);
  const [customPostTypes, setCustomPostTypes] = useState<SetupMarketplacePostType[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(SETUP_PUBLIC_HOOKS[0]?.id ?? null);
  const [hookDraft, setHookDraft] = useState<HookDraft>(makeHookDraft());
  const [postTypeDraft, setPostTypeDraft] = useState<PostTypeDraft>(makePostTypeDraft());

  const hookItems = [...SETUP_PUBLIC_HOOKS, ...customHooks];
  const postTypeItems = [...SETUP_PUBLIC_POST_TYPES, ...customPostTypes];
  const hookLookup = toLookupMap(hookItems);
  const postTypeLookup = toLookupMap(postTypeItems);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<StoredMarketplaceState>;
        if (Array.isArray(parsed.selectedHookIds)) {
          setSelectedHookIds(parsed.selectedHookIds);
        }
        if (parsed.selectedPostTypesByDay) {
          setSelectedPostTypesByDay((current) => ({ ...current, ...parsed.selectedPostTypesByDay }));
        }
        if (Array.isArray(parsed.customHooks)) {
          setCustomHooks(parsed.customHooks);
        }
        if (Array.isArray(parsed.customPostTypes)) {
          setCustomPostTypes(parsed.customPostTypes);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const nextState: StoredMarketplaceState = {
      selectedHookIds,
      selectedPostTypesByDay,
      customHooks,
      customPostTypes
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, [customHooks, customPostTypes, hasHydrated, selectedHookIds, selectedPostTypesByDay]);

  const filteredHooks = hookItems.filter((item) => matchesQuery(item, searchQuery.trim().toLowerCase()));
  const filteredPostTypes = postTypeItems.filter((item) => matchesQuery(item, searchQuery.trim().toLowerCase()));

  const selectedHookItems = selectedHookIds
    .map((hookId) => hookLookup[hookId])
    .filter((item): item is SetupMarketplaceHook => Boolean(item));

  const selectedPostTypeItems = SETUP_MARKETPLACE_DAYS.map(({ key, label }) => ({
    key,
    label,
    item: selectedPostTypesByDay[key] ? postTypeLookup[selectedPostTypesByDay[key] ?? ""] ?? null : null
  }));

  const currentPanelItems = selectedPanel === "hooks" ? filteredHooks : filteredPostTypes;
  const activeItem =
    currentPanelItems.find((item) => item.id === activeItemId) ?? currentPanelItems[0] ?? null;

  function openHooksMarketplace() {
    setSearchQuery("");
    setSelectedPanel("hooks");
    setActiveItemId((current) => current ?? hookItems[0]?.id ?? null);
  }

  function openPostTypeMarketplace(dayKey: SetupMarketplaceDayKey) {
    setSearchQuery("");
    setSelectedDayKey(dayKey);
    setSelectedPanel("post-types");
    setActiveItemId((current) => current ?? postTypeItems[0]?.id ?? null);
  }

  function closeMarketplace() {
    setSelectedPanel(null);
    setSearchQuery("");
    setActiveItemId(null);
  }

  function addHookToSelection(hookId: string) {
    setSelectedHookIds((current) => (current.includes(hookId) ? current : [...current, hookId]));
    setActiveItemId(hookId);
    setSelectedPanel("hooks");
  }

  function assignPostType(dayKey: SetupMarketplaceDayKey, postTypeId: string) {
    setSelectedPostTypesByDay((current) => ({ ...current, [dayKey]: postTypeId }));
    setActiveItemId(postTypeId);
    setSelectedPanel("post-types");
  }

  function resetHookDraft() {
    setHookDraft(makeHookDraft());
  }

  function resetPostTypeDraft() {
    setPostTypeDraft(makePostTypeDraft());
  }

  function createCustomHook() {
    const nextHook: SetupMarketplaceHook = {
      id: `custom-hook-${Date.now()}`,
      title: hookDraft.title.trim() || "Untitled hook",
      author: "You",
      shortDescription: hookDraft.shortDescription.trim() || "A custom hook created from the setup page.",
      longDescription: hookDraft.longDescription.trim() || createHookLongDescriptionTemplate(hookDraft.title),
      visibility: hookDraft.visibility,
      icon: hookDraft.icon.trim() || undefined,
      tags: [hookDraft.visibility, "custom"],
      examples: ["Add your own example line here."],
      whenToUse: "Describe the ideal moment for this hook.",
      psychologicalEffect: "Explain why the opening works for the target audience."
    };

    setCustomHooks((current) => [nextHook, ...current]);
    setSelectedHookIds((current) => [...current, nextHook.id]);
    setActiveItemId(nextHook.id);
    setSelectedPanel("hooks");
    resetHookDraft();
  }

  function createCustomPostType() {
    const nextPostType: SetupMarketplacePostType = {
      id: `custom-post-type-${Date.now()}`,
      title: postTypeDraft.title.trim() || "Untitled post type",
      author: "You",
      shortDescription: postTypeDraft.shortDescription.trim() || "A custom post type created from the setup page.",
      longDescription: postTypeDraft.longDescription.trim() || createPostTypeLongDescriptionTemplate(postTypeDraft.title),
      visibility: postTypeDraft.visibility,
      icon: postTypeDraft.icon.trim() || undefined,
      tags: [postTypeDraft.visibility, "custom"],
      structure: "Custom structure described by the user.",
      expectedHooks: ["Add the hooks that fit this format."],
      outcome: "Describe the desired reader outcome."
    };

    setCustomPostTypes((current) => [nextPostType, ...current]);
    setSelectedPostTypesByDay((current) => ({ ...current, [selectedDayKey]: nextPostType.id }));
    setActiveItemId(nextPostType.id);
    setSelectedPanel("post-types");
    resetPostTypeDraft();
  }

  function removeSelectedHook(hookId: string) {
    setSelectedHookIds((current) => current.filter((currentHookId) => currentHookId !== hookId));
  }

  function clearDay(dayKey: SetupMarketplaceDayKey) {
    setSelectedPostTypesByDay((current) => ({ ...current, [dayKey]: null }));
  }

  const scheduleSummary = schedule?.enabled
    ? `Enabled · ${schedule.cronExpr ?? "custom schedule"}`
    : schedule?.cronExpr
      ? `Disabled · ${schedule.cronExpr}`
      : "No cron schedule yet";

  const activeDayLabel = SETUP_MARKETPLACE_DAYS.find((day) => day.key === selectedDayKey)?.label ?? selectedDayKey;

  return (
    <div className="mt-6 grid gap-6">
      <Card className="border-[var(--color-soft-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,239,230,0.88))]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
              Marketplace summary
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">
              Hook selection and weekly schedule
            </h2>
          </div>
            <Badge variant="neutral">{scheduleSummary}</Badge>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-ink)]">
          Browse public and private hooks, add your own reusable templates, and map a post type to each day of the week.
        </p>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-[var(--color-soft-border)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
                Hooks section
              </p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">
                Selected hooks
              </h3>
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
              <Badge variant="neutral">{selectedHookItems.length} selected</Badge>
            </div>

            {selectedHookItems.length ? (
              <div className="grid gap-3">
                {selectedHookItems.map((item) => (
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
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
                Schedule section
              </p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">
                Weekly post schedule
              </h3>
            </div>
            <Badge variant="neutral">{SETUP_MARKETPLACE_DAYS.length} days</Badge>
          </div>

          <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
            Click any day container to open the post type marketplace and assign a format for that day.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {selectedPostTypeItems.map(({ key, label, item }) => (
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
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
                      {label}
                    </p>
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
            ))}
          </div>
        </Card>
      </section>

      {selectedPanel ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-7xl">
            <Card className="border-[var(--color-soft-border)] bg-[var(--color-canvas)] p-0 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-soft-border)] px-5 py-4">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
                    {selectedPanel === "hooks" ? "Hooks marketplace" : "Post type marketplace"}
                  </p>
                  <h3 className="mt-2 font-[var(--font-display)] text-2xl text-[var(--color-text)]">
                    {selectedPanel === "hooks" ? "Browse and add hooks" : "Browse and assign post types"}
                  </h3>
                </div>
                      <Button type="button" variant="ghost" className="rounded-full px-3 py-2" onClick={closeMarketplace}>
                        Close
                      </Button>
              </div>

              <div className="grid gap-6 px-5 py-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-4">
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={`Search ${selectedPanel === "hooks" ? "hooks" : "post types"}`}
                    className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                  />

                  <div className="grid gap-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
                        Public marketplace
                      </p>
                      <div className="grid gap-3">
                        {(selectedPanel === "hooks" ? SETUP_PUBLIC_HOOKS : SETUP_PUBLIC_POST_TYPES)
                          .filter((item) => matchesQuery(item, searchQuery.trim().toLowerCase()))
                          .map((item) => (
                            <MarketplaceListCard
                              key={item.id}
                              item={item}
                              active={item.id === activeItem?.id}
                              addLabel={selectedPanel === "hooks" ? "Add hook" : `Assign to ${selectedDayKey}`}
                              onSelect={() => setActiveItemId(item.id)}
                              onAdd={() =>
                                selectedPanel === "hooks"
                                  ? addHookToSelection(item.id)
                                  : assignPostType(selectedDayKey, item.id)
                              }
                            />
                          ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-alt)]">
                        Your creations
                      </p>
                      <div className="grid gap-3">
                        {(selectedPanel === "hooks" ? customHooks : customPostTypes)
                          .filter((item) => matchesQuery(item, searchQuery.trim().toLowerCase()))
                          .map((item) => (
                            <MarketplaceListCard
                              key={item.id}
                              item={item}
                              active={item.id === activeItem?.id}
                              addLabel={selectedPanel === "hooks" ? "Add hook" : `Assign to ${selectedDayKey}`}
                              onSelect={() => setActiveItemId(item.id)}
                              onAdd={() =>
                                selectedPanel === "hooks"
                                  ? addHookToSelection(item.id)
                                  : assignPostType(selectedDayKey, item.id)
                              }
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {activeItem ? (
                    <MarketplaceDetailPanel
                      item={activeItem}
                      kind={selectedPanel === "hooks" ? "hook" : "post-type"}
                      onAdd={() =>
                        selectedPanel === "hooks"
                          ? addHookToSelection(activeItem.id)
                          : assignPostType(selectedDayKey, activeItem.id)
                      }
                      addLabel={
                        selectedPanel === "hooks"
                          ? activeItem && selectedHookIds.includes(activeItem.id)
                            ? "Already selected"
                            : "Add hook to env"
                          : activeItem
                            ? selectedPostTypesByDay[selectedDayKey] === activeItem.id
                              ? `Assigned to ${SETUP_MARKETPLACE_DAYS.find((day) => day.key === selectedDayKey)?.label ?? selectedDayKey}`
                              : `Assign to ${SETUP_MARKETPLACE_DAYS.find((day) => day.key === selectedDayKey)?.label ?? selectedDayKey}`
                            : "Assign post type"
                      }
                      onClose={closeMarketplace}
                    />
                  ) : (
                    <Card className="border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] text-[var(--color-muted-alt)]">
                      Select an item to open its details.
                    </Card>
                  )}

                  {selectedPanel === "hooks" ? (
                    <Card className="border-[var(--color-soft-border)] bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="m-0 font-[var(--font-display)] text-xl text-[var(--color-text)]">
                            Create your own hook
                          </h3>
                          <p className="mt-2 text-sm text-[var(--color-muted-alt)]">
                            User-created items stay separate from the public marketplace and can be private or public.
                          </p>
                        </div>
                        <Button type="button" variant="ghost" onClick={resetHookDraft} className="rounded-full px-3 py-2">
                          Reset template
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <Input
                          value={hookDraft.title}
                          onChange={(event) => {
                            const title = event.target.value;
                            setHookDraft((current) => ({
                              ...current,
                              title,
                              longDescription:
                                current.longDescription === DEFAULT_HOOK_TEMPLATE
                                  ? createHookLongDescriptionTemplate(title)
                                  : current.longDescription
                            }));
                          }}
                          placeholder="Title"
                          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                        />

                        <Input
                          value={hookDraft.shortDescription}
                          onChange={(event) => setHookDraft((current) => ({ ...current, shortDescription: event.target.value }))}
                          placeholder="Short description"
                          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                        />

                        <Input
                          textarea
                          value={hookDraft.longDescription}
                          onChange={(event) => setHookDraft((current) => ({ ...current, longDescription: event.target.value }))}
                          placeholder="Long description for the hook"
                          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={hookDraft.icon}
                            onChange={(event) => setHookDraft((current) => ({ ...current, icon: event.target.value }))}
                            placeholder="Optional icon name"
                            className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                          />

                          <div className="flex items-center gap-2 rounded-[1.1rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-2">
                            <button
                              type="button"
                              onClick={() => setHookDraft((current) => ({ ...current, visibility: "public" }))}
                              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                                hookDraft.visibility === "public"
                                  ? "bg-[var(--color-primary)] text-white"
                                  : "text-[var(--color-muted-alt)]"
                              }`}
                            >
                              Public
                            </button>
                            <button
                              type="button"
                              onClick={() => setHookDraft((current) => ({ ...current, visibility: "private" }))}
                              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                                hookDraft.visibility === "private"
                                  ? "bg-[var(--color-primary)] text-white"
                                  : "text-[var(--color-muted-alt)]"
                              }`}
                            >
                              Private
                            </button>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => {
                            const nextHook: SetupMarketplaceHook = {
                              id: `custom-hook-${Date.now()}`,
                              title: hookDraft.title.trim() || "Untitled hook",
                              author: "You",
                              shortDescription: hookDraft.shortDescription.trim() || "A custom hook created from the setup page.",
                              longDescription: hookDraft.longDescription.trim() || createHookLongDescriptionTemplate(hookDraft.title),
                              visibility: hookDraft.visibility,
                              icon: hookDraft.icon.trim() || undefined,
                              tags: [hookDraft.visibility, "custom"],
                              examples: ["Add your own example line here."],
                              whenToUse: "Describe the ideal moment for this hook.",
                              psychologicalEffect: "Explain why the opening works for the target audience."
                            };

                            setCustomHooks((current) => [nextHook, ...current]);
                            setSelectedHookIds((current) => [...current, nextHook.id]);
                            setActiveItemId(nextHook.id);
                            setSelectedPanel("hooks");
                            resetHookDraft();
                          }}
                          className="rounded-full"
                        >
                          +
                          Add to marketplace
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="border-[var(--color-soft-border)] bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="m-0 font-[var(--font-display)] text-xl text-[var(--color-text)]">
                            Create your own post type
                          </h3>
                          <p className="mt-2 text-sm text-[var(--color-muted-alt)]">
                            User-created items stay separate from the public marketplace and can be private or public.
                          </p>
                        </div>
                        <Button type="button" variant="ghost" onClick={resetPostTypeDraft} className="rounded-full px-3 py-2">
                          Reset template
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <Input
                          value={postTypeDraft.title}
                          onChange={(event) => {
                            const title = event.target.value;
                            setPostTypeDraft((current) => ({
                              ...current,
                              title,
                              longDescription:
                                current.longDescription === DEFAULT_POST_TEMPLATE
                                  ? createPostTypeLongDescriptionTemplate(title)
                                  : current.longDescription
                            }));
                          }}
                          placeholder="Title"
                          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                        />

                        <Input
                          value={postTypeDraft.shortDescription}
                          onChange={(event) => setPostTypeDraft((current) => ({ ...current, shortDescription: event.target.value }))}
                          placeholder="Short description"
                          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                        />

                        <Input
                          textarea
                          value={postTypeDraft.longDescription}
                          onChange={(event) => setPostTypeDraft((current) => ({ ...current, longDescription: event.target.value }))}
                          placeholder="Long description for the post type"
                          className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            value={postTypeDraft.icon}
                            onChange={(event) => setPostTypeDraft((current) => ({ ...current, icon: event.target.value }))}
                            placeholder="Optional icon name"
                            className="border-[var(--color-soft-border)] bg-white text-[var(--color-text)]"
                          />

                          <div className="flex items-center gap-2 rounded-[1.1rem] border border-[var(--color-soft-border)] bg-[var(--color-surface-soft)] p-2">
                            <button
                              type="button"
                              onClick={() => setPostTypeDraft((current) => ({ ...current, visibility: "public" }))}
                              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                                postTypeDraft.visibility === "public"
                                  ? "bg-[var(--color-primary)] text-white"
                                  : "text-[var(--color-muted-alt)]"
                              }`}
                            >
                              Public
                            </button>
                            <button
                              type="button"
                              onClick={() => setPostTypeDraft((current) => ({ ...current, visibility: "private" }))}
                              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                                postTypeDraft.visibility === "private"
                                  ? "bg-[var(--color-primary)] text-white"
                                  : "text-[var(--color-muted-alt)]"
                              }`}
                            >
                              Private
                            </button>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => {
                            const nextPostType: SetupMarketplacePostType = {
                              id: `custom-post-type-${Date.now()}`,
                              title: postTypeDraft.title.trim() || "Untitled post type",
                              author: "You",
                              shortDescription:
                                postTypeDraft.shortDescription.trim() || "A custom post type created from the setup page.",
                              longDescription:
                                postTypeDraft.longDescription.trim() || createPostTypeLongDescriptionTemplate(postTypeDraft.title),
                              visibility: postTypeDraft.visibility,
                              icon: postTypeDraft.icon.trim() || undefined,
                              tags: [postTypeDraft.visibility, "custom"],
                              structure: "Custom structure described by the user.",
                              expectedHooks: ["Add the hooks that fit this format."],
                              outcome: "Describe the desired reader outcome."
                            };

                            setCustomPostTypes((current) => [nextPostType, ...current]);
                            setSelectedPostTypesByDay((current) => ({ ...current, [selectedDayKey]: nextPostType.id }));
                            setActiveItemId(nextPostType.id);
                            setSelectedPanel("post-types");
                            resetPostTypeDraft();
                          }}
                          className="rounded-full"
                        >
                          +
                          Add to marketplace
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}