import { Suspense } from "react";
import JourneyAdminDetailClient from "@/app/(admin)/admin/journey/JourneyAdminDetailClient";

export default async function AdminJourneyDetailPage({ params }: { params: Promise<{ journeyId: string }> }) {
  const { journeyId } = await params;
  return (
    <Suspense fallback={<div className="text-sm text-muted py-8">Loading…</div>}>
      <JourneyAdminDetailClient journeyId={journeyId} />
    </Suspense>
  );
}
