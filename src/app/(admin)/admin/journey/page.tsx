import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import JourneyAdminClient from "@/app/(admin)/admin/journey/JourneyAdminClient";

export default async function AdminJourneyPage() {
  const session = await getServerSession(authOptions);
  // Middleware already blocks non-admin, but keep UX safe if middleware is bypassed.
  const role = (session as unknown as { role?: string })?.role ?? "user";
  if (!session || role !== "admin") {
    redirect("/home?error=not_admin");
  }

  return <JourneyAdminClient />;
}

