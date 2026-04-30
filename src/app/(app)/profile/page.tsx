import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { Bike, MapPin, User, UserRoundPlus, Utensils } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;
  if (!session || !accessToken) redirect("/login?from=/profile");

  const name = session?.user?.name ?? "Explorer";
  const levelLabel = "Explorer Level 2";
  const xpCurrent = 1200;
  const xpTotal = 2000;
  const xpPct = Math.min(100, Math.round((xpCurrent / xpTotal) * 100));
  const avatarSrc = session?.user?.image ?? null;

  return (
    <div className="px-4 pt-6 pb-8 mx-auto max-w-md">
      <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <User className="h-6 w-6 text-muted" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{name}</div>
                <div className="mt-0.5 text-xs text-muted">{levelLabel}</div>
              </div>
            </div>

            <div className="text-right text-[11px] text-muted">
              <div className="font-semibold text-foreground">
                {xpCurrent} / {xpTotal} XP
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/5 ring-1 ring-black/8">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Missions Done", value: 18 },
              { label: "Badges", value: 5, href: "/profile/badges" },
              { label: "Weeks Completed", value: 6 },
            ].map((s) => (
              <Link
                key={s.label}
                href={(s as { href?: string }).href ?? "#"}
                aria-disabled={!(s as { href?: string }).href}
                tabIndex={(s as { href?: string }).href ? 0 : -1}
                className={[
                  "rounded-2xl bg-white/60 ring-1 ring-black/8 px-3 py-3 text-center backdrop-blur",
                  (s as { href?: string }).href
                    ? "hover:bg-white/70"
                    : "pointer-events-none",
                ].join(" ")}
              >
                <div className="text-base font-semibold">{s.value}</div>
                <div className="mt-0.5 text-[11px] font-medium text-muted">
                  {s.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-4">
        <LogoutButton className="w-full rounded-2xl bg-black/5 ring-1 ring-black/10 py-3 text-sm font-semibold hover:bg-black/8 transition" />
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.08)]">
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-sm font-semibold">Your Stats</h2>

          <div className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white/60 ring-1 ring-black/8 backdrop-blur">
            {[
              {
                label: "Places Explored",
                value: "23",
                icon: MapPin,
              },
              {
                label: "Kilometers Traveled",
                value: "48.6 km",
                icon: Bike,
              },
              {
                label: "New Foods Tried",
                value: "32",
                icon: Utensils,
              },
              {
                label: "Local Friends Made",
                value: "12",
                icon: UserRoundPlus,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <row.icon className="h-4 w-4 text-muted" aria-hidden="true" />
                  <div className="truncate text-xs font-medium">{row.label}</div>
                </div>
                <div className="shrink-0 text-xs font-semibold text-foreground">
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

