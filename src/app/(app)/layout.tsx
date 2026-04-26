import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] flex flex-col">
      <div className="flex-1 pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}

