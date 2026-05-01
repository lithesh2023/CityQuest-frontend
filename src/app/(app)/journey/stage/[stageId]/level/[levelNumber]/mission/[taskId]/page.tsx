import { notFound } from "next/navigation";
import { getJourney, getLevel, getMission, getMyLevelProgress } from "@/lib/api/cityquest";
import { apiMissionToTaskConfig, levelToLevelConfig } from "@/lib/api/adapters";
import type { JourneyStageConfig, JourneyTaskConfig } from "@/lib/journeyConfigTypes";
import StageMissionClient from "./StageMissionClient";

export default async function StageMissionPage({
  params,
}: {
  params: Promise<{ stageId: string; levelNumber: string; taskId: string }>;
}) {
  const { stageId, levelNumber, taskId } = await params;
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

  let mission;
  try {
    mission = await getMission(taskId);
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
  const found = levelConfig.tasks.find((t) => t.id === mission.id);
  const completed = progress?.missions?.some((x) => x.mission_id === mission.id && x.status === "completed") ?? false;
  const task: JourneyTaskConfig = found ?? apiMissionToTaskConfig(mission, completed);

  return <StageMissionClient stage={stage} level={levelConfig} task={task} />;
}

