"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { JourneyTimeline } from "@/components/JourneyTimeline";
import { useSelectedLocation } from "@/lib/useSelectedLocation";
import { getMyJourneyForLocation, listLocations, selectMyLocation } from "@/lib/api/cityquest";
import type { JourneyStageConfig } from "@/lib/journeyConfigTypes";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function JourneyClient() {
  const { data: session } = useSession();
  const authToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;

  const { locationSlug, setLocationSlug } = useSelectedLocation();
  const [stages, setStages] = useState<JourneyStageConfig[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [locations, setLocations] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const selectedLocationName = useMemo(() => {
    return locations.find((l) => l.slug === locationSlug)?.name ?? locationSlug;
  }, [locations, locationSlug]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setStages(null);
      try {
        // Load locations list (public)
        const locRes = await listLocations();
        if (!cancelled) setLocations(locRes.items ?? []);

        // Ensure this user is assigned/locked to a journey for the selected location
        if (!authToken) throw new Error("Please log in to view your journey.");
        await selectMyLocation(locationSlug, authToken);

        // Fetch the assigned journey content for that location
        const myJourney = await getMyJourneyForLocation(locationSlug, authToken);

        const mappedStages: JourneyStageConfig[] =
          myJourney.stages?.length
            ? myJourney.stages.map((s) => ({
                id: s.id,
                title: s.title,
                weeksLabel: s.weeks_label ?? s.description ?? "",
                accent: s.accent === "green" || s.accent === "amber" || s.accent === "purple" ? s.accent : "amber",
                status: s.status === "completed" || s.status === "in_progress" || s.status === "locked" ? s.status : "locked",
                imageUrl: "/images/metro.png",
                levels: [],
              }))
            : [
                {
                  id: myJourney.journey.id,
                  title: myJourney.journey.title,
                  weeksLabel: myJourney.journey.weeks_label ?? myJourney.journey.description ?? "",
                  accent:
                    myJourney.journey.accent === "green" ||
                    myJourney.journey.accent === "amber" ||
                    myJourney.journey.accent === "purple"
                      ? myJourney.journey.accent
                      : "amber",
                  status: "in_progress",
                  imageUrl: "/images/metro.png",
                  levels: (myJourney.journey.levels ?? []).map((l) => ({
                    id: l.id,
                    levelNumber: l.order ?? 0,
                    imageUrl: "/images/metro.png",
                    tasks: [],
                  })),
                },
              ];

        if (!cancelled) setStages(mappedStages);
      } catch (e) {
        if (cancelled) return;
        const status =
          typeof e === "object" && e !== null && "status" in e ? (e as { status?: number }).status : undefined;
        if (status === 401) {
          await signOut({ callbackUrl: "/login?from=/journey" });
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [locationSlug, authToken]);

  return (
    <div>
      {error ? (
        <div className="mx-auto max-w-md px-4 pt-4">
          <div className="rounded-3xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      ) : null}

      {stages ? (
        <JourneyTimeline
          stages={stages}
          locations={locations.length ? locations : [{ id: locationSlug, slug: locationSlug, name: selectedLocationName }]}
          locationSlug={locationSlug}
          onChangeLocation={setLocationSlug}
        />
      ) : (
        <div className="mx-auto max-w-md px-4 pt-4 text-sm text-muted">Loading…</div>
      )}
    </div>
  );
}

