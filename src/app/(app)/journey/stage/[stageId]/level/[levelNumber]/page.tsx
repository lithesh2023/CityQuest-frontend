import { notFound } from "next/navigation";
import { getJourney, getLevel, getMyLevelProgress } from "@/lib/api/cityquest";
import { levelToLevelConfig } from "@/lib/api/adapters";
import type { JourneyStageConfig } from "@/lib/journeyConfigTypes";
import StageLevelMissionsClient from "./StageLevelMissionsClient";

export default async function StageLevelMissionsPage({
  params,
}: {
  params: Promise<{ stageId: string; levelNumber: string }>;
}) {
  const { stageId, levelNumber } = await params;
  const lvlNum = Number(levelNumber);
  if (!Number.isFinite(lvlNum)) notFound();

  let journey;
  try {
    journey = await getJourney(stageId);
  } catch {
    notFound();
  }
  const levelSummary = journey.levels?.find((l) => (l.order ?? 0) === lvlNum);
  if (!levelSummary) notFound();

  let level;
  try {
    level = await getLevel(levelSummary.id);
  } catch {
    notFound();
  }

  let progress = null;
  try {
    progress = await getMyLevelProgress(level.id);
  } catch {
    progress = null;
  }

  const stage: JourneyStageConfig = {
    id: journey.id,
    title: journey.title,
    weeksLabel: journey.description ?? "",
    accent: "amber",
    status: "in_progress",
    imageUrl: "/images/metro.png",
    levels: [],
  };

  const levelConfig = levelToLevelConfig(stage, level, lvlNum, progress);

  return <StageLevelMissionsClient stage={stage} level={levelConfig} />;
}

