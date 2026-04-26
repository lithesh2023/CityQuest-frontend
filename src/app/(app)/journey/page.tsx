import { dummyLevels } from "@/lib/journeyDummy";
import { JourneyTimeline } from "@/components/JourneyTimeline";

export default function JourneyPage() {
  return <JourneyTimeline levels={dummyLevels} />;
}

