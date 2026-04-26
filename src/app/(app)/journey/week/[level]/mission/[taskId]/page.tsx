import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import { dummyLevels } from "@/lib/journeyDummy";

export default async function MissionPage({
  params,
}: {
  params: Promise<{ level: string; taskId: string }>;
}) {
  const { level, taskId } = await params;
  const levelNumber = Number(level);
  if (!Number.isFinite(levelNumber)) notFound();

  const lvl = dummyLevels.find((l) => l.levelNumber === levelNumber);
  if (!lvl) notFound();

  const task = lvl.tasks.find((t) => t.id === taskId);
  if (!task) notFound();

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-8">
      <header className="flex items-center justify-between">
        <Link
          href={`/journey/week/${lvl.levelNumber}`}
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
              src="/images/metro.png"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            {task.title}
          </h1>
          <div className="mt-1 text-sm font-semibold text-accent-2">
            +{task.xp} XP
          </div>
          <p className="mt-2 text-sm text-muted">{task.description}</p>

          <div className="mt-5">
            <div className="text-sm font-semibold">How to complete</div>
            <div className="mt-3 space-y-2">
              {[
                "Take a metro ride",
                "Upload a picture (inside or outside the station)",
              ].map((step) => (
                <div key={step} className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 text-accent-2"
                    aria-hidden="true"
                  />
                  <div className="text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.28)] hover:brightness-105 active:brightness-95 transition"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload Photo
          </button>

          <button
            type="button"
            className="mt-3 w-full rounded-2xl bg-black/0 py-2 text-sm font-semibold text-accent-2 hover:bg-black/5 ring-1 ring-transparent hover:ring-black/8 transition"
          >
            Mark as Complete
          </button>
        </div>
      </section>
    </div>
  );
}

