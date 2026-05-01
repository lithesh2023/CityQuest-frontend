import { notFound } from "next/navigation";
import { getJourney, getLevel, getMyLevelProgress, getMyProgressSummary } from "@/lib/api/cityquest";
import { levelToLevelConfig } from "@/lib/api/adapters";
import type { JourneyStageConfig } from "@/lib/journeyConfigTypes";
import StageLevelMissionsClient from "./StageLevelMissionsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function StageLevelMissionsPage({
  params,
}: {
  params: Promise<{ stageId: string; levelNumber: string }>;
}) {
  const { stageId, levelNumber } = await params;
  const lvlNum = Number(levelNumber);
  if (!Number.isFinite(lvlNum)) notFound();

  const session = await getServerSession(authOptions);
  const authToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;

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
    progress = await getMyLevelProgress(level.id, authToken);
  } catch {
    progress = null;
  }

  let journeyProgress = null;
  try {
    if (authToken) journeyProgress = await getMyProgressSummary(journey.id, authToken);
  } catch {
    journeyProgress = null;
  }

  const completedByLevelId = new Map<string, boolean>();
  for (const row of journeyProgress?.levels ?? []) {
    if (row.status === "completed") completedByLevelId.set(row.level_id, true);
  }
  const levelsOrdered = (journey.levels ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const currentIdx = Math.max(0, levelsOrdered.findIndex((l) => !completedByLevelId.get(l.id)));
  const currentLevelOrder = levelsOrdered[currentIdx]?.order ?? 1;
  const isLocked = lvlNum > currentLevelOrder;

  const stage: JourneyStageConfig = {
    id: journey.id,
    title: journey.title,
    weeksLabel: journey.description ?? "",
    accent: "amber",
    status: isLocked ? "locked" : "in_progress",
    imageUrl: "/images/metro.png",
    levels: [],
  };

  const levelConfig = levelToLevelConfig(stage, level, lvlNum, progress);

  return <StageLevelMissionsClient stage={stage} level={levelConfig} />;
}

