"use client";

import { motion } from "framer-motion";
import { Crown, Leaf, Lock, Sparkles } from "lucide-react";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export function LevelBadge({
  levelNumber,
  title,
  status,
  accent = "purple",
  variant = "number",
}: {
  levelNumber: number;
  title: string;
  status: "locked" | "in_progress" | "completed";
  accent?: "green" | "amber" | "purple";
  variant?: "number" | "icon";
}) {
  const palette =
    accent === "green"
      ? {
          ring: "ring-emerald-500/25",
          fill: "from-emerald-400 to-emerald-600",
          chip: "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20",
        }
      : accent === "amber"
        ? {
            ring: "ring-amber-500/25",
            fill: "from-amber-400 to-amber-600",
            chip: "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20",
          }
        : {
            ring: "ring-violet-500/25",
            fill: "from-violet-500 to-indigo-600",
            chip: "bg-violet-500/15 text-violet-800 ring-1 ring-violet-500/20",
          };

  const icon =
    status === "locked" ? (
      <Lock className="h-4 w-4 text-muted" />
    ) : status === "completed" ? (
      <Sparkles className="h-4 w-4 text-warning" />
    ) : (
      <span className={cx("h-2 w-2 rounded-full bg-accent")} />
    );

  const centerIcon =
    levelNumber === 1 ? (
      <Leaf className="h-5 w-5 text-emerald-700" />
    ) : levelNumber === 2 ? (
      <Crown className="h-5 w-5 text-amber-700" />
    ) : (
      <Sparkles className="h-5 w-5 text-violet-800" />
    );

  return (
    <motion.div
      layout
      className={cx(
        "relative h-14 w-14 rounded-full",
        status === "locked"
          ? "bg-white/70 ring-1 ring-black/10"
          : cx("bg-gradient-to-b", palette.fill, "ring-1", palette.ring),
        "shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_10px_30px_rgba(109,40,217,0.18)]",
      )}
    >
      <div className="absolute inset-0 rounded-full [mask-image:radial-gradient(circle_at_30%_25%,black_30%,transparent_62%)] bg-white/25" />
      <div className="absolute inset-1 rounded-full bg-card ring-1 ring-black/10 flex items-center justify-center">
        {variant === "icon" ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 ring-1 ring-black/10">
            {status === "locked" ? (
              <Lock className="h-4 w-4 text-muted" />
            ) : (
              centerIcon
            )}
          </div>
        ) : (
          <div className="text-center leading-none">
            <div className="text-[10px] font-semibold text-muted">Level</div>
            <div className="text-[16px] font-extrabold tracking-tight text-foreground">
              {levelNumber}
            </div>
          </div>
        )}
      </div>
      <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card ring-1 ring-black/10 flex items-center justify-center">
        {icon}
      </div>

      <span className="sr-only">{title}</span>
    </motion.div>
  );
}

