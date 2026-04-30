import type { JourneyListItem } from "@/lib/api/cityquest";
import type { JourneyStageConfig } from "@/lib/journeyConfigTypes";
import type { ProgressSummaryResponse } from "@/lib/api/cityquest";

type UiStatus = JourneyStageConfig["status"];

/** Matches static seed `data/seed-static-journey.json` journey ids. */
const STATIC_JOURNEY_UI_STATUS: Record<string, UiStatus> = {
  stranger: "completed",
  visitor: "in_progress",
  explorer: "locked",
  insider: "locked",
  bangalorean: "locked",
};

export function journeyUiStatusFromProgress(progress: ProgressSummaryResponse | null): UiStatus | null {
  const levels = progress?.levels;
  if (!levels?.length) return null;

  if (levels.every((l) => l.status === "completed")) return "completed";
  if (levels.some((l) => l.status === "in_progress")) return "in_progress";
  if (levels.every((l) => l.status === "locked")) return "locked";

  if (levels.some((l) => l.status === "completed" || l.status === "in_progress")) return "in_progress";
  return "locked";
}

/** If backend adds explicit user-facing status on list items, prefer it. */
export function uiStatusFromListItem(item: JourneyListItem): UiStatus | null {
  const raw =
    item.user_journey_status ??
    item.ui_status ??
    item.progress_status ??
    (item as { user_status?: string }).user_status;
  if (raw === "completed" || raw === "in_progress" || raw === "locked") return raw;
  return null;
}

/** Publication-only `status: active` does not imply user progress; treat as unknown. */
export function fallbackUiStatus(journeyId: string, index: number): UiStatus {
  if (STATIC_JOURNEY_UI_STATUS[journeyId]) return STATIC_JOURNEY_UI_STATUS[journeyId];
  if (index === 0) return "completed";
  if (index === 1) return "in_progress";
  return "locked";
}
