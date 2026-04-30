"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type AdminLocation = { id: string; slug: string; name: string };

type AdminMission = {
  id: string;
  title: string;
  description?: string;
  address?: string;
  task_type?: string;
  xp?: number;
  image_key?: string;
  image_url?: string;
  gallery_keys?: string[];
  gallery_urls?: string[];
};

type AdminLevel = {
  id: string;
  title: string;
  order: number;
  min_completion_ratio?: number;
  image_key?: string;
  image_url?: string;
  missions: AdminMission[];
};

type AdminJourney = {
  id: string;
  title: string;
  description?: string;
  weeks_label?: string;
  accent?: string;
  status?: string;
  version: number;
  is_current: boolean;
  image_key?: string;
  image_url?: string;
  levels: AdminLevel[];
};

type AdminJourneysResponse = {
  location: AdminLocation;
  journeys: AdminJourney[];
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function titleCaseId(id: string) {
  return String(id)
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="text-xs font-semibold text-muted">
      {children}
      {required ? <span className="ml-1 text-red-600" aria-hidden="true">*</span> : null}
    </div>
  );
}

function toTitleCase(input: string) {
  return input
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function JourneyAdminClient() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");
  const [journeys, setJourneys] = useState<AdminJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingJourney, setIsCreatingJourney] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLocationName = useMemo(() => {
    return locations.find((l) => l.slug === selectedLocationSlug)?.name ?? titleCaseId(selectedLocationSlug);
  }, [locations, selectedLocationSlug]);

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/locations", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load locations (${res.status})`);
        const json = (await res.json()) as { items: AdminLocation[] };
        if (cancelled) return;
        const nextLocations = json.items ?? [];
        setLocations(nextLocations);

        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const fromUrl = params.get("location")?.trim() ?? "";
        const exists = (slug: string) => nextLocations.some((l) => l.slug === slug);

        const preferred =
          (fromUrl && exists(fromUrl) ? fromUrl : "") ||
          (selectedLocationSlug && exists(selectedLocationSlug) ? selectedLocationSlug : "") ||
          (nextLocations[0]?.slug ?? "");

        if (preferred && preferred !== selectedLocationSlug) {
          setSelectedLocationSlug(preferred);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load locations");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadJourneys() {
      if (!selectedLocationSlug) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/journeys?location=${encodeURIComponent(selectedLocationSlug)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed to load journeys (${res.status})`);
        const json = (await res.json()) as AdminJourneysResponse;
        if (cancelled) return;
        setJourneys(json.journeys ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load journeys");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadJourneys();
    return () => {
      cancelled = true;
    };
  }, [selectedLocationSlug]);

  async function onCreateJourney(payload: {
    title: string;
    description?: string;
    weeks_label?: string;
    accent?: string;
    image_key?: string;
    status?: string;
    default_levels?: number;
  }) {
    if (!selectedLocationSlug) return;
    setIsCreatingJourney(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journeys?location=${encodeURIComponent(selectedLocationSlug)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);

      // Refresh journeys list
      const listRes = await fetch(`/api/admin/journeys?location=${encodeURIComponent(selectedLocationSlug)}`, {
        cache: "no-store",
      });
      if (listRes.ok) {
        const json = (await listRes.json()) as AdminJourneysResponse;
        setJourneys(json.journeys ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setIsCreatingJourney(false);
    }
  }

  async function refreshJourneys() {
    if (!selectedLocationSlug) return;
    const listRes = await fetch(`/api/admin/journeys?location=${encodeURIComponent(selectedLocationSlug)}`, {
      cache: "no-store",
    });
    if (listRes.ok) {
      const json = (await listRes.json()) as AdminJourneysResponse;
      setJourneys(json.journeys ?? []);
    }
  }

  async function createMission(levelId: string, payload: { title: string; task_type?: string; xp?: number; description?: string; address?: string }) {
    setError(null);
    const res = await fetch(`/api/admin/levels/${encodeURIComponent(levelId)}/missions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create mission failed (${res.status})`);
    await refreshJourneys();
  }

  async function updateMission(missionId: string, payload: Partial<Pick<AdminMission, "title" | "description" | "address" | "task_type" | "xp">>) {
    setError(null);
    const res = await fetch(`/api/admin/missions/${encodeURIComponent(missionId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Save mission failed (${res.status})`);
    await refreshJourneys();
  }

  async function deleteMission(missionId: string) {
    setError(null);
    const res = await fetch(`/api/admin/missions/${encodeURIComponent(missionId)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete mission failed (${res.status})`);
    await refreshJourneys();
  }

  async function createLevel(journeyId: string, payload: { title: string; order?: number; min_completion_ratio?: number }) {
    setError(null);
    const res = await fetch(`/api/admin/journeys/${encodeURIComponent(journeyId)}/levels`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create level failed (${res.status})`);
    await refreshJourneys();
  }

  async function updateLevel(levelId: string, payload: { title?: string; order?: number; min_completion_ratio?: number }) {
    setError(null);
    const res = await fetch(`/api/admin/levels/${encodeURIComponent(levelId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Save level failed (${res.status})`);
    await refreshJourneys();
  }

  async function deleteLevel(levelId: string) {
    setError(null);
    const res = await fetch(`/api/admin/levels/${encodeURIComponent(levelId)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete level failed (${res.status})`);
    await refreshJourneys();
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted">
        Loading journey config…
      </div>
    );
  }

  if (!selectedLocationSlug) {
    return (
      <div className="rounded-3xl bg-card ring-1 ring-black/8 p-5">
        <div className="text-sm font-semibold">Journeys</div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-muted">Location</div>
          <select
            className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            value={selectedLocationSlug}
            onChange={(e) => setSelectedLocationSlug(e.target.value)}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
          <div className="mt-1 text-[11px] text-muted">
            Select a location to manage journeys.
          </div>
        </div>
        <div className="mt-2 text-sm text-muted">Failed to load.</div>
        {error ? <div className="mt-3 text-xs text-red-600">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.08)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Journeys</div>
            <div className="mt-1 text-xs text-muted">
              Location: <span className="font-semibold text-foreground">{selectedLocationName}</span> •{" "}
              {journeys.length} journeys
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-2xl bg-white/60 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              value={selectedLocationSlug}
              onChange={(e) => {
                setSelectedLocationSlug(e.target.value);
              }}
              aria-label="Select location"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.slug}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? (
          <div className="mt-3 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <CreateJourneyCard
        locationSlug={selectedLocationSlug}
        onCreate={onCreateJourney}
        isCreating={isCreatingJourney}
      />

      <div className="space-y-3">
        {journeys.map((j) => (
          <section
            key={j.id}
            className="overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]"
          >
            <div className="px-5 py-4 border-b border-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted font-semibold">Journey</div>
                  <div className="mt-0.5 text-sm font-semibold truncate">{j.title}</div>
                  <div className="mt-1 text-[11px] text-muted">
                    v{j.version} • {j.status ?? "active"}{" "}
                    {j.is_current ? (
                      <span className="ml-2 rounded-full bg-accent/15 text-accent ring-1 ring-accent/25 px-2 py-0.5 font-semibold">
                        Current
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-[11px] text-muted">{j.id}</div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <div className="mt-1 text-sm">{j.description ?? <span className="text-muted">—</span>}</div>
                </div>
                <div>
                  <FieldLabel>Weeks label</FieldLabel>
                  <div className="mt-1 text-sm">{j.weeks_label ?? <span className="text-muted">—</span>}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <FieldLabel>Accent</FieldLabel>
                  <div className="mt-1 text-sm">{j.accent ?? <span className="text-muted">—</span>}</div>
                </div>
                <div>
                  <FieldLabel>Image</FieldLabel>
                  <div className="mt-1 text-[11px] text-muted break-all">
                    {j.image_url ? (
                      <a className="underline" href={j.image_url} target="_blank" rel="noreferrer">
                        Open signed image
                      </a>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
              </div>

              <details className="rounded-2xl bg-black/2 ring-1 ring-black/8 p-4">
                <summary className="cursor-pointer text-sm font-semibold">Levels ({j.levels.length})</summary>
                <div className="mt-4 space-y-4">
                  <CreateLevelInline
                    journeyId={j.id}
                    existingMaxOrder={Math.max(0, ...j.levels.map((x) => x.order ?? 0))}
                    onCreate={async (p) => {
                      try {
                        await createLevel(j.id, p);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Create level failed");
                      }
                    }}
                  />
                  {j.levels.map((lvl) => (
                    <div key={lvl.id} className="rounded-2xl bg-white/60 ring-1 ring-black/8 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">
                          Level {lvl.order}: {lvl.title}
                        </div>
                        <div className="text-xs text-muted">{lvl.id}</div>
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        Min completion:{" "}
                        {typeof lvl.min_completion_ratio === "number"
                          ? `${Math.round(lvl.min_completion_ratio * 100)}%`
                          : "50%"}
                      </div>

                      <LevelEditorInline
                        level={lvl}
                        onSave={async (p) => {
                          try {
                            await updateLevel(lvl.id, p);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Save level failed");
                          }
                        }}
                        onDelete={async () => {
                          try {
                            await deleteLevel(lvl.id);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Delete level failed");
                          }
                        }}
                      />

                      <details className="mt-3 rounded-2xl bg-black/2 ring-1 ring-black/8 p-3">
                        <summary className="cursor-pointer text-sm font-semibold">
                          Missions ({lvl.missions.length})
                        </summary>
                        <div className="mt-3 space-y-3">
                          <CreateMissionInline
                            levelId={lvl.id}
                            onCreate={async (p) => {
                              try {
                                await createMission(lvl.id, p);
                              } catch (e) {
                                setError(e instanceof Error ? e.message : "Create failed");
                              }
                            }}
                          />
                          {lvl.missions.map((m) => (
                            <MissionEditor
                              key={m.id}
                              mission={m}
                              onSave={async (p) => {
                                try {
                                  await updateMission(m.id, p);
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Save failed");
                                }
                              }}
                              onDelete={async () => {
                                try {
                                  await deleteMission(m.id);
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : "Delete failed");
                                }
                              }}
                            />
                          ))}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function CreateJourneyCard(props: {
  locationSlug: string;
  onCreate: (payload: {
    title: string;
    description?: string;
    weeks_label?: string;
    accent?: string;
    image_key?: string;
    status?: string;
    default_levels?: number;
  }) => Promise<void>;
  isCreating: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weeksLabel, setWeeksLabel] = useState("");
  const [accent, setAccent] = useState("");
  const [status, setStatus] = useState("active");
  const [defaultLevels, setDefaultLevels] = useState<number>(5);
  const [imageKey, setImageKey] = useState<string | undefined>(undefined);

  return (
    <section className="rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)] p-5">
      <div className="text-sm font-semibold">Create new current journey</div>
      <div className="mt-1 text-xs text-muted">
        This creates a new journey version for <span className="font-semibold">{props.locationSlug}</span> and marks it
        current.
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <FieldLabel required>Title</FieldLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>

        <label className="block">
          <FieldLabel>Status</FieldLabel>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="draft">draft</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>

        <label className="block">
          <FieldLabel>Weeks label</FieldLabel>
          <input
            value={weeksLabel}
            onChange={(e) => setWeeksLabel(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>

        <label className="block">
          <FieldLabel>Accent</FieldLabel>
          <input
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>

        <label className="block">
          <FieldLabel>Default levels</FieldLabel>
          <input
            value={String(defaultLevels)}
            onChange={(e) => setDefaultLevels(Number(e.target.value) || 5)}
            inputMode="numeric"
            className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>

      <div className="mt-4">
        <ImageUploadField
          label="Journey image"
          value={imageKey}
          locationSlug={props.locationSlug}
          onChange={setImageKey}
          helpText="Uploads to admin_asset/<location>/<uuid>.* and stores the returned file_key."
        />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={props.isCreating || !title.trim()}
          onClick={() =>
            props.onCreate({
              title: title.trim(),
              description: description.trim() || undefined,
              weeks_label: weeksLabel.trim() || undefined,
              accent: accent.trim() || undefined,
              image_key: imageKey,
              status,
              default_levels: defaultLevels,
            })
          }
          className={cx(
            "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
            "bg-accent hover:brightness-105 active:brightness-95",
            (props.isCreating || !title.trim()) && "opacity-70 cursor-not-allowed",
          )}
        >
          {props.isCreating ? "Creating…" : "Create journey"}
        </button>
      </div>
    </section>
  );
}

function CreateMissionInline({
  levelId,
  onCreate,
}: {
  levelId: string;
  onCreate: (payload: { title: string; task_type?: string; xp?: number; description?: string; address?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("text");
  const [xp, setXp] = useState<number>(100);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="rounded-2xl bg-white/70 ring-1 ring-black/8 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted">Add mission</div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="rounded-full bg-black/4 px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-black/8 hover:bg-black/6 transition"
        >
          {isOpen ? "Close" : "New"}
        </button>
      </div>
      {isOpen ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <label className="block md:col-span-3">
            <FieldLabel required>Title</FieldLabel>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="e.g., Take a metro ride"
            />
          </label>
          <label className="block">
            <FieldLabel>Task type</FieldLabel>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            >
              {["text", "photo_geo", "qr", "food", "history", "activity", "experience", "dynamic", "sponsored", "culture"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>XP</FieldLabel>
            <input
              value={String(xp)}
              onChange={(e) => setXp(Number(e.target.value) || 0)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div className="flex items-end justify-end">
            <button
              type="button"
              disabled={isCreating || !title.trim()}
              onClick={async () => {
                setIsCreating(true);
                try {
                  await onCreate({ title: title.trim(), task_type: taskType, xp });
                  setTitle("");
                  setTaskType("text");
                  setXp(100);
                  setIsOpen(false);
                } finally {
                  setIsCreating(false);
                }
              }}
              className={cx(
                "h-11 w-full md:w-auto rounded-2xl bg-accent px-4 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
                isCreating || !title.trim() ? "opacity-70 cursor-not-allowed" : "hover:brightness-105 active:brightness-95",
              )}
            >
              {isCreating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-muted">Level: <span className="font-semibold">{levelId}</span></div>
      )}
    </div>
  );
}

function MissionEditor({
  mission,
  onSave,
  onDelete,
}: {
  mission: AdminMission;
  onSave: (payload: Partial<Pick<AdminMission, "title" | "description" | "address" | "task_type" | "xp">>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: mission.title ?? "",
    description: mission.description ?? "",
    address: mission.address ?? "",
    task_type: mission.task_type ?? "text",
    xp: typeof mission.xp === "number" ? mission.xp : 100,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDraft({
      title: mission.title ?? "",
      description: mission.description ?? "",
      address: mission.address ?? "",
      task_type: mission.task_type ?? "text",
      xp: typeof mission.xp === "number" ? mission.xp : 100,
    });
  }, [mission]);

  const dirty =
    draft.title !== (mission.title ?? "") ||
    draft.description !== (mission.description ?? "") ||
    draft.address !== (mission.address ?? "") ||
    draft.task_type !== (mission.task_type ?? "text") ||
    draft.xp !== (typeof mission.xp === "number" ? mission.xp : 100);

  return (
    <div className="rounded-2xl bg-white/80 ring-1 ring-black/8 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{mission.title}</div>
          <div className="mt-0.5 text-[11px] text-muted break-all">{mission.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted">
            {toTitleCase(mission.task_type ?? "text")}
            {typeof mission.xp === "number" ? ` • ${mission.xp} XP` : ""}
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full bg-black/4 px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-black/8 hover:bg-black/6 transition"
          >
            {open ? "Hide" : "Edit"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="block md:col-span-2">
            <FieldLabel required>Title</FieldLabel>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="block">
            <FieldLabel>Task type</FieldLabel>
            <select
              value={draft.task_type}
              onChange={(e) => setDraft((d) => ({ ...d, task_type: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            >
              {["text", "photo_geo", "qr", "food", "history", "activity", "experience", "dynamic", "sponsored", "culture"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>XP</FieldLabel>
            <input
              value={String(draft.xp)}
              onChange={(e) => setDraft((d) => ({ ...d, xp: Number(e.target.value) || 0 }))}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="block md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="block md:col-span-2">
            <FieldLabel>Address</FieldLabel>
            <input
              value={draft.address}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this mission?")) return;
                setIsDeleting(true);
                try {
                  await onDelete();
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting || isSaving}
              className={cx(
                "rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-red-500/25 text-red-700 bg-red-500/10 hover:bg-red-500/15 transition",
                (isDeleting || isSaving) && "opacity-70 cursor-not-allowed",
              )}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDraft({
                  title: mission.title ?? "",
                  description: mission.description ?? "",
                  address: mission.address ?? "",
                  task_type: mission.task_type ?? "text",
                  xp: typeof mission.xp === "number" ? mission.xp : 100,
                })}
                disabled={!dirty || isSaving || isDeleting}
                className={cx(
                  "rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-black/10 bg-black/5 hover:bg-black/8 transition",
                  (!dirty || isSaving || isDeleting) && "opacity-60 cursor-not-allowed",
                )}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await onSave({
                      title: draft.title.trim(),
                      description: draft.description.trim() || undefined,
                      address: draft.address.trim() || undefined,
                      task_type: draft.task_type,
                      xp: draft.xp,
                    });
                    setOpen(false);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={!dirty || isSaving || isDeleting || !draft.title.trim()}
                className={cx(
                  "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
                  !dirty || isSaving || isDeleting || !draft.title.trim()
                    ? "opacity-70 cursor-not-allowed bg-accent/70"
                    : "bg-accent hover:brightness-105 active:brightness-95",
                )}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreateLevelInline({
  journeyId,
  existingMaxOrder,
  onCreate,
}: {
  journeyId: string;
  existingMaxOrder: number;
  onCreate: (payload: { title: string; order?: number; min_completion_ratio?: number }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState<number>(existingMaxOrder + 1);
  const [minRatio, setMinRatio] = useState<number>(0.5);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setOrder(existingMaxOrder + 1);
  }, [existingMaxOrder]);

  return (
    <div className="rounded-2xl bg-white/70 ring-1 ring-black/8 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted">Add level</div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="rounded-full bg-black/4 px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-black/8 hover:bg-black/6 transition"
        >
          {isOpen ? "Close" : "New"}
        </button>
      </div>
      {isOpen ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <label className="block md:col-span-3">
            <FieldLabel required>Title</FieldLabel>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="e.g., Level 6"
            />
          </label>
          <label className="block">
            <FieldLabel>Order</FieldLabel>
            <input
              value={String(order)}
              onChange={(e) => setOrder(Number(e.target.value) || 1)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="block">
            <FieldLabel>Min completion</FieldLabel>
            <input
              value={String(Math.round(minRatio * 100))}
              onChange={(e) => setMinRatio(Math.min(1, Math.max(0, (Number(e.target.value) || 0) / 100)))}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div className="flex items-end justify-end">
            <button
              type="button"
              disabled={isCreating || !title.trim()}
              onClick={async () => {
                setIsCreating(true);
                try {
                  await onCreate({ title: title.trim(), order, min_completion_ratio: minRatio });
                  setTitle("");
                  setMinRatio(0.5);
                  setIsOpen(false);
                } finally {
                  setIsCreating(false);
                }
              }}
              className={cx(
                "h-11 w-full md:w-auto rounded-2xl bg-accent px-4 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
                isCreating || !title.trim() ? "opacity-70 cursor-not-allowed" : "hover:brightness-105 active:brightness-95",
              )}
            >
              {isCreating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-muted">
          Journey: <span className="font-semibold">{journeyId}</span>
        </div>
      )}
    </div>
  );
}

function LevelEditorInline({
  level,
  onSave,
  onDelete,
}: {
  level: AdminLevel;
  onSave: (payload: { title?: string; order?: number; min_completion_ratio?: number }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: level.title ?? "",
    order: level.order ?? 1,
    min: typeof level.min_completion_ratio === "number" ? level.min_completion_ratio : 0.5,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDraft({
      title: level.title ?? "",
      order: level.order ?? 1,
      min: typeof level.min_completion_ratio === "number" ? level.min_completion_ratio : 0.5,
    });
  }, [level]);

  const dirty =
    draft.title !== (level.title ?? "") ||
    draft.order !== (level.order ?? 1) ||
    draft.min !== (typeof level.min_completion_ratio === "number" ? level.min_completion_ratio : 0.5);

  return (
    <div className="mt-3 rounded-2xl bg-white/70 ring-1 ring-black/8 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted">Level settings</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-black/4 px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-black/8 hover:bg-black/6 transition"
        >
          {open ? "Hide" : "Edit"}
        </button>
      </div>

      {open ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <label className="block md:col-span-3">
            <FieldLabel required>Title</FieldLabel>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="block">
            <FieldLabel>Order</FieldLabel>
            <input
              value={String(draft.order)}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 1 }))}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="block">
            <FieldLabel>Min completion (%)</FieldLabel>
            <input
              value={String(Math.round(draft.min * 100))}
              onChange={(e) =>
                setDraft((d) => ({ ...d, min: Math.min(1, Math.max(0, (Number(e.target.value) || 0) / 100)) }))
              }
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete this level? This will delete its missions too.")) return;
                setIsDeleting(true);
                try {
                  await onDelete();
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting || isSaving}
              className={cx(
                "rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-red-500/25 text-red-700 bg-red-500/10 hover:bg-red-500/15 transition",
                (isDeleting || isSaving) && "opacity-70 cursor-not-allowed",
              )}
            >
              {isDeleting ? "Deleting…" : "Delete level"}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    title: level.title ?? "",
                    order: level.order ?? 1,
                    min: typeof level.min_completion_ratio === "number" ? level.min_completion_ratio : 0.5,
                  })
                }
                disabled={!dirty || isSaving || isDeleting}
                className={cx(
                  "rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-black/10 bg-black/5 hover:bg-black/8 transition",
                  (!dirty || isSaving || isDeleting) && "opacity-60 cursor-not-allowed",
                )}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await onSave({
                      title: draft.title.trim(),
                      order: draft.order,
                      min_completion_ratio: draft.min,
                    });
                    setOpen(false);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={!dirty || isSaving || isDeleting || !draft.title.trim()}
                className={cx(
                  "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
                  !dirty || isSaving || isDeleting || !draft.title.trim()
                    ? "opacity-70 cursor-not-allowed bg-accent/70"
                    : "bg-accent hover:brightness-105 active:brightness-95",
                )}
              >
                {isSaving ? "Saving…" : "Save level"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-muted">
          Tip: change <span className="font-semibold">min completion</span> to control when a level is considered completed.
        </div>
      )}
    </div>
  );
}

