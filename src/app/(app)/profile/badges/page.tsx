import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Camera,
  Flame,
  Footprints,
  Lock,
  MapPin,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";

type Badge = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  tone: "accent" | "green" | "warning" | "neutral";
  earned: boolean;
};

const BADGES: Badge[] = [
  {
    id: "first-quest",
    title: "First Quest",
    subtitle: "Complete 1 mission",
    icon: Sparkles,
    tone: "accent",
    earned: true,
  },
  {
    id: "city-stroller",
    title: "City Stroller",
    subtitle: "Walk 5 km",
    icon: Footprints,
    tone: "neutral",
    earned: true,
  },
  {
    id: "foodie",
    title: "Foodie Finder",
    subtitle: "Try 5 new foods",
    icon: Utensils,
    tone: "warning",
    earned: true,
  },
  {
    id: "spotter",
    title: "Landmark Spotter",
    subtitle: "Visit 3 places",
    icon: MapPin,
    tone: "accent",
    earned: true,
  },
  {
    id: "storyteller",
    title: "Storyteller",
    subtitle: "Post 3 updates",
    icon: Camera,
    tone: "neutral",
    earned: false,
  },
  {
    id: "streak",
    title: "7‑Day Streak",
    subtitle: "Play 7 days",
    icon: Flame,
    tone: "warning",
    earned: false,
  },
  {
    id: "community",
    title: "Community Buddy",
    subtitle: "Make 5 friends",
    icon: Users,
    tone: "green",
    earned: false,
  },
  {
    id: "badge-collector",
    title: "Collector",
    subtitle: "Earn 10 badges",
    icon: Award,
    tone: "accent",
    earned: false,
  },
];

function toneClasses(tone: Badge["tone"]) {
  switch (tone) {
    case "accent":
      return "bg-accent/12 text-accent";
    case "green":
      return "bg-accent-2/12 text-accent-2";
    case "warning":
      return "bg-warning/14 text-warning";
    default:
      return "bg-black/6 text-foreground";
  }
}

export default function MyBadgesPage() {
  const earnedCount = BADGES.filter((b) => b.earned).length;

  return (
    <div className="px-4 pt-6 pb-8 mx-auto max-w-md">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            My Badges
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            You’ve earned {earnedCount} of {BADGES.length}.
          </p>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold">Progress</div>
            <div className="text-xs font-semibold text-muted">
              {earnedCount} / {BADGES.length}
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/5 ring-1 ring-black/8">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round((earnedCount / BADGES.length) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {BADGES.map((b) => (
          <div
            key={b.id}
            className={[
              "relative overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]",
              b.earned ? "" : "opacity-70",
            ].join(" ")}
          >
            <div className="px-4 pt-4 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className={[
                    "grid h-10 w-10 place-items-center rounded-2xl ring-1 ring-black/8",
                    toneClasses(b.tone),
                  ].join(" ")}
                >
                  <b.icon className="h-5 w-5" aria-hidden="true" />
                </div>

                {!b.earned ? (
                  <div className="grid h-8 w-8 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8">
                    <Lock className="h-4 w-4 text-muted" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="text-[11px] font-semibold text-accent">
                    Earned
                  </div>
                )}
              </div>

              <div className="mt-3 text-sm font-semibold">{b.title}</div>
              <div className="mt-1 text-xs text-muted">{b.subtitle}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

