import type { JourneyStageConfig, JourneyLevelConfig, JourneyTaskConfig } from "@/lib/journeyConfigTypes";
import type { JourneyCategory } from "@/lib/journeyData";
import type {
  JourneyDetailResponse,
  LevelDetailResponse,
  LevelProgressResponse,
  Mission,
  MissionDetailResponse,
} from "@/lib/api/cityquest";

function taskTypeToCategory(taskType: string | null | undefined): JourneyCategory {
  const t = (taskType ?? "").toLowerCase();
  if (t.includes("food")) return "food";
  if (t.includes("history")) return "history";
  if (t.includes("activity")) return "activity";
  return "experience";
}

/** Build task UI config from API mission (level list or mission detail). */
export function apiMissionToTaskConfig(m: Mission | MissionDetailResponse, completed: boolean): JourneyTaskConfig {
  const gr = m.geo_rule;
  const location =
    gr && typeof gr.lat === "number" && typeof gr.lng === "number"
      ? {
          lat: gr.lat,
          lng: gr.lng,
          ...(typeof gr.radius_m === "number" ? { radiusM: gr.radius_m } : {}),
        }
      : undefined;
  const addr = typeof m.address === "string" ? m.address.trim() : "";
  return {
    id: m.id,
    category: taskTypeToCategory(m.task_type),
    title: m.title,
    ...(typeof m.description === "string" && m.description.trim()
      ? { description: m.description.trim() }
      : {}),
    ...(addr ? { address: addr } : {}),
    ...(location ? { location } : {}),
    completed,
    xp: m.xp ?? 100,
    imageUrl: (m as any)?.image_url || "/images/metro.png",
    galleryUrls: [],
  };
}

function clampAccent(accent: string | undefined): JourneyStageConfig["accent"] {
  if (accent === "green" || accent === "amber" || accent === "purple") return accent;
  return "amber";
}

function clampStatus(status: string | undefined): JourneyStageConfig["status"] {
  if (status === "completed" || status === "in_progress" || status === "locked") return status;
  if (status === "active") return "in_progress";
  if (status === "inactive") return "locked";
  return "in_progress";
}

export function journeyToStageConfig(j: JourneyDetailResponse): JourneyStageConfig {
  return {
    id: j.id,
    title: j.title,
    weeksLabel: j.description ?? "",
    accent: clampAccent(undefined),
    status: clampStatus(undefined),
    imageUrl: j.image_url || "/images/metro.png",
    levels:
      j.levels?.map((l) => ({
        id: l.id,
        levelNumber: l.order ?? 0,
        imageUrl: j.image_url || "/images/metro.png",
        tasks: [],
      })) ?? [],
  };
}

export function levelToLevelConfig(
  stage: JourneyStageConfig,
  level: LevelDetailResponse,
  levelNumber: number,
  progress?: LevelProgressResponse | null,
): JourneyLevelConfig {
  const completedMissionIds = new Set(
    progress?.missions?.filter((m) => m.status === "completed").map((m) => m.mission_id) ?? [],
  );

  const tasks: JourneyTaskConfig[] = (level.missions ?? []).map((m) =>
    apiMissionToTaskConfig(m, completedMissionIds.has(m.id)),
  );

  return {
    id: level.id,
    levelNumber,
    imageUrl: stage.imageUrl,
    tasks,
  };
}

