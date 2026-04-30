import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.10)] p-5">
        <div className="text-sm font-semibold">Admin</div>
        <div className="mt-1 text-xs text-muted">
          Manage locations and configure journeys, levels, tasks, and related images.
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/locations"
              className="inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.28)] hover:brightness-105 active:brightness-95 transition"
            >
              Manage Locations
            </Link>
            <Link
              href="/admin/journey"
              className="inline-flex items-center justify-center rounded-2xl bg-black/5 px-4 py-2.5 text-sm font-semibold ring-1 ring-black/10 hover:bg-black/8 transition"
            >
              Open Journey Config
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

