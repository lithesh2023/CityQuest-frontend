"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import type {
  JourneyLevelConfig,
  JourneyStageConfig,
  JourneyTaskConfig,
} from "@/lib/journeyConfigTypes";
import {
  getCompletedTaskIds,
  isTaskCompleted,
  markTaskCompleted,
} from "@/lib/journeyProgress";

export default function StageMissionClient({
  stage,
  level,
  task,
}: {
  stage: JourneyStageConfig;
  level: JourneyLevelConfig;
  task: JourneyTaskConfig;
}) {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => getCompletedTaskIds());

  const isLocked = stage.status === "locked";
  const done = isTaskCompleted(task, completedIds);

  const hero = useMemo(
    () => task.imageUrl || level.imageUrl || stage.imageUrl || "/images/metro.png",
    [task.imageUrl, level.imageUrl, stage.imageUrl],
  );

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-8">
      <header className="flex items-center justify-between">
        <Link
          href={`/journey/stage/${stage.id}/level/${level.levelNumber}`}
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="text-sm font-semibold">Mission</div>
        <div className="h-9 w-9" />
      </header>

      <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.12)]">
        <div className="p-5">
          <div className="relative h-40 overflow-hidden rounded-3xl bg-black/5 ring-1 ring-black/8">
            <Image
              src={hero}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <h1 className="mt-4 text-lg font-semibold tracking-tight">{task.title}</h1>
          <div className="mt-1 text-sm font-semibold text-accent-2">+{task.xp ?? 100} XP</div>
          <p className="mt-2 text-sm text-muted">
            {stage.title} • Level {level.levelNumber} • {task.category}
          </p>

          <div className="mt-5">
            <div className="text-sm font-semibold">How to complete</div>
            <div className="mt-3 space-y-2">
              {["Do the experience in the city", "Upload a picture as proof"].map((step) => (
                <div key={step} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent-2" aria-hidden="true" />
                  <div className="text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {Array.isArray(task.galleryUrls) && task.galleryUrls.length ? (
            <div className="mt-5">
              <div className="text-sm font-semibold">Reference images</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {task.galleryUrls.slice(0, 9).map((u) => (
                  <div
                    key={u}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8"
                  >
                    <Image src={u} alt="" fill className="object-cover" sizes="(max-width: 768px) 33vw, 140px" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={isLocked}
            className={[
              "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.28)] transition",
              isLocked ? "opacity-60 cursor-not-allowed" : "hover:brightness-105 active:brightness-95",
            ].join(" ")}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload Photo
          </button>

          <button
            type="button"
            disabled={isLocked || done}
            onClick={() => {
              const ids = markTaskCompleted(task.id);
              setCompletedIds(new Set(ids));
              router.push(`/journey/stage/${stage.id}/level/${level.levelNumber}`);
              router.refresh();
            }}
            className={[
              "mt-3 w-full rounded-2xl py-2 text-sm font-semibold ring-1 transition",
              done
                ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 cursor-default"
                : "bg-black/0 text-accent-2 ring-transparent hover:bg-black/5 hover:ring-black/8",
              isLocked ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {done ? "Completed" : "Mark as Complete"}
          </button>
        </div>
      </section>
    </div>
  );
}

