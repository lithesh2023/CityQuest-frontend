"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { QuestLevel } from "@/lib/journeyDummy";
import { LevelBadge } from "@/components/LevelBadge";
import { ChevronRight } from "lucide-react";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function statusPill(status: QuestLevel["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20";
    case "in_progress":
      return "bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20";
    case "locked":
      return "bg-black/4 text-muted ring-1 ring-black/8";
  }
}

export function JourneyTimeline({ levels }: { levels: QuestLevel[] }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Your Journey</h1>
          <p className="mt-1 text-sm text-muted">The 52 Week Journey</p>
        </div>
        <div className="rounded-2xl bg-card ring-1 ring-black/8 px-3 py-2 text-right shadow-[0_10px_30px_rgba(109,40,217,0.10)]">
          <div className="text-[11px] text-muted">Unlock rule</div>
          <div className="text-sm font-semibold">
            <span className="text-accent">3</span> of <span className="text-muted">6</span>
          </div>
        </div>
      </header>

      <div className="mt-5">
        <div className="rounded-3xl bg-gradient-to-r from-accent to-indigo-600 p-[1px] shadow-[0_18px_60px_rgba(109,40,217,0.22)]">
          <div className="rounded-3xl bg-card px-5 py-4">
            <div className="text-xs text-muted">Week {levels.find((l) => l.status === "in_progress")?.levelNumber ?? 1} of 52</div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">
                Getting Around Bangalore
              </div>
              <div className="text-xs text-muted">
                {levels.reduce((acc, l) => acc + l.completedTasks, 0)} tasks done
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[56px_1fr] gap-4">
        <div className="relative">
          <div className="absolute left-7 top-1 bottom-1 w-px bg-gradient-to-b from-black/10 via-black/8 to-transparent" />
        </div>

        <div className="space-y-4">
          {levels.map((level) => (
            <LevelRow key={level.id} level={level} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelRow({ level }: { level: QuestLevel }) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const inView = useInView(ref, { margin: "-20% 0px -60% 0px" });

  const href = `/journey/week/${level.levelNumber}`;
  const disabled = level.status === "locked";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 14 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative"
    >
      <div className="absolute -left-[72px] top-0">
        <LevelBadge
          levelNumber={level.levelNumber}
          title={level.title}
          status={level.status}
          accent={level.accent}
        />
      </div>

      <Link
        ref={ref}
        href={disabled ? "/journey" : href}
        aria-disabled={disabled}
        className={cx(
          "block rounded-3xl border border-border bg-card px-4 py-4 shadow-[0_12px_36px_rgba(109,40,217,0.10)] transition",
          disabled
            ? "opacity-70 pointer-events-none"
            : "hover:shadow-[0_18px_60px_rgba(109,40,217,0.14)]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-muted">Level {level.levelNumber}</div>
            <div className="mt-0.5 text-base font-semibold tracking-tight truncate">
              {level.title}
            </div>
            <div className="mt-1 text-xs text-muted">{level.weekRangeLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cx(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                statusPill(level.status),
              )}
            >
              {level.status === "completed"
                ? "Completed"
                : level.status === "in_progress"
                  ? "In progress"
                  : "Locked"}
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted">
            {level.completedTasks}/{level.totalTasks} missions completed
          </div>
          <div className="h-2 w-24 rounded-full bg-black/5 ring-1 ring-black/8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-indigo-600"
              style={{
                width: `${Math.min(100, (level.completedTasks / Math.max(1, level.totalTasks)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

