import Link from "next/link";
import { notFound } from "next/navigation";
import { Info, Lock, ChevronRight } from "lucide-react";
import { readJourneyConfig } from "@/lib/journeyConfigStore";

export default async function JourneyStagePage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const { stageId } = await params;
  const cfg = await readJourneyConfig();
  const stage = cfg.stages.find((s) => s.id === stageId);
  if (!stage) notFound();

  const isLocked = stage.status === "locked";

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 pb-10">
      <header className="flex items-center justify-between">
        <Link
          href="/journey"
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="text-sm font-semibold">{stage.title}</div>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Info"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="mt-4 rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.10)] overflow-hidden">
        <div className="px-5 py-4">
          <div className="text-xs text-muted font-semibold">The Pilot Roadmap: Bengaluru Edition</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="text-sm font-semibold">{stage.title}</div>
            <div className="text-[11px] text-muted">{stage.weeksLabel}</div>
            <div className="text-[11px] text-muted">•</div>
            <div className="text-[11px] text-muted">5 levels</div>
            <div className="text-[11px] text-muted">•</div>
            <div className="text-[11px] text-muted">
              Level completes at <span className="font-semibold text-foreground">3 / 6</span> tasks
            </div>
          </div>
          {isLocked ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/4 px-3 py-1.5 text-xs font-semibold text-muted ring-1 ring-black/8">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Locked
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {stage.levels.map((lvl) => {
          const done = lvl.tasks.filter((t) => t.completed).length;
          const total = lvl.tasks.length || 6;
          const completed = done >= 3;

          return (
            <section
              key={lvl.id}
              className="overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]"
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/5">
                <div className="min-w-0">
                  <div className="text-xs text-muted font-semibold">Level {String(lvl.levelNumber).padStart(2, "0")}</div>
                  <div className="mt-0.5 text-sm font-semibold truncate">
                    {stage.title} • Level {lvl.levelNumber}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-muted">
                    {Math.min(done, total)} / {total}
                  </div>
                  <div
                    className={[
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ring-1",
                      completed
                        ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20"
                        : "bg-amber-500/12 text-amber-700 ring-amber-500/20",
                    ].join(" ")}
                  >
                    {completed ? "Completed" : "In progress"}
                  </div>
                </div>
              </div>

              <Link
                href={isLocked ? `/journey/stage/${stage.id}` : `/journey/stage/${stage.id}/level/${lvl.levelNumber}`}
                aria-disabled={isLocked}
                className={[
                  "flex items-center justify-between gap-3 px-5 py-3 text-sm font-semibold border-b border-black/5",
                  isLocked ? "opacity-70 pointer-events-none" : "hover:bg-black/2",
                ].join(" ")}
              >
                View missions
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
              </Link>
            </section>
          );
        })}
      </div>
    </div>
  );
}

