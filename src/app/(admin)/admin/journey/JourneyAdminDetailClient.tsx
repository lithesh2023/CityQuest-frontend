"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AdminJourney, AdminJourneysResponse, AdminMissionUpdatePayload } from "@/app/(admin)/admin/journey/journeyAdminShared";
import { FieldLabel, titleCaseId } from "@/app/(admin)/admin/journey/journeyAdminShared";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  CreateLevelInline,
  CreateMissionInline,
  LevelEditorInline,
  MissionEditor,
} from "@/app/(admin)/admin/journey/JourneyAdminEditors";

export default function JourneyAdminDetailClient({ journeyId }: { journeyId: string }) {
  const searchParams = useSearchParams();
  const locationSlug = searchParams.get("location")?.trim() ?? "";

  const [journey, setJourney] = useState<AdminJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingJourney, setIsSavingJourney] = useState(false);

  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    weeks_label: string;
    accent: string;
    status: string;
    order: number;
    image_key?: string;
  }>({
    title: "",
    description: "",
    weeks_label: "",
    accent: "",
    status: "active",
    order: 1,
    image_key: undefined,
  });

  const listHref = locationSlug ? `/admin/journey?location=${encodeURIComponent(locationSlug)}` : "/admin/journey";

  const loadJourney = useCallback(async () => {
    if (!locationSlug) {
      setError("Add a location to the URL, e.g. ?location=bangalore");
      setLoading(false);
      setJourney(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journeys?location=${encodeURIComponent(locationSlug)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load journeys (${res.status})`);
      const json = (await res.json()) as AdminJourneysResponse;
      const j = json.journeys.find((x) => x.id === journeyId) ?? null;
      setJourney(j);
      if (j) {
        setDraft({
          title: j.title ?? "",
          description: j.description ?? "",
          weeks_label: j.weeks_label ?? "",
          accent: j.accent ?? "",
          status: j.status ?? "active",
          order: typeof j.order === "number" ? j.order : 1,
          image_key: j.image_key,
        });
      }
      if (!j) setError("This journey was not found for the selected location.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setJourney(null);
    } finally {
      setLoading(false);
    }
  }, [journeyId, locationSlug]);

  useEffect(() => {
    void loadJourney();
  }, [loadJourney]);

  async function createMission(levelId: string, payload: { title: string; task_type?: string; xp?: number; description?: string; address?: string }) {
    setError(null);
    const res = await fetch(`/api/admin/levels/${encodeURIComponent(levelId)}/missions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create mission failed (${res.status})`);
    await loadJourney();
  }

  async function updateMission(missionId: string, payload: AdminMissionUpdatePayload) {
    setError(null);
    const res = await fetch(`/api/admin/missions/${encodeURIComponent(missionId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Save mission failed (${res.status})`);
    await loadJourney();
  }

  async function deleteMission(missionId: string) {
    setError(null);
    const res = await fetch(`/api/admin/missions/${encodeURIComponent(missionId)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete mission failed (${res.status})`);
    await loadJourney();
  }

  async function createLevel(jId: string, payload: { title: string; order?: number; min_completion_ratio?: number }) {
    setError(null);
    const res = await fetch(`/api/admin/journeys/${encodeURIComponent(jId)}/levels`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create level failed (${res.status})`);
    await loadJourney();
  }

  async function updateLevel(levelId: string, payload: { title?: string; order?: number; min_completion_ratio?: number }) {
    setError(null);
    const res = await fetch(`/api/admin/levels/${encodeURIComponent(levelId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Save level failed (${res.status})`);
    await loadJourney();
  }

  async function deleteLevel(levelId: string) {
    setError(null);
    const res = await fetch(`/api/admin/levels/${encodeURIComponent(levelId)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`Delete level failed (${res.status})`);
    await loadJourney();
  }

  if (!locationSlug && !loading) {
    return (
      <div className="space-y-4">
        <Link href="/admin/journey" className="text-xs font-semibold text-muted hover:text-foreground transition">
          ← Back to journeys
        </Link>
        <div className="rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25 px-4 py-3 text-sm text-amber-900">
          Open this page from the journey list (Edit link includes the location), or add{" "}
          <span className="font-mono text-xs">?location=your-city-slug</span> to the URL.
        </div>
      </div>
    );
  }

  if (loading || (!journey && !error)) {
    return (
      <div className="space-y-4">
        <Link href={listHref} className="text-xs font-semibold text-muted hover:text-foreground transition">
          ← Back to journeys
        </Link>
        <div className="text-sm text-muted">Loading journey…</div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="space-y-4">
        <Link href={listHref} className="text-xs font-semibold text-muted hover:text-foreground transition">
          ← Back to journeys
        </Link>
        {error ? (
          <div className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
      </div>
    );
  }

  const j = journey;
  const dirty =
    draft.title.trim() !== (j.title ?? "") ||
    (draft.description.trim() || "") !== (j.description ?? "") ||
    (draft.weeks_label.trim() || "") !== (j.weeks_label ?? "") ||
    (draft.accent.trim() || "") !== (j.accent ?? "") ||
    (draft.status || "active") !== (j.status ?? "active") ||
    (Number(draft.order) || 1) !== (j.order ?? 1) ||
    (draft.image_key ?? "") !== (j.image_key ?? "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Link href={listHref} className="text-xs font-semibold text-muted hover:text-foreground transition">
            ← Back to journeys
          </Link>
          <h1 className="text-lg font-semibold tracking-tight truncate">{j.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span>v{j.version}</span>
            <span aria-hidden="true">•</span>
            <span>{j.status ?? "active"}</span>
            {j.is_current ? (
              <span className="rounded-full bg-accent/15 text-accent ring-1 ring-accent/25 px-2 py-0.5 font-semibold">
                Current
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-muted font-mono break-all">{j.id}</div>
          <div className="text-xs text-muted">
            Location: <span className="font-semibold text-foreground">{titleCaseId(locationSlug)}</span>
          </div>
        </div>
        {j.image_url ? (
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={j.image_url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
      </div>

      {error ? <div className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.06)] p-5 md:p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Edit journey</h2>
            <p className="mt-1 text-xs text-muted">Update fields, then click Save journey.</p>
          </div>
          <button
            type="button"
            disabled={!dirty || isSavingJourney}
            onClick={async () => {
              setIsSavingJourney(true);
              setError(null);
              try {
                const payload: Record<string, unknown> = {};
                if (draft.title.trim() !== (j.title ?? "")) payload.title = draft.title.trim();

                const desc = draft.description.trim();
                if ((j.description ?? "") !== desc) payload.description = desc || null;

                const wl = draft.weeks_label.trim();
                if ((j.weeks_label ?? "") !== wl) payload.weeks_label = wl || null;

                const acc = draft.accent.trim();
                if ((j.accent ?? "") !== acc) payload.accent = acc || null;

                const st = (draft.status || "active").trim();
                if ((j.status ?? "active") !== st) payload.status = st;

                const ord = Number(draft.order) || 1;
                if ((j.order ?? 1) !== ord) payload.order = ord;

                if ((draft.image_key ?? "") !== (j.image_key ?? "")) payload.image_key = draft.image_key ?? null;

                const res = await fetch(`/api/admin/journeys/${encodeURIComponent(journeyId)}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(`Save journey failed (${res.status})`);
                await loadJourney();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Save journey failed");
              } finally {
                setIsSavingJourney(false);
              }
            }}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
              !dirty || isSavingJourney ? "opacity-70 cursor-not-allowed bg-accent/70" : "bg-accent hover:brightness-105 active:brightness-95",
            ].join(" ")}
          >
            {isSavingJourney ? "Saving…" : "Save journey"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <FieldLabel required>Title</FieldLabel>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <FieldLabel>Weeks label</FieldLabel>
            <input
              value={draft.weeks_label}
              onChange={(e) => setDraft((d) => ({ ...d, weeks_label: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <FieldLabel>Accent</FieldLabel>
            <input
              value={draft.accent}
              onChange={(e) => setDraft((d) => ({ ...d, accent: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="e.g. green / amber / purple"
            />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="draft">draft</option>
            </select>
          </div>
          <div>
            <FieldLabel>Order</FieldLabel>
            <input
              value={String(draft.order)}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 1 }))}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <FieldLabel>Journey image</FieldLabel>
            <div className="mt-2">
              <ImageUploadField
                label="Upload"
                value={draft.image_key}
                previewUrl={j.image_url}
                locationSlug={locationSlug}
                onChange={(next) => setDraft((d) => ({ ...d, image_key: next }))}
                helpText="Upload a new journey image and click Save journey."
                disabled={isSavingJourney}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Levels & missions</h2>
          <p className="mt-1 text-xs text-muted">Expand each level to add or edit missions.</p>

          <div className="mt-5 space-y-4">
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
              <div key={lvl.id} className="rounded-2xl bg-white/60 ring-1 ring-black/8 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold">
                    {j.title}: Level {lvl.order}
                  </div>
                  <div className="text-xs text-muted font-mono">{lvl.id}</div>
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

                <details className="mt-4 rounded-2xl bg-black/2 ring-1 ring-black/8 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">Missions ({lvl.missions.length})</summary>
                  <div className="mt-4 space-y-3">
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
                        locationSlug={locationSlug}
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
        </div>
      </section>
    </div>
  );
}
