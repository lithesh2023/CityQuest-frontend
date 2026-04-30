"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminLocation = { id: string; slug: string; name: string };

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeSlug(v: string) {
  return v
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LocationsAdminClient() {
  const [items, setItems] = useState<AdminLocation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createSlug, setCreateSlug] = useState("");
  const [createName, setCreateName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selected = useMemo(() => items.find((l) => l.id === selectedId) ?? null, [items, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((l) => l.slug.toLowerCase().includes(q) || l.name.toLowerCase().includes(q));
  }, [items, query]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/locations", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load locations (${res.status})`);
      const json = (await res.json()) as { items: AdminLocation[] };
      const next = json.items ?? [];
      setItems(next);
      if (!selectedId && next[0]?.id) setSelectedId(next[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate() {
    const slug = normalizeSlug(createSlug);
    const name = createName.trim();
    if (!slug || !name) {
      setError("Please provide both slug and name.");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, name }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Create failed (${res.status}) ${text}`.trim());
      }
      setCreateSlug("");
      setCreateName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setIsCreating(false);
    }
  }

  async function onSaveEdits(next: { id: string; slug: string; name: string }) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/locations/${encodeURIComponent(next.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: normalizeSlug(next.slug), name: next.name.trim() }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}) ${text}`.trim());
      }
      const updated = (await res.json()) as AdminLocation;
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted">Loading locations…</div>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.08)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Locations</div>
            <div className="mt-1 text-xs text-muted">
              Create new locations, rename them, or update slugs. Locations are used to group journey configurations.
            </div>
          </div>
          <Link
            href="/admin/journey"
            className="rounded-2xl px-3 py-2 text-sm font-semibold bg-black/5 ring-1 ring-black/10 hover:bg-black/8 transition"
          >
            Open Journey Config
          </Link>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl bg-white/60 ring-1 ring-black/8 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-muted">All locations</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-9 w-44 rounded-2xl bg-white/70 ring-1 ring-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="mt-3 space-y-2">
              {filtered.map((l) => {
                const active = l.id === selectedId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelectedId(l.id)}
                    className={cx(
                      "w-full text-left rounded-2xl px-3 py-2 ring-1 transition",
                      active
                        ? "bg-accent/10 ring-accent/20"
                        : "bg-card ring-black/8 hover:bg-black/2 hover:ring-black/12",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{l.name}</div>
                        <div className="mt-0.5 truncate text-[11px] text-muted">/{l.slug}</div>
                      </div>
                      <div className="shrink-0 rounded-full bg-black/4 px-2 py-1 text-[10px] font-semibold text-muted ring-1 ring-black/8">
                        {l.slug}
                      </div>
                    </div>
                  </button>
                );
              })}
              {!filtered.length ? <div className="text-sm text-muted">No matching locations.</div> : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl bg-white/60 ring-1 ring-black/8 p-4">
              <div className="text-xs font-semibold text-muted">Create location</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Name (e.g., Bangalore)"
                  className="h-10 rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                />
                <input
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  placeholder="Slug (e.g., bangalore)"
                  className="h-10 rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-muted">
                    Slugs must be unique and URL-safe (letters/numbers/hyphens).
                  </div>
                  <button
                    type="button"
                    onClick={onCreate}
                    disabled={isCreating}
                    className={cx(
                      "inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
                      isCreating ? "opacity-70 cursor-not-allowed" : "hover:brightness-105 active:brightness-95",
                    )}
                  >
                    {isCreating ? "Creating…" : "Create"}
                  </button>
                </div>
              </div>
            </div>

            <EditLocationCard key={selected?.id ?? "none"} location={selected} onSave={onSaveEdits} />
          </div>
        </div>
      </section>
    </div>
  );
}

function EditLocationCard({
  location,
  onSave,
}: {
  location: AdminLocation | null;
  onSave: (loc: AdminLocation) => Promise<void>;
}) {
  const [draft, setDraft] = useState<AdminLocation | null>(location);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(location);
  }, [location]);

  const dirty = !!draft && !!location && (draft.name !== location.name || draft.slug !== location.slug);

  if (!draft) {
    return (
      <div className="rounded-3xl bg-white/60 ring-1 ring-black/8 p-4">
        <div className="text-xs font-semibold text-muted">Edit location</div>
        <div className="mt-3 text-sm text-muted">Select a location to edit.</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white/60 ring-1 ring-black/8 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted">Edit location</div>
        <Link
          href={`/admin/journey?location=${encodeURIComponent(draft.slug)}`}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Manage journeys →
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <div>
          <div className="text-[11px] font-semibold text-muted">Name</div>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="mt-1 h-10 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-muted">Slug</div>
          <input
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            className="mt-1 h-10 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
          <div className="mt-1 text-[11px] text-muted">
            Changing slug affects URLs (e.g., location selector). Journeys remain linked by location ID.
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setDraft(location)}
            disabled={!dirty || isSaving}
            className={cx(
              "rounded-2xl px-3 py-2 text-sm font-semibold ring-1 ring-black/10 transition",
              !dirty || isSaving ? "opacity-60 cursor-not-allowed bg-black/2" : "bg-black/5 hover:bg-black/8",
            )}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={async () => {
              setIsSaving(true);
              try {
                await onSave({ ...draft, name: draft.name.trim(), slug: draft.slug.trim() });
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={!dirty || isSaving}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
              !dirty || isSaving
                ? "opacity-70 cursor-not-allowed bg-accent/70"
                : "bg-accent hover:brightness-105 active:brightness-95",
            )}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

