import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LocationsAdminClient from "@/app/(admin)/admin/locations/LocationsAdminClient";

export default async function AdminLocationsPage() {
  const session = await getServerSession(authOptions);
  const role = (session as unknown as { role?: string })?.role ?? "user";
  if (!session || role !== "admin") {
    redirect("/home?error=not_admin");
  }
  return <LocationsAdminClient />;
}

