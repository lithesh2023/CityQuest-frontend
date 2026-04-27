import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh]">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold">
            CityQuest Admin
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/admin/journey"
              className="rounded-xl px-3 py-1.5 bg-black/5 ring-1 ring-black/10 hover:bg-black/8 transition"
            >
              Journey
            </Link>
            <Link
              href="/home"
              className="rounded-xl px-3 py-1.5 bg-black/0 ring-1 ring-black/10 hover:bg-black/5 transition text-muted"
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}

