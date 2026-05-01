"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminLocation, AdminJourney, AdminJourneysResponse } from "@/app/(admin)/admin/journey/journeyAdminShared";
import { JourneyOrderInline, titleCaseId } from "@/app/(admin)/admin/journey/journeyAdminShared";

export default function JourneyAdminClient() {
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");
  const [journeys, setJourneys] = useState<AdminJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingJourneyOrderId, setSavingJourneyOrderId] = useState<string | null>(null);

  const selectedLocationName = useMemo(() => {
    return locations.find((l) => l.slug === selectedLocationSlug)?.name ?? titleCaseId(selectedLocationSlug);
  }, [locations, selectedLocationSlug]);

  const sortedJourneys = useMemo(() => {
    return [...journeys].sort((a, b) => {
      const ao = typeof a.order === "number" ? a.order : 0;
      const bo = typeof b.order === "number" ? b.order : 0;
      if (ao !== bo) return ao - bo;
      if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
      return (b.version ?? 0) - (a.version ?? 0);
    });
  }, [journeys]);

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

        // Keep spinner until journeys load when we have a location to fetch.
        if (!cancelled && (!preferred || nextLocations.length === 0)) {
          setIsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load locations");
          setIsLoading(false);
        }
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

  async function updateJourneyOrder(journeyId: string, order: number) {
    setError(null);
    setSavingJourneyOrderId(journeyId);
    try {
      const res = await fetch(`/api/admin/journeys/${encodeURIComponent(journeyId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error(`Save journey order failed (${res.status})`);
      await refreshJourneys();
    } finally {
      setSavingJourneyOrderId((cur) => (cur === journeyId ? null : cur));
    }
  }

  if (isLoading && !selectedLocationSlug && locations.length === 0) {
    return (
      <div className="text-sm text-muted">
        Loading journeys…
      </div>
    );
  }

  if (!selectedLocationSlug) {
    return (
      <div className="rounded-3xl bg-card ring-1 ring-black/8 p-5 md:p-6">
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
          <div className="mt-1 text-[11px] text-muted">Select a location to manage journeys.</div>
        </div>
        <div className="mt-2 text-sm text-muted">No location available yet.</div>
        {error ? <div className="mt-3 text-xs text-red-600">{error}</div> : null}
      </div>
    );
  }

  const createHref = `/admin/journey/new?location=${encodeURIComponent(selectedLocationSlug)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Journeys</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-foreground">{selectedLocationName}</span>
            <span className="mx-1.5 text-muted">·</span>
            {sortedJourneys.length} {sortedJourneys.length === 1 ? "journey" : "journeys"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-2xl bg-white/60 ring-1 ring-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40 min-w-[140px]"
            value={selectedLocationSlug}
            onChange={(e) => setSelectedLocationSlug(e.target.value)}
            aria-label="Select location"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
          <Link
            href={createHref}
            className="inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition hover:brightness-105 active:brightness-95"
          >
            Create journey
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted py-8 text-center rounded-3xl bg-card ring-1 ring-black/8">
          Loading journeys…
        </div>
      ) : sortedJourneys.length === 0 ? (
        <div className="rounded-3xl bg-card ring-1 ring-black/8 p-10 text-center">
          <p className="text-sm text-muted">No journeys for this location yet.</p>
          <Link
            href={createHref}
            className="mt-4 inline-flex rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition hover:brightness-105"
          >
            Create your first journey
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.06)] divide-y divide-black/[0.06]">
          {sortedJourneys.map((j) => (
            <div
              key={j.id}
              className="flex flex-wrap items-center gap-4 p-4 md:p-5 transition hover:bg-black/[0.02]"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/10">
                {j.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={j.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted">
                    CQ
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm truncate">{j.title}</span>
                  {j.is_current ? (
                    <span className="shrink-0 rounded-full bg-accent/15 text-accent ring-1 ring-accent/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Current
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                  <JourneyOrderInline
                    key={`${j.id}:${j.order}`}
                    journeyId={j.id}
                    order={j.order}
                    disabled={Boolean(savingJourneyOrderId)}
                    isSaving={savingJourneyOrderId === j.id}
                    onSave={async (nextOrder) => {
                      try {
                        await updateJourneyOrder(j.id, nextOrder);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Save journey order failed");
                      }
                    }}
                  />
                  <span aria-hidden="true">·</span>
                  <span>{j.levels.length} levels</span>
                  <span aria-hidden="true">·</span>
                  <span>v{j.version}</span>
                  <span aria-hidden="true">·</span>
                  <span>{j.status ?? "active"}</span>
                </div>
                {j.weeks_label ? (
                  <div className="mt-1 text-[11px] text-muted line-clamp-1">{j.weeks_label}</div>
                ) : null}
              </div>

              <Link
                href={`/admin/journey/${encodeURIComponent(j.id)}?location=${encodeURIComponent(selectedLocationSlug)}`}
                className="shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold ring-1 ring-black/10 bg-white/70 hover:bg-white transition"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
