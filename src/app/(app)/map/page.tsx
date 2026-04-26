import { MapClient } from "./MapClient";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

export default function MapPage() {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <h1 className="text-sm font-semibold tracking-tight">
              Explore Bangalore
            </h1>
          </div>

          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative mt-3 flex-1 min-h-0">
        <div className="absolute inset-0 z-0">
          <MapClient />
        </div>

        <section className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-5">
          <div className="pointer-events-auto overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_12px_36px_rgba(109,40,217,0.12)]">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Areas Explored</div>
                  <div className="mt-2 text-2xl font-semibold text-accent-2">
                    23%
                  </div>
                </div>
                <div className="text-right text-xs text-muted">
                  Keep exploring to uncover more of Bangalore!
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/5 ring-1 ring-black/8">
                <div
                  className="h-full rounded-full bg-accent-2"
                  style={{ width: "23%" }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

