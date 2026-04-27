import { JourneyTimeline } from "@/components/JourneyTimeline";
import { readJourneyConfig } from "@/lib/journeyConfigStore";

export default async function JourneyPage() {
  const cfg = await readJourneyConfig();
  return <JourneyTimeline stages={cfg.stages} />;
}

