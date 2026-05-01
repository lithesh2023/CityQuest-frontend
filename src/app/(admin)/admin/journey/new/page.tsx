import { Suspense } from "react";
import JourneyAdminCreateClient from "@/app/(admin)/admin/journey/JourneyAdminCreateClient";

export default function AdminJourneyNewPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted py-8">Loading…</div>}>
      <JourneyAdminCreateClient />
    </Suspense>
  );
}
