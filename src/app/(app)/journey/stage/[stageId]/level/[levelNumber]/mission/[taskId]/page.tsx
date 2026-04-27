import { notFound } from "next/navigation";
import { readJourneyConfig } from "@/lib/journeyConfigStore";
import StageMissionClient from "./StageMissionClient";

export default async function StageMissionPage({
  params,
}: {
  params: Promise<{ stageId: string; levelNumber: string; taskId: string }>;
}) {
  const { stageId, levelNumber, taskId } = await params;
  const lvlNum = Number(levelNumber);
  if (!Number.isFinite(lvlNum)) notFound();

  const cfg = await readJourneyConfig();
  const stage = cfg.stages.find((s) => s.id === stageId);
  const level = stage?.levels.find((l) => l.levelNumber === lvlNum);
  const task = level?.tasks.find((t) => t.id === taskId);
  if (!stage || !level || !task) notFound();

  return <StageMissionClient stage={stage} level={level} task={task} />;
}

