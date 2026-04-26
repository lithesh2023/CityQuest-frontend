import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { Bell } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { dummyLevels } from "@/lib/journeyDummy";
import { AutoRickshawFloat } from "@/components/AutoRickshawFloat";

function cityArtForLevel(levelNumber: number) {
  const options = [
    { src: "/images/city/bangalore-vidhana.svg", alt: "Vidhana Soudha illustration" },
    { src: "/images/city/bangalore-palace.svg", alt: "Bangalore Palace illustration" },
    { src: "/images/city/bangalore-metro.svg", alt: "Namma Metro illustration" },
  ];
  return options[(Math.max(1, levelNumber) - 1) % options.length];
}

function ProgressDots({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${completed} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < completed;
        return (
          <span
            key={i}
            className={[
              "h-2.5 w-2.5 rounded-full ring-1",
              done ? "bg-accent ring-accent/30" : "bg-black/5 ring-black/10",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

export default async function HomeDashboardPage() {
  const session = await getServerSession(authOptions);

  const current =
    dummyLevels.find((l) => l.status === "in_progress") ??
    dummyLevels.find((l) => l.status !== "locked") ??
    dummyLevels[0];

  const userName = session?.user?.name ?? "Explorer";

  const weeksCompleted = 6;
  const missionsDone = 18;
  const badgesEarned = 5;

  const xp = 1200;
  const xpMax = 2000;
  const xpPct = Math.min(100, (xp / xpMax) * 100);
  const art = cityArtForLevel(current.levelNumber);
  const weekCompleted = Math.min(3, current.completedTasks);
  const weekTotal = 5;
  const weekPct = Math.min(100, (weekCompleted / Math.max(1, weekTotal)) * 100);

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Hello, {userName}! 👋</div>
          <div className="mt-0.5 text-xs text-muted">Week {current.levelNumber} of 52</div>
        </div>
        <button
          type="button"
          className="h-10 w-10 rounded-2xl bg-card ring-1 ring-black/10 shadow-[0_12px_36px_rgba(109,40,217,0.08)] grid place-items-center text-muted hover:text-foreground transition"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </header>

      <section className="mt-4 rounded-3xl overflow-hidden shadow-[0_18px_60px_rgba(109,40,217,0.16)] ring-1 ring-black/8">
        <div className="relative h-28 bg-gradient-to-r from-accent to-indigo-600">
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_25%_20%,white,transparent_55%),radial-gradient(circle_at_80%_0%,white,transparent_60%)]" />
          <div className="absolute inset-0 px-5 py-4 flex items-center justify-between gap-4">
            <div className="text-white min-w-0">
              <div className="text-sm font-semibold">Explorer</div>
              <div className="mt-0.5 text-xs text-white/85">Level 2</div>
              <div className="mt-3 text-[11px] text-white/85">
                {xp} / {xpMax} XP
              </div>
              <div className="mt-1 h-2 w-40 rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            <div className="relative h-20 w-28 shrink-0">
              <Image
                src={art.src}
                alt={art.alt}
                fill
                className="object-cover rounded-2xl"
              />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]">
        <div className="grid grid-cols-3 divide-x divide-black/5">
          {[
            { label: "Weeks Completed", value: weeksCompleted },
            { label: "Missions Done", value: missionsDone },
            { label: "Badges Earned", value: badgesEarned },
          ].map((s) => (
            <div key={s.label} className="px-3 py-4 text-center">
              <div className="text-lg font-semibold">{s.value}</div>
              <div className="mt-1 text-[11px] text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="text-xs text-muted font-semibold">This Week’s Theme</div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Getting Around Bangalore</div>
              <div className="mt-1 text-xs text-muted">
                Learn the ways, move like a Bangalorean!
              </div>
            </div>
            <AutoRickshawFloat />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-muted">
              {weekCompleted} / {weekTotal} missions completed
            </div>
            <ProgressDots completed={Math.min(3, current.completedTasks)} total={5} />
          </div>

          <div className="mt-3 h-2.5 rounded-full bg-black/5 ring-1 ring-black/8 overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${weekPct}%` }}
            />
          </div>
        </div>

        <Link
          href={`/journey/week/${current.levelNumber}`}
          className="flex items-center justify-between px-5 py-4 border-t border-black/5 text-sm font-semibold"
        >
          Continue your journey
          <span className="text-muted">›</span>
        </Link>
      </section>
    </div>
  );
}

