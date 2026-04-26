"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Route, Users, User } from "lucide-react";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/journey", label: "Journey", icon: Route },
  { href: "/map", label: "Map", icon: Map },
  { href: "/community", label: "Community", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto max-w-md px-3 py-2">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition",
                  active
                    ? "bg-accent/10 ring-1 ring-accent/15 text-foreground"
                    : "text-muted hover:text-foreground hover:bg-black/5",
                )}
              >
                <Icon className={cx("h-5 w-5", active && "text-accent")} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-[max(0px,env(safe-area-inset-bottom))]" />
    </nav>
  );
}

