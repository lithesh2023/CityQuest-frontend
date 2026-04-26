import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/home");

  return (
    <main className="min-h-[100svh] flex items-stretch justify-center">
      <div className="relative w-full max-w-md overflow-hidden">
        <Image
          src="/images/landing-bg.png"
          alt="City skyline at sunset"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/75" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-10 pt-16">
          <div className="text-center text-white">
            <div className="text-5xl font-semibold tracking-tight">52</div>
            <div className="mt-1 text-sm font-semibold tracking-[0.35em] opacity-90">
              WEEKS
            </div>
            <div className="mt-1 text-sm font-semibold tracking-[0.35em] opacity-90">
              TO BELONG
            </div>

            <div className="mt-3 text-xs font-semibold tracking-[0.35em] opacity-95">
              BANGALORE
            </div>

            <div className="mt-10 text-base font-semibold leading-tight">
              Explore. Experience.
              <br />
              Belong.
            </div>
            <p className="mt-3 text-sm text-white/80 leading-relaxed">
              A gamified journey to understand and fall in love with your new city.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/login"
              className="block w-full rounded-2xl bg-accent text-white py-3.5 text-sm font-semibold text-center shadow-[0_18px_60px_rgba(109,40,217,0.45)] hover:brightness-105 active:brightness-95 transition"
            >
              Start Your Journey
            </Link>
            <div className="mt-3 text-center text-xs text-white/80">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-semibold underline underline-offset-4">
                Log in
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    </main>
  );
}
