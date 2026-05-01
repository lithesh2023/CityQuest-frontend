"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Info, Lock } from "lucide-react";
import type { JourneyLevelConfig, JourneyStageConfig } from "@/lib/journeyConfigTypes";
import { getCompletedTaskIds, isTaskCompleted } from "@/lib/journeyProgress";

export default function StageLevelMissionsClient({
  stage,
  level,
}: {
  stage: JourneyStageConfig;
  level: JourneyLevelConfig;
}) {
  const [completedIds] = useState<Set<string>>(() => getCompletedTaskIds());

  const isLocked = stage.status === "locked";
  const tasks = level.tasks;
  const completed = tasks.filter((t) => isTaskCompleted(t, completedIds)).length;
  const total = tasks.length || 6;
  const pct = Math.round((completed / Math.max(1, total)) * 100);

  const firstIncompleteIdx = useMemo(() => {
    const idx = tasks.findIndex((t) => !isTaskCompleted(t, completedIds));
    return Math.max(0, idx);
  }, [tasks, completedIds]);

  const hero = level.imageUrl || stage.imageUrl || "/images/metro.png";

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-8">
      <header className="flex items-center justify-between">
        <Link
          href={`/journey/stage/${stage.id}`}
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="text-sm font-semibold">
          {stage.title} • Level {level.levelNumber}
        </div>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Info"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.12)]">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{stage.title} roadmap</div>
              <div className="mt-1 text-xs text-muted">
                Complete missions to level up. A level completes at 3 / 6.
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="text-accent-2">{completed}</span> / {total} missions completed
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5 ring-1 ring-black/8">
                <div className="h-full rounded-full bg-accent-2" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8">
              <Image src={hero} alt="" fill className="object-cover" sizes="80px" />
            </div>
          </div>

          <div className="mt-5 border-t border-black/5 pt-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <div className="text-accent">Missions</div>
              <div className="text-muted">Details</div>
              <div className="text-muted">Tips</div>
            </div>
            <div className="mt-2 h-px w-16 bg-accent rounded-full" />
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-3xl bg-white/60 ring-1 ring-black/8 backdrop-blur divide-y divide-black/5">
            {tasks.length ? (
              tasks.map((t, idx) => {
                const isDone = isTaskCompleted(t, completedIds);
                const isActive = !isLocked && !isDone && idx === firstIncompleteIdx;
                const rowTone = isActive ? "bg-warning/12" : "";

                return (
                  <Link
                    key={t.id}
                    href={
                      isLocked
                        ? `/journey/stage/${stage.id}`
                        : `/journey/stage/${stage.id}/level/${level.levelNumber}/mission/${t.id}`
                    }
                    aria-disabled={isLocked}
                    className={[
                      "flex items-center justify-between gap-3 px-4 py-3",
                      isLocked ? "opacity-70 pointer-events-none" : "hover:bg-black/2",
                      rowTone,
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {isLocked ? (
                        <div className="grid h-7 w-7 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8">
                          <Lock className="h-4 w-4 text-muted" aria-hidden="true" />
                        </div>
                      ) : isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-accent-2" aria-hidden="true" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted" aria-hidden="true" />
                      )}

                      {t.imageUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.imageUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        <div className="mt-0.5 text-[11px] text-muted capitalize">{t.category}</div>
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-semibold text-accent-2">
                      +{t.xp ?? 100} XP
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-muted">No missions in this level yet.</div>
            )}
          </div>
        </div>
      </section>

      <button
        className="mt-4 w-full rounded-2xl bg-accent text-white py-3 text-sm font-semibold shadow-[0_12px_36px_rgba(109,40,217,0.28)] hover:brightness-105 active:brightness-95 transition"
        type="button"
      >
        Log Progress
      </button>
    </div>
  );
}

