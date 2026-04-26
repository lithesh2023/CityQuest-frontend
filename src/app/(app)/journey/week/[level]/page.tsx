import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { dummyLevels } from "@/lib/journeyDummy";
import { Info, Lock, CheckCircle2, Circle } from "lucide-react";

export default async function JourneyWeekPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const levelNumber = Number(level);

  if (!Number.isFinite(levelNumber)) notFound();

  const lvl = dummyLevels.find((l) => l.levelNumber === levelNumber);
  if (!lvl) notFound();

  const total = lvl.totalTasks || 6;
  const completed = Math.min(lvl.completedTasks, total);
  const pct = Math.round((completed / Math.max(1, total)) * 100);
  const firstIncompleteIdx = Math.max(
    0,
    lvl.tasks.findIndex((t) => !t.completed)
  );

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-8">
      <header className="flex items-center justify-between">
        <Link
          href="/journey"
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="text-sm font-semibold">Week {lvl.levelNumber}</div>
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
              <div className="text-sm font-semibold">Getting Around Bangalore</div>
              <div className="mt-1 text-xs text-muted">
                Master the art of moving around the city like a pro.
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="text-accent-2">{completed}</span> / {total} missions
                completed
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5 ring-1 ring-black/8">
                <div
                  className="h-full rounded-full bg-accent-2"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8">
              <Image
                src="/images/metro.png"
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
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
            {lvl.tasks.length ? (
              lvl.tasks.map((t, idx) => {
                const isLocked = lvl.status === "locked";
                const isActive =
                  !isLocked && !t.completed && idx === firstIncompleteIdx;
                const rowTone = isActive ? "bg-warning/12" : "";

                return (
                  <Link
                    key={t.id}
                    href={isLocked ? "/journey" : `/journey/week/${lvl.levelNumber}/mission/${t.id}`}
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
                      ) : t.completed ? (
                        <CheckCircle2
                          className="h-5 w-5 text-accent-2"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="h-5 w-5 text-muted" aria-hidden="true" />
                      )}

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-semibold text-accent-2">
                      +{t.xp} XP
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-muted">
                Finish the previous level to unlock these missions.
              </div>
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

