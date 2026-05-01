"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AdminJourney, AdminJourneysResponse, AdminMissionUpdatePayload } from "@/app/(admin)/admin/journey/journeyAdminShared";
import { FieldLabel, JourneyOrderInline, titleCaseId } from "@/app/(admin)/admin/journey/journeyAdminShared";
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
  const [savingOrderId, setSavingOrderId] = useState(false);

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

  async function updateJourneyOrder(order: number) {
    setSavingOrderId(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journeys/${encodeURIComponent(journeyId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error(`Save journey order failed (${res.status})`);
      await loadJourney();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save journey order failed");
    } finally {
      setSavingOrderId(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Link href={listHref} className="text-xs font-semibold text-muted hover:text-foreground transition">
            ← Back to journeys
          </Link>
          <h1 className="text-lg font-semibold tracking-tight truncate">{j.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <JourneyOrderInline
              key={`${j.id}:${j.order}`}
              journeyId={j.id}
              order={j.order}
              disabled={savingOrderId}
              isSaving={savingOrderId}
              onSave={updateJourneyOrder}
            />
            <span aria-hidden="true">•</span>
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Description</FieldLabel>
            <div className="mt-1 text-sm">{j.description ?? <span className="text-muted">—</span>}</div>
          </div>
          <div>
            <FieldLabel>Weeks label</FieldLabel>
            <div className="mt-1 text-sm">{j.weeks_label ?? <span className="text-muted">—</span>}</div>
          </div>
          <div>
            <FieldLabel>Accent</FieldLabel>
            <div className="mt-1 text-sm">{j.accent ?? <span className="text-muted">—</span>}</div>
          </div>
          <div>
            <FieldLabel>Journey image</FieldLabel>
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
