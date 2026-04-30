"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { JourneyStageConfig } from "@/lib/journeyConfigTypes";
import { LevelBadge } from "@/components/LevelBadge";
import { ChevronLeft, Info, Lock } from "lucide-react";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function statusPill(status: JourneyStageConfig["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20";
    case "in_progress":
      return "bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20";
    case "locked":
      return "bg-black/4 text-muted ring-1 ring-black/8";
  }
}

function toTitleCase(input: string) {
  return input
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function JourneyTimeline({
  stages,
  locations,
  locationSlug,
  onChangeLocation,
}: {
  stages: JourneyStageConfig[];
  locations: Array<{ id: string; slug: string; name: string }>;
  locationSlug: string;
  onChangeLocation: (slug: string) => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-6">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-black/8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <div className="flex min-w-0 flex-col items-center gap-1">
          <h1 className="text-base font-semibold tracking-tight">Your Journey</h1>
          <label className="relative">
            <span className="sr-only">Select location</span>
            <select
              value={locationSlug}
              onChange={(e) => onChangeLocation(e.target.value)}
              className="h-8 max-w-[180px] cursor-pointer appearance-none rounded-full bg-card px-3 pr-7 text-xs font-semibold text-muted ring-1 ring-black/10 outline-none hover:bg-black/2 focus:ring-2 focus:ring-accent/40"
              aria-label="Select location"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.slug}>
                  {toTitleCase(l.name)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted">
              ▾
            </span>
          </label>
        </div>

        <button
          type="button"
          aria-label="Info"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card ring-1 ring-black/8"
        >
          <Info className="h-5 w-5 text-muted" />
        </button>
      </header>

      <div className="mt-3">
        <div className="text-sm font-semibold tracking-tight">The 52 Week Journey</div>
        <div className="mt-1 text-xs text-muted">
          Complete experiences, earn XP and level up!
        </div>
      </div>

      <div className="mt-4">
        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <StageRow
              key={stage.id}
              stage={stage}
              stageIndex={idx + 1}
              showConnector={idx !== stages.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StageRow({
  stage,
  stageIndex,
  showConnector,
}: {
  stage: JourneyStageConfig;
  stageIndex: number;
  showConnector: boolean;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const inView = useInView(ref, { margin: "-20% 0px -60% 0px" });

  const href = `/journey/stage/${stage.id}`;
  const disabled = stage.status === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 14 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative"
    >
      <div className="absolute left-0 top-0 bottom-0 w-12">
        <div className="absolute left-1 top-1">
          <div className="origin-top-left scale-[0.85]">
            <LevelBadge
              levelNumber={stageIndex}
              title={stage.title}
              status={stage.status}
              accent={stage.accent}
              variant="icon"
            />
          </div>
        </div>
        {showConnector ? (
          <div className="absolute left-7 top-[60px] bottom-0 w-px bg-gradient-to-b from-black/10 via-black/8 to-transparent" />
        ) : null}
      </div>

      <Link
        ref={ref}
        href={disabled ? "/journey" : href}
        aria-disabled={disabled}
        className={cx(
          "ml-12 block rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_10px_26px_rgba(109,40,217,0.08)] transition",
          disabled
            ? "opacity-70 pointer-events-none"
            : "hover:shadow-[0_16px_42px_rgba(109,40,217,0.12)]",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] leading-4 text-muted">
              Journey
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold tracking-tight">
              {stage.title}
            </div>
            <div className="mt-0.5 text-[11px] leading-4 text-muted">
              {stage.weeksLabel}
            </div>
          </div>

          {stage.status === "locked" ? (
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/4 ring-1 ring-black/8">
              <Lock className="h-4 w-4 text-muted" />
            </div>
          ) : (
            <div
              className={cx(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide",
                statusPill(stage.status),
              )}
            >
              {stage.status === "completed" ? "Completed" : "In progress"}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

