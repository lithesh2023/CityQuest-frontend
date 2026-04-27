import { notFound } from "next/navigation";
import { readJourneyConfig } from "@/lib/journeyConfigStore";
import StageLevelMissionsClient from "./StageLevelMissionsClient";

export default async function StageLevelMissionsPage({
  params,
}: {
  params: Promise<{ stageId: string; levelNumber: string }>;
}) {
  const { stageId, levelNumber } = await params;
  const lvlNum = Number(levelNumber);
  if (!Number.isFinite(lvlNum)) notFound();

  const cfg = await readJourneyConfig();
  const stage = cfg.stages.find((s) => s.id === stageId);
  const level = stage?.levels.find((l) => l.levelNumber === lvlNum);
  if (!stage || !level) notFound();

  return <StageLevelMissionsClient stage={stage} level={level} />;
}

