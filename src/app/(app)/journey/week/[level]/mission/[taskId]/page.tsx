import { notFound, redirect } from "next/navigation";
import { listJourneys } from "@/lib/api/cityquest";

export default async function MissionPage({
  params,
}: {
  params: Promise<{ level: string; taskId: string }>;
}) {
  const { level, taskId } = await params;
  const levelNumber = Number(level);
  if (!Number.isFinite(levelNumber)) notFound();

  let journeys;
  try {
    journeys = await listJourneys();
  } catch {
    notFound();
  }

  const first = journeys.items?.[0];
  if (!first?.id) notFound();

  redirect(`/journey/stage/${first.id}/level/${levelNumber}/mission/${encodeURIComponent(taskId)}`);
}

