"use client";

import { useState } from "react";

export type AdminLocation = { id: string; slug: string; name: string };

export type AdminMission = {
  id: string;
  title: string;
  description?: string;
  address?: string;
  task_type?: string;
  xp?: number;
  geo_rule?: { type: "radius_meters"; lat: number; lng: number; radius_m: number };
  min_accuracy_m?: number;
  time_window_sec?: number;
  image_key?: string;
  image_url?: string;
  gallery_keys?: string[];
  gallery_urls?: string[];
};

export type AdminMissionUpdatePayload = Partial<
  Pick<
    AdminMission,
    "title" | "description" | "address" | "task_type" | "xp" | "min_accuracy_m" | "time_window_sec"
  >
> & { geo_rule?: AdminMission["geo_rule"] | null; image_key?: string | null };

export type AdminLevel = {
  id: string;
  title: string;
  order: number;
  min_completion_ratio?: number;
  image_key?: string;
  image_url?: string;
  missions: AdminMission[];
};

export type AdminJourney = {
  id: string;
  title: string;
  order: number;
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

export type AdminJourneysResponse = {
  location: AdminLocation;
  journeys: AdminJourney[];
};

export function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function titleCaseId(id: string) {
  return String(id)
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="text-xs font-semibold text-muted">
      {children}
      {required ? (
        <span className="ml-1 text-red-600" aria-hidden="true">
          *
        </span>
      ) : null}
    </div>
  );
}

export function toTitleCase(input: string) {
  return input
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function JourneyOrderInline(props: {
  journeyId?: string;
  order: number;
  disabled?: boolean;
  isSaving?: boolean;
  onSave: (order: number) => Promise<void>;
}) {
  const [value, setValue] = useState<string>(String(props.order));
  const [open, setOpen] = useState(false);

  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed >= 1;
  const dirty = value.trim() !== String(props.order);

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="font-semibold">Order</span>{" "}
      {!open ? (
        <>
          <span>{props.order}</span>
          <button
            type="button"
            disabled={props.disabled}
            onClick={() => setOpen(true)}
            className={cx(
              "ml-1 rounded-full bg-black/4 px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-black/8 hover:bg-black/6 transition",
              props.disabled && "opacity-70 cursor-not-allowed",
            )}
          >
            Edit
          </button>
        </>
      ) : (
        <>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            className="w-16 rounded-xl bg-white/70 ring-1 ring-black/10 px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="button"
            disabled={props.isSaving}
            onClick={() => {
              setValue(String(props.order));
              setOpen(false);
            }}
            className={cx(
              "rounded-full bg-black/4 px-2 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-black/8 hover:bg-black/6 transition",
              props.isSaving && "opacity-70 cursor-not-allowed",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!dirty || !valid || props.isSaving}
            onClick={async () => {
              await props.onSave(Math.trunc(parsed));
              setOpen(false);
            }}
            className={cx(
              "rounded-full bg-accent/15 text-accent ring-1 ring-accent/25 px-2 py-0.5 text-[11px] font-semibold transition",
              !dirty || !valid || props.isSaving ? "opacity-60 cursor-not-allowed" : "hover:brightness-105 active:brightness-95",
            )}
          >
            {props.isSaving ? "Saving…" : "Save"}
          </button>
        </>
      )}
    </span>
  );
}
