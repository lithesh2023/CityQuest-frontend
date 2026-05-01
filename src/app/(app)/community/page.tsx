import Image from "next/image";
import { Flame, Users, UtensilsCrossed } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

function AvatarStack() {
  return (
    <div className="mt-3 flex items-center justify-between gap-4">
      <div className="flex -space-x-2">
        {["bg-accent/20", "bg-warning/25", "bg-accent-2/20", "bg-black/10"].map(
          (bg, idx) => (
            <div
              // These are decorative placeholders (no user identity).
              key={idx}
              className={`h-7 w-7 rounded-full ring-2 ring-white/70 ${bg}`}
            />
          )
        )}
      </div>
      <div className="text-xs font-semibold text-muted">+128</div>
    </div>
  );
}

function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]">
      <div className="px-5 pt-5 pb-4">{children}</div>
    </section>
  );
}

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;
  if (!session || !accessToken) redirect("/login?from=/community");

  return (
    <div className="px-4 pt-6 pb-8 mx-auto max-w-md">
      <h1 className="text-xl font-semibold tracking-tight">Community</h1>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Bangaloreans like you</div>
            <div className="mt-1 text-xs text-muted">
              Connect, share, and learn from people on the same journey.
            </div>
            <AvatarStack />
          </div>

          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8">
            <Image
              src="/images/city/bangalore-vidhana.svg"
              alt=""
              fill
              className="object-contain p-2"
              sizes="56px"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-accent/10 ring-1 ring-black/8">
              <Users className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Your Cohort</div>
              <div className="mt-0.5 text-xs text-muted">
                Moved to BLR in March ‘24
              </div>
            </div>
          </div>

          <a
            href="/community/cohort"
            className="inline-flex h-9 items-center justify-center rounded-full bg-black/5 px-4 text-xs font-semibold ring-1 ring-black/8 hover:bg-black/10"
          >
            View
          </a>
        </div>

        <div className="mt-3 text-xs text-muted">245 members</div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Flame className="h-4 w-4 text-warning" aria-hidden="true" />
              Weekly Challenge
            </div>
            <div className="mt-1 text-xs font-semibold">Food Trail Friday</div>
            <div className="mt-1 text-xs text-muted">
              Try a new local eatery and share your experience.
            </div>

            <a
              href="/community/challenges/food-trail-friday"
              className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-warning/15 px-4 text-xs font-semibold text-foreground ring-1 ring-black/8 hover:bg-warning/20"
            >
              Participate
            </a>
          </div>

          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-warning/15 ring-1 ring-black/8">
            <UtensilsCrossed
              className="h-6 w-6 text-warning"
              aria-hidden="true"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

