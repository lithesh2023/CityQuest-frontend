"use client";

import { useEffect, useMemo, useState } from "react";
import type { JourneyConfig, JourneyStageConfig } from "@/lib/journeyConfigTypes";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function setStageField(
  cfg: JourneyConfig,
  stageId: string,
  patch: Partial<JourneyStageConfig>,
): JourneyConfig {
  const next = clone(cfg);
  const s = next.stages.find((x) => x.id === stageId);
  if (!s) return cfg;
  Object.assign(s, patch);
  return next;
}

export default function JourneyAdminClient() {
  const [config, setConfig] = useState<JourneyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const stageCount = useMemo(() => config?.stages?.length ?? 0, [config]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/journey", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const json = (await res.json()) as JourneyConfig;
        if (!cancelled) setConfig(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/journey", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const json = (await res.json()) as JourneyConfig;
      setConfig(json);
      setSavedAt(new Date().toLocaleString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted">
        Loading journey config…
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-3xl bg-card ring-1 ring-black/8 p-5">
        <div className="text-sm font-semibold">Journey config</div>
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
            <div className="text-sm font-semibold">Journey configuration</div>
            <div className="mt-1 text-xs text-muted">
              {stageCount} stages • Updated {new Date(config.updatedAt).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedAt ? (
              <div className="text-[11px] text-muted">Saved {savedAt}</div>
            ) : null}
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className={cx(
                "rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition",
                "bg-accent hover:brightness-105 active:brightness-95",
                isSaving && "opacity-70 cursor-not-allowed",
              )}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {error ? (
          <div className="mt-3 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <div className="space-y-3">
        {config.stages.map((stage) => (
          <section
            key={stage.id}
            className="overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]"
          >
            <div className="px-5 py-4 border-b border-black/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted font-semibold">Stage</div>
                  <div className="mt-0.5 text-sm font-semibold truncate">
                    {stage.id}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-black/5 ring-1 ring-black/10 px-3 py-1.5 font-semibold">
                    {stage.status}
                  </span>
                  <span className="rounded-full bg-black/5 ring-1 ring-black/10 px-3 py-1.5 font-semibold">
                    {stage.accent}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="text-xs font-semibold text-muted">Title</div>
                  <input
                    value={stage.title}
                    onChange={(e) =>
                      setConfig((c) =>
                        c ? setStageField(c, stage.id, { title: e.target.value }) : c,
                      )
                    }
                    className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>

                <label className="block">
                  <div className="text-xs font-semibold text-muted">Weeks label</div>
                  <input
                    value={stage.weeksLabel}
                    onChange={(e) =>
                      setConfig((c) =>
                        c
                          ? setStageField(c, stage.id, { weeksLabel: e.target.value })
                          : c,
                      )
                    }
                    className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
              </div>

              <label className="block">
                <div className="text-xs font-semibold text-muted">Stage image URL</div>
                <input
                  value={stage.imageUrl ?? ""}
                  onChange={(e) =>
                    setConfig((c) =>
                      c
                        ? setStageField(c, stage.id, {
                            imageUrl: e.target.value.trim() || undefined,
                          })
                        : c,
                    )
                  }
                  placeholder="/images/metro.png"
                  className="mt-1 w-full rounded-2xl bg-white/60 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                />
                <div className="mt-1 text-[11px] text-muted">
                  Use a path under `public/` (e.g. `/images/metro.png`) or an absolute URL.
                </div>
              </label>

              <details className="rounded-2xl bg-black/2 ring-1 ring-black/8 p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Levels ({stage.levels.length})
                </summary>
                <div className="mt-4 space-y-4">
                  {stage.levels.map((lvl) => (
                    <div
                      key={lvl.id}
                      className="rounded-2xl bg-white/60 ring-1 ring-black/8 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">
                          Level {lvl.levelNumber}
                        </div>
                        <div className="text-xs text-muted">{lvl.id}</div>
                      </div>

                      <label className="block mt-3">
                        <div className="text-xs font-semibold text-muted">Level image URL</div>
                        <input
                          value={lvl.imageUrl ?? ""}
                          onChange={(e) => {
                            const v = e.target.value.trim() || undefined;
                            setConfig((c) => {
                              if (!c) return c;
                              const next = clone(c);
                              const s = next.stages.find((x) => x.id === stage.id);
                              const l = s?.levels.find((x) => x.id === lvl.id);
                              if (!l) return c;
                              l.imageUrl = v;
                              return next;
                            });
                          }}
                          placeholder="/images/metro.png"
                          className="mt-1 w-full rounded-2xl bg-white/80 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </label>

                      <details className="mt-3 rounded-2xl bg-black/2 ring-1 ring-black/8 p-3">
                        <summary className="cursor-pointer text-sm font-semibold">
                          Tasks ({lvl.tasks.length})
                        </summary>
                        <div className="mt-3 space-y-3">
                          {lvl.tasks.map((t) => (
                            <div
                              key={t.id}
                              className="rounded-2xl bg-white/80 ring-1 ring-black/8 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm font-semibold">{t.id}</div>
                                <div className="text-xs text-muted capitalize">
                                  {t.category}
                                  {typeof t.xp === "number" ? ` • ${t.xp} XP` : ""}
                                </div>
                              </div>

                              <label className="block mt-2">
                                <div className="text-xs font-semibold text-muted">Title</div>
                                <input
                                  value={t.title}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setConfig((c) => {
                                      if (!c) return c;
                                      const next = clone(c);
                                      const s = next.stages.find((x) => x.id === stage.id);
                                      const l = s?.levels.find((x) => x.id === lvl.id);
                                      const task = l?.tasks.find((x) => x.id === t.id);
                                      if (!task) return c;
                                      task.title = v;
                                      if (typeof (task as { completed?: unknown }).completed !== "boolean") {
                                        (task as unknown as { completed: boolean }).completed = false;
                                      }
                                      return next;
                                    });
                                  }}
                                  className="mt-1 w-full rounded-2xl bg-white ring-1 ring-black/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                                />
                              </label>

                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <label className="block">
                                  <div className="text-xs font-semibold text-muted">XP</div>
                                  <input
                                    value={t.xp ?? ""}
                                    onChange={(e) => {
                                      const raw = e.target.value.trim();
                                      const xp = raw === "" ? undefined : Number(raw);
                                      setConfig((c) => {
                                        if (!c) return c;
                                        const next = clone(c);
                                        const s = next.stages.find((x) => x.id === stage.id);
                                        const l = s?.levels.find((x) => x.id === lvl.id);
                                        const task = l?.tasks.find((x) => x.id === t.id);
                                        if (!task) return c;
                                        task.xp = Number.isFinite(xp as number) ? (xp as number) : undefined;
                                        return next;
                                      });
                                    }}
                                    inputMode="numeric"
                                    placeholder="100"
                                    className="mt-1 w-full rounded-2xl bg-white ring-1 ring-black/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                                  />
                                </label>

                                <label className="block">
                                  <div className="text-xs font-semibold text-muted">Task image URL</div>
                                  <input
                                    value={t.imageUrl ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value.trim() || undefined;
                                      setConfig((c) => {
                                        if (!c) return c;
                                        const next = clone(c);
                                        const s = next.stages.find((x) => x.id === stage.id);
                                        const l = s?.levels.find((x) => x.id === lvl.id);
                                        const task = l?.tasks.find((x) => x.id === t.id);
                                        if (!task) return c;
                                        task.imageUrl = v;
                                        return next;
                                      });
                                    }}
                                    placeholder="/images/metro.png"
                                    className="mt-1 w-full rounded-2xl bg-white ring-1 ring-black/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                                  />
                                </label>
                              </div>

                              <label className="block mt-2">
                                <div className="text-xs font-semibold text-muted">
                                  Task gallery URLs (comma separated)
                                </div>
                                <input
                                  value={(t.galleryUrls ?? []).join(", ")}
                                  onChange={(e) => {
                                    const urls = e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean);
                                    setConfig((c) => {
                                      if (!c) return c;
                                      const next = clone(c);
                                      const s = next.stages.find((x) => x.id === stage.id);
                                      const l = s?.levels.find((x) => x.id === lvl.id);
                                      const task = l?.tasks.find((x) => x.id === t.id);
                                      if (!task) return c;
                                      task.galleryUrls = urls;
                                      return next;
                                    });
                                  }}
                                  placeholder="/images/a.png, /images/b.png"
                                  className="mt-1 w-full rounded-2xl bg-white ring-1 ring-black/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                                />
                              </label>
                            </div>
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

      <details className="rounded-3xl bg-card ring-1 ring-black/8 p-5">
        <summary className="cursor-pointer text-sm font-semibold">Raw JSON</summary>
        <textarea
          value={JSON.stringify(config, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value) as JourneyConfig;
              setConfig(parsed);
              setError(null);
            } catch {
              setError("Invalid JSON");
            }
          }}
          spellCheck={false}
          className="mt-4 h-[420px] w-full rounded-2xl bg-black/90 text-white font-mono text-xs ring-1 ring-black/20 px-4 py-3 outline-none"
        />
      </details>
    </div>
  );
}

