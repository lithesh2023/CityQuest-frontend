import { notFound, redirect } from "next/navigation";
import { listJourneys } from "@/lib/api/cityquest";

export default async function JourneyWeekPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
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

  redirect(`/journey/stage/${first.id}/level/${levelNumber}`);
}

