"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Camera, MapPin } from "lucide-react";
import type { QuestTask, QuestTaskType } from "@/lib/journeyDummy";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function typeMeta(type: QuestTaskType) {
  switch (type) {
    case "history":
      return { label: "History", icon: MapPin, tint: "text-emerald-700" };
    case "food":
      return { label: "Food", icon: BadgeCheck, tint: "text-amber-700" };
    case "activity":
      return { label: "Activity", icon: BadgeCheck, tint: "text-sky-700" };
    case "culture":
      return { label: "Culture", icon: BadgeCheck, tint: "text-violet-700" };
    case "dynamic":
      return { label: "Dynamic", icon: Camera, tint: "text-lime-700" };
    case "sponsored":
      return { label: "Sponsored", icon: BadgeCheck, tint: "text-rose-700" };
  }
}

function ProgressDots({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${completed} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < completed;
        return (
          <span
            key={i}
            className={cx(
              "h-2.5 w-2.5 rounded-full ring-1 transition",
              done
                ? "bg-accent ring-accent/30"
                : "bg-black/5 ring-black/10",
            )}
          />
        );
      })}
    </div>
  );
}

export function TaskCard({
  title,
  subtitle,
  progressCompleted,
  progressTotal,
  tasks,
}: {
  title: string;
  subtitle?: string;
  progressCompleted: number;
  progressTotal: number;
  tasks: QuestTask[];
}) {
  return (
    <motion.div
      layout
      className="rounded-3xl border border-border bg-card shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_18px_60px_rgba(109,40,217,0.10)] overflow-hidden"
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted">Progress</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <ProgressDots completed={progressCompleted} total={progressTotal} />
              <div className="text-xs font-semibold">
                {progressCompleted}/{progressTotal}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4">
        <div className="rounded-2xl bg-black/2 ring-1 ring-black/6 divide-y divide-black/5 overflow-hidden">
          {tasks.map((t) => {
            const meta = typeMeta(t.type);
            const Icon = meta.icon;
            return (
              <div
                key={t.id}
                className="flex items-start gap-3 px-4 py-3"
              >
                <div
                  className={cx(
                    "mt-0.5 h-7 w-7 rounded-2xl bg-white ring-1 ring-black/10 flex items-center justify-center",
                    t.completed && "bg-accent/10 ring-accent/20",
                  )}
                >
                  <Icon className={cx("h-4 w-4", meta.tint)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-sm font-medium">
                      {t.title}
                    </div>
                    <div className="shrink-0 text-xs text-muted">
                      +{t.xp} XP
                    </div>
                  </div>
                  <div className="mt-0.5 text-xs text-muted line-clamp-2">
                    {t.description}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted">{meta.label}</span>
                    <span
                      className={cx(
                        "text-[11px] font-medium",
                        t.completed ? "text-accent" : "text-muted",
                      )}
                    >
                      {t.completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

