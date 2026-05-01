import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { Bell } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { AutoRickshawFloat } from "@/components/AutoRickshawFloat";
import { getMySummary } from "@/lib/api/cityquest";
import { redirect } from "next/navigation";

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

const DEFAULT_LOCATION_SLUG = process.env.NEXT_PUBLIC_DEFAULT_LOCATION_SLUG ?? "bangalore";

export default async function HomeDashboardPage() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;
  if (!session || !accessToken) redirect("/login?from=/home");

  let summary = null as Awaited<ReturnType<typeof getMySummary>> | null;
  try {
    summary = await getMySummary(DEFAULT_LOCATION_SLUG, accessToken);
  } catch {
    summary = null;
  }

  const userName = summary?.user?.name ?? session?.user?.name ?? "Explorer";
  const cur = summary?.current;

  const journeyTitle = cur?.journey_title ?? "Your Journey";
  const journeyDescription =
    cur?.weeks_label ?? cur?.journey_description ?? "Continue exploring.";

  const levelOrder = cur?.level_order ?? 1;
  const levelTitle = cur?.level_display ?? `Level ${levelOrder}`;

  const weekCompleted = cur?.missions_completed ?? 0;
  const weekTotal = Math.max(1, cur?.missions_total ?? 1);
  const weekPct = Math.min(100, (weekCompleted / weekTotal) * 100);

  const weeksCompleted = summary?.macro.completed_stages ?? 0;
  const missionsDone = summary?.progress.distinct_missions_completed ?? 0;
  const badgesEarned = 0;

  const xp = cur?.xp_completed_this_level ?? 0;
  const xpMax = Math.max(1, cur?.xp_total_this_level ?? 1);
  const xpPct = Math.min(100, (xp / xpMax) * 100);

  const art = cityArtForLevel(levelOrder);
  const journeyId = cur?.journey_id ?? null;

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Hello, {userName}! 👋</div>
          <div className="mt-0.5 text-xs text-muted">Week {levelOrder} of 52</div>
        </div>
        <button
          type="button"
          className="h-10 w-10 rounded-2xl bg-card ring-1 ring-black/10 shadow-[0_12px_36px_rgba(109,40,217,0.08)] grid place-items-center text-muted hover:text-foreground transition"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </header>

      {summary && !summary.assigned ? (
        <div className="mt-3 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 px-4 py-3 text-xs text-amber-900">
          Choose your city on <Link href="/journey" className="font-semibold underline">Journey</Link> to sync
          progress for <span className="font-semibold">{summary.location.name}</span>.
        </div>
      ) : null}

      <section className="mt-4 rounded-3xl overflow-hidden shadow-[0_18px_60px_rgba(109,40,217,0.16)] ring-1 ring-black/8">
        <div className="relative h-28 bg-gradient-to-r from-accent to-indigo-600">
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_25%_20%,white,transparent_55%),radial-gradient(circle_at_80%_0%,white,transparent_60%)]" />
          <div className="absolute inset-0 px-5 py-4 flex items-center justify-between gap-4">
            <div className="text-white min-w-0">
              <div className="text-sm font-semibold">Explorer</div>
              <div className="mt-0.5 text-xs text-white/85 truncate">{levelTitle}</div>
              <div className="mt-3 text-[11px] text-white/85">
                {xp} / {xpMax} XP (this level)
              </div>
              <div className="mt-1 h-2 w-40 rounded-full bg-white/25 overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${xpPct}%` }} />
              </div>
            </div>

            <div className="relative h-20 w-28 shrink-0">
              <Image src={art.src} alt={art.alt} fill className="object-cover rounded-2xl" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]">
        <div className="grid grid-cols-3 divide-x divide-black/5">
          {[
            { label: "Stages done", value: weeksCompleted },
            { label: "Missions done", value: missionsDone },
            { label: "Badges", value: badgesEarned },
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
              <div className="text-sm font-semibold truncate">{journeyTitle}</div>
              <div className="mt-1 text-xs text-muted">{journeyDescription}</div>
            </div>
            <AutoRickshawFloat />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-muted">
              {weekCompleted} / {weekTotal} missions completed
            </div>
            <ProgressDots completed={weekCompleted} total={weekTotal} />
          </div>

          <div className="mt-3 h-2.5 rounded-full bg-black/5 ring-1 ring-black/8 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${weekPct}%` }} />
          </div>
        </div>

        <Link
          href={journeyId ? `/journey/stage/${journeyId}/level/${levelOrder}` : "/journey"}
          className="flex items-center justify-between px-5 py-4 border-t border-black/5 text-sm font-semibold"
        >
          Continue your journey
          <span className="text-muted">›</span>
        </Link>
      </section>
    </div>
  );
}
