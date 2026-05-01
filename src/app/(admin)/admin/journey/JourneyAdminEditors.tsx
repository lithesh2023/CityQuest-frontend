"use client";

import { useEffect, useState } from "react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AdminLevel, AdminMission, AdminMissionUpdatePayload } from "@/app/(admin)/admin/journey/journeyAdminShared";
import { cx, FieldLabel, toTitleCase } from "@/app/(admin)/admin/journey/journeyAdminShared";

export function CreateMissionInline({
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

export function MissionEditor({
  mission,
  locationSlug,
  onSave,
  onDelete,
}: {
  mission: AdminMission;
  locationSlug: string;
  onSave: (payload: AdminMissionUpdatePayload) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: mission.title ?? "",
    description: mission.description ?? "",
    address: mission.address ?? "",
    image_key: mission.image_key,
    task_type: mission.task_type ?? "text",
    xp: typeof mission.xp === "number" ? mission.xp : 100,
    geo_enabled: Boolean(mission.geo_rule),
    geo_lat: mission.geo_rule?.lat != null ? String(mission.geo_rule.lat) : "",
    geo_lng: mission.geo_rule?.lng != null ? String(mission.geo_rule.lng) : "",
    geo_radius_m: mission.geo_rule?.radius_m != null ? String(mission.geo_rule.radius_m) : "150",
    min_accuracy_m: mission.min_accuracy_m != null ? String(mission.min_accuracy_m) : "",
    time_window_sec: mission.time_window_sec != null ? String(mission.time_window_sec) : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDraft({
      title: mission.title ?? "",
      description: mission.description ?? "",
      address: mission.address ?? "",
      image_key: mission.image_key,
      task_type: mission.task_type ?? "text",
      xp: typeof mission.xp === "number" ? mission.xp : 100,
      geo_enabled: Boolean(mission.geo_rule),
      geo_lat: mission.geo_rule?.lat != null ? String(mission.geo_rule.lat) : "",
      geo_lng: mission.geo_rule?.lng != null ? String(mission.geo_rule.lng) : "",
      geo_radius_m: mission.geo_rule?.radius_m != null ? String(mission.geo_rule.radius_m) : "150",
      min_accuracy_m: mission.min_accuracy_m != null ? String(mission.min_accuracy_m) : "",
      time_window_sec: mission.time_window_sec != null ? String(mission.time_window_sec) : "",
    });
  }, [mission]);

  const missionGeoEnabled = Boolean(mission.geo_rule);
  const missionGeoLat = mission.geo_rule?.lat != null ? String(mission.geo_rule.lat) : "";
  const missionGeoLng = mission.geo_rule?.lng != null ? String(mission.geo_rule.lng) : "";
  const missionGeoRadiusM = mission.geo_rule?.radius_m != null ? String(mission.geo_rule.radius_m) : "150";
  const missionMinAccuracyM = mission.min_accuracy_m != null ? String(mission.min_accuracy_m) : "";
  const missionTimeWindowSec = mission.time_window_sec != null ? String(mission.time_window_sec) : "";
  const missionImageKey = mission.image_key ?? "";

  const dirty =
    draft.title !== (mission.title ?? "") ||
    draft.description !== (mission.description ?? "") ||
    draft.address !== (mission.address ?? "") ||
    (draft.image_key ?? "") !== missionImageKey ||
    draft.task_type !== (mission.task_type ?? "text") ||
    draft.xp !== (typeof mission.xp === "number" ? mission.xp : 100) ||
    draft.geo_enabled !== missionGeoEnabled ||
    (draft.geo_enabled &&
      (draft.geo_lat !== missionGeoLat || draft.geo_lng !== missionGeoLng || draft.geo_radius_m !== missionGeoRadiusM)) ||
    draft.min_accuracy_m !== missionMinAccuracyM ||
    draft.time_window_sec !== missionTimeWindowSec;

  const signedImagePreview =
    mission.image_url && (draft.image_key ?? "") === missionImageKey ? mission.image_url : undefined;

  return (
    <div className="rounded-2xl bg-white/80 ring-1 ring-black/8 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {mission.image_url ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black/5 ring-1 ring-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mission.image_url} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{mission.title}</div>
            <div className="mt-0.5 text-[11px] text-muted break-all">{mission.id}</div>
          </div>
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

          <div className="md:col-span-2">
            <ImageUploadField
              label="Mission image"
              value={draft.image_key}
              locationSlug={locationSlug}
              previewUrl={signedImagePreview}
              onChange={(next) => setDraft((d) => ({ ...d, image_key: next }))}
              helpText="Uploads to the location admin_asset folder; save mission to persist file_key."
            />
          </div>

          <details className="md:col-span-2 rounded-2xl bg-black/2 ring-1 ring-black/8 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Geo validation</summary>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.geo_enabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDraft((d) => ({
                      ...d,
                      geo_enabled: checked,
                      geo_radius_m: checked ? d.geo_radius_m || "150" : d.geo_radius_m,
                    }));
                  }}
                />
                <span>Require user to be within a radius of the target location</span>
              </label>

              <div className={cx("grid gap-2 md:grid-cols-3", !draft.geo_enabled && "opacity-70")}>
                <label className="block">
                  <FieldLabel required>Latitude</FieldLabel>
                  <input
                    value={draft.geo_lat}
                    onChange={(e) => setDraft((d) => ({ ...d, geo_lat: e.target.value }))}
                    inputMode="decimal"
                    placeholder="12.9716"
                    disabled={!draft.geo_enabled}
                    className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <FieldLabel required>Longitude</FieldLabel>
                  <input
                    value={draft.geo_lng}
                    onChange={(e) => setDraft((d) => ({ ...d, geo_lng: e.target.value }))}
                    inputMode="decimal"
                    placeholder="77.5946"
                    disabled={!draft.geo_enabled}
                    className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed"
                  />
                </label>
                <label className="block">
                  <FieldLabel required>Radius (m)</FieldLabel>
                  <input
                    value={draft.geo_radius_m}
                    onChange={(e) => setDraft((d) => ({ ...d, geo_radius_m: e.target.value }))}
                    inputMode="numeric"
                    placeholder="150"
                    disabled={!draft.geo_enabled}
                    className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed"
                  />
                </label>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <label className="block">
                  <FieldLabel>Min accuracy (m)</FieldLabel>
                  <input
                    value={draft.min_accuracy_m}
                    onChange={(e) => setDraft((d) => ({ ...d, min_accuracy_m: e.target.value }))}
                    inputMode="numeric"
                    placeholder="e.g., 50"
                    disabled={!draft.geo_enabled}
                    className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
                <label className="block">
                  <FieldLabel>Time window (sec)</FieldLabel>
                  <input
                    value={draft.time_window_sec}
                    onChange={(e) => setDraft((d) => ({ ...d, time_window_sec: e.target.value }))}
                    inputMode="numeric"
                    placeholder="e.g., 600"
                    disabled={!draft.geo_enabled}
                    className="mt-1 w-full rounded-2xl bg-white/70 ring-1 ring-black/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </label>
              </div>
            </div>
          </details>

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
                  image_key: mission.image_key,
                  task_type: mission.task_type ?? "text",
                  xp: typeof mission.xp === "number" ? mission.xp : 100,
                  geo_enabled: Boolean(mission.geo_rule),
                  geo_lat: mission.geo_rule?.lat != null ? String(mission.geo_rule.lat) : "",
                  geo_lng: mission.geo_rule?.lng != null ? String(mission.geo_rule.lng) : "",
                  geo_radius_m: mission.geo_rule?.radius_m != null ? String(mission.geo_rule.radius_m) : "150",
                  min_accuracy_m: mission.min_accuracy_m != null ? String(mission.min_accuracy_m) : "",
                  time_window_sec: mission.time_window_sec != null ? String(mission.time_window_sec) : "",
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
                    const lat = Number(draft.geo_lat);
                    const lng = Number(draft.geo_lng);
                    const radiusM = Number(draft.geo_radius_m);
                    const minAcc = draft.min_accuracy_m.trim() ? Number(draft.min_accuracy_m) : undefined;
                    const tw = draft.time_window_sec.trim() ? Number(draft.time_window_sec) : undefined;

                    await onSave({
                      title: draft.title.trim(),
                      description: draft.description.trim() || undefined,
                      address: draft.address.trim() || undefined,
                      task_type: draft.task_type,
                      xp: draft.xp,
                      ...((mission.image_key ?? "") !== (draft.image_key ?? "")
                        ? { image_key: draft.image_key ?? null }
                        : {}),
                      ...(draft.geo_enabled
                        ? {
                            geo_rule: {
                              type: "radius_meters",
                              lat,
                              lng,
                              radius_m: radiusM,
                            },
                          }
                        : mission.geo_rule
                          ? { geo_rule: null }
                          : {}),
                      ...(minAcc !== undefined && !Number.isNaN(minAcc) ? { min_accuracy_m: minAcc } : { min_accuracy_m: undefined }),
                      ...(tw !== undefined && !Number.isNaN(tw) ? { time_window_sec: tw } : { time_window_sec: undefined }),
                    });
                    setOpen(false);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={
                  !dirty ||
                  isSaving ||
                  isDeleting ||
                  !draft.title.trim() ||
                  (draft.geo_enabled &&
                    (!draft.geo_lat.trim() ||
                      !draft.geo_lng.trim() ||
                      !draft.geo_radius_m.trim() ||
                      Number.isNaN(Number(draft.geo_lat)) ||
                      Number.isNaN(Number(draft.geo_lng)) ||
                      Number.isNaN(Number(draft.geo_radius_m))))
                }
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

export function CreateLevelInline({
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

export function LevelEditorInline({
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