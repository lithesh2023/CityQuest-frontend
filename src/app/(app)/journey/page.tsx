import JourneyClient from "./JourneyClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function JourneyPage() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;
  if (!session || !accessToken) redirect("/login?from=/journey");
  return <JourneyClient />;
}

