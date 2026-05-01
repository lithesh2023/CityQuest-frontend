"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AdminLocation } from "@/app/(admin)/admin/journey/journeyAdminShared";
import { cx, FieldLabel, titleCaseId } from "@/app/(admin)/admin/journey/journeyAdminShared";

export default function JourneyAdminCreateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationFromUrl = searchParams.get("location")?.trim() ?? "";

  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [weeksLabel, setWeeksLabel] = useState("");
  const [accent, setAccent] = useState("");
  const [status, setStatus] = useState("active");
  const [defaultLevels, setDefaultLevels] = useState<number>(5);
  const [imageKey, setImageKey] = useState<string | undefined>(undefined);

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
        const exists = (slug: string) => nextLocations.some((l) => l.slug === slug);
        const preferred =
          (locationFromUrl && exists(locationFromUrl) ? locationFromUrl : "") ||
          (nextLocations[0]?.slug ?? "");
        setSelectedLocationSlug(preferred);
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
  }, [locationFromUrl]);

  useEffect(() => {
    let cancelled = false;
    async function loadSuggestedOrder() {
      if (!selectedLocationSlug) return;
      try {
        const res = await fetch(`/api/admin/journeys?location=${encodeURIComponent(selectedLocationSlug)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { journeys?: Array<{ order?: number }> };
        if (cancelled) return;
        const max = (json.journeys ?? []).reduce((m, j) => (typeof j.order === "number" ? Math.max(m, j.order) : m), 0);
        setOrder(max + 1);
      } catch {
        /* ignore */
      }
    }
    void loadSuggestedOrder();
    return () => {
      cancelled = true;
    };
  }, [selectedLocationSlug]);

  async function onCreate() {
    if (!selectedLocationSlug || !title.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/journeys?location=${encodeURIComponent(selectedLocationSlug)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          order,
          description: description.trim() || undefined,
          weeks_label: weeksLabel.trim() || undefined,
          accent: accent.trim() || undefined,
          image_key: imageKey,
          status,
          default_levels: defaultLevels,
        }),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
      const json = (await res.json()) as { id?: string };
      if (json.id) {
        router.push(`/admin/journey/${encodeURIComponent(json.id)}?location=${encodeURIComponent(selectedLocationSlug)}`);
        return;
      }
      router.push(`/admin/journey?location=${encodeURIComponent(selectedLocationSlug)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={selectedLocationSlug ? `/admin/journey?location=${encodeURIComponent(selectedLocationSlug)}` : "/admin/journey"}
            className="text-xs font-semibold text-muted hover:text-foreground transition"
          >
            ← Back to journeys
          </Link>
          <h1 className="mt-2 text-lg font-semibold tracking-tight">Create journey</h1>
          <p className="mt-1 text-sm text-muted">
            Adds a new journey version for <span className="font-semibold text-foreground">{selectedLocationName}</span> and marks
            it current.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.06)] p-5 md:p-6">
        <div className="text-xs font-semibold text-muted mb-4">Location</div>
        <select
          className="w-full max-w-md rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
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

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="block">
            <FieldLabel required>Title</FieldLabel>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>

          <label className="block">
            <FieldLabel required>Order</FieldLabel>
            <input
              value={String(order)}
              onChange={(e) => setOrder(Number(e.target.value) || 1)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="1 = first journey"
            />
            <div className="mt-1 text-[11px] text-muted">Lower numbers appear first in the app timeline.</div>
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

          <label className="block">
            <FieldLabel>Default levels</FieldLabel>
            <input
              value={String(defaultLevels)}
              onChange={(e) => setDefaultLevels(Number(e.target.value) || 5)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            />
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
        </div>

        <div className="mt-6 border-t border-black/6 pt-6">
          <ImageUploadField
            label="Journey image"
            value={imageKey}
            locationSlug={selectedLocationSlug}
            onChange={setImageKey}
            helpText="Uploads to admin_asset for the selected location and stores the returned file_key."
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-2">
          <Link
            href={selectedLocationSlug ? `/admin/journey?location=${encodeURIComponent(selectedLocationSlug)}` : "/admin/journey"}
            className="rounded-2xl px-4 py-2 text-sm font-semibold ring-1 ring-black/10 bg-black/5 hover:bg-black/8 transition"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={isCreating || !title.trim() || !Number.isFinite(order) || order < 1 || !selectedLocationSlug}
            onClick={() => void onCreate()}
            className={cx(
              "rounded-2xl px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
              "bg-accent hover:brightness-105 active:brightness-95",
              (isCreating || !title.trim() || !Number.isFinite(order) || order < 1 || !selectedLocationSlug) &&
                "opacity-70 cursor-not-allowed",
            )}
          >
            {isCreating ? "Creating…" : "Create journey"}
          </button>
        </div>
      </section>
    </div>
  );
}
