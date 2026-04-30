import Link from "next/link";
import { notFound } from "next/navigation";
import { Info, ChevronRight } from "lucide-react";
import { getJourney } from "@/lib/api/cityquest";

export default async function JourneyStagePage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const { stageId } = await params;
  let journey;
  try {
    journey = await getJourney(stageId);
  } catch {
    notFound();
  }
  if (!journey) notFound();

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
        <div className="text-sm font-semibold">{journey.title}</div>
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
            <div className="text-sm font-semibold">{journey.title}</div>
            <div className="text-[11px] text-muted">{journey.description ?? ""}</div>
            <div className="text-[11px] text-muted">•</div>
            <div className="text-[11px] text-muted">{journey.levels?.length ?? 0} levels</div>
            <div className="text-[11px] text-muted">•</div>
            <div className="text-[11px] text-muted">
              Level completes at <span className="font-semibold text-foreground">3 / 6</span> tasks
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {(journey.levels ?? []).map((lvl) => {
          const lvlNum = lvl.order ?? 0;
          const total = lvl.mission_count ?? 0;

          return (
            <section
              key={lvl.id}
              className="overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]"
            >
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/5">
                <div className="min-w-0">
                  <div className="text-xs text-muted font-semibold">Level {String(lvlNum).padStart(2, "0")}</div>
                  <div className="mt-0.5 text-sm font-semibold truncate">
                    {journey.title} • Level {lvlNum}
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

