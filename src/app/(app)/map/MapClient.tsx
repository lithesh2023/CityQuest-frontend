"use client";

import dynamic from "next/dynamic";

const ExploreMap = dynamic(
  () => import("../../../components/ExploreMap").then((m) => m.ExploreMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-white/5">
        <div className="h-full w-full animate-pulse bg-black/5" />
      </div>
    ),
  }
);

export function MapClient() {
  return <ExploreMap variant="full" />;
}

