import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Crown, Lock } from "lucide-react";
import { getJourney, getMyProgressSummary } from "@/lib/api/cityquest";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function JourneyStagePage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const { stageId } = await params;
  const session = await getServerSession(authOptions);
  const authToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;

  let journey;
  try {
    journey = await getJourney(stageId);
  } catch {
    notFound();
  }
  if (!journey) notFound();

  let progress: Awaited<ReturnType<typeof getMyProgressSummary>> | null = null;
  try {
    if (authToken) progress = await getMyProgressSummary(journey.id, authToken);
  } catch {
    progress = null;
  }

  const completedByLevelId = new Map<string, boolean>();
  for (const row of progress?.levels ?? []) {
    if (row.status === "completed") completedByLevelId.set(row.level_id, true);
  }

  const levels = (journey.levels ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentIdx = Math.max(
    0,
    levels.findIndex((l) => !completedByLevelId.get(l.id)),
  );
  const currentLevelOrder = levels[currentIdx]?.order ?? 1;
  const completedCount = levels.filter((l) => completedByLevelId.get(l.id)).length;
  const pct = Math.round((completedCount / Math.max(1, levels.length)) * 100);

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
        <div className="text-sm font-semibold">Journey</div>
        <div className="h-9 w-9" />
      </header>

      <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.12)]">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted">Roadmap</div>
              <h1 className="mt-1 text-lg font-semibold tracking-tight truncate">{journey.title}</h1>
              <p className="mt-1 text-sm text-muted">{journey.description ?? "Your missions are waiting."}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                <span>{levels.length} levels</span>
                <span aria-hidden="true">•</span>
                <span>
                  Progress: <span className="font-semibold text-foreground">{completedCount}</span> / {levels.length}
                </span>
                <span aria-hidden="true">•</span>
                <span>
                  Current: <span className="font-semibold text-foreground">Level {currentLevelOrder}</span>
                </span>
              </div>
            </div>

            <div className="shrink-0 rounded-3xl bg-black/5 ring-1 ring-black/8 p-3 w-[180px]">
              <div className="flex items-center justify-between text-xs font-semibold text-muted">
                <span>XP path</span>
                <Crown className="h-4 w-4 text-accent" aria-hidden="true" />
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5 ring-1 ring-black/8">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 text-[11px] text-muted">{pct}% complete</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <Link
              href={`/journey/stage/${journey.id}/level/${currentLevelOrder}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.22)] transition hover:brightness-105 active:brightness-95"
            >
              Continue
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-5 space-y-4">
        {levels.map((lvl) => {
          const lvlNum = lvl.order ?? 0;
          const total = lvl.mission_count ?? 0;
          const completed = Boolean(completedByLevelId.get(lvl.id));
          const locked = lvlNum > currentLevelOrder;
          const active = lvlNum === currentLevelOrder;

          return (
            <section
              key={lvl.id}
              className={[
                "overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]",
                active ? "shadow-[0_18px_60px_rgba(16,185,129,0.18)] ring-black/10" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/5">
                <div className="min-w-0">
                  <div className="text-xs text-muted font-semibold">Level {String(lvlNum).padStart(2, "0")}</div>
                  <div className="mt-0.5 text-sm font-semibold truncate">
                    {journey.title} • Level {lvlNum}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    {completed ? (
                      <span className="font-semibold text-emerald-700">Completed</span>
                    ) : locked ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Locked until Level {currentLevelOrder} is complete
                      </span>
                    ) : (
                      <span className="font-semibold text-accent">Next up</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-muted">
                    {total} missions
                  </div>
                </div>
              </div>

              <Link
                href={`/journey/stage/${journey.id}/level/${lvlNum}`}
                className={[
                  "flex items-center justify-between gap-3 px-5 py-3 text-sm font-semibold border-b border-black/5",
                  "hover:bg-black/2",
                  locked ? "text-muted" : "",
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

