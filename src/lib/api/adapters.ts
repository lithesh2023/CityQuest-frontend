import type { JourneyStageConfig, JourneyLevelConfig, JourneyTaskConfig } from "@/lib/journeyConfigTypes";
import type { JourneyDetailResponse, LevelDetailResponse, LevelProgressResponse } from "@/lib/api/cityquest";

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
    imageUrl: "/images/metro.png",
    levels:
      j.levels?.map((l) => ({
        id: l.id,
        levelNumber: l.order ?? 0,
        imageUrl: "/images/metro.png",
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

  const tasks: JourneyTaskConfig[] = (level.missions ?? []).map((m) => ({
    id: m.id,
    category: "experience",
    title: m.title,
    completed: completedMissionIds.has(m.id),
    xp: 100,
    imageUrl: "/images/metro.png",
    galleryUrls: [],
  }));

  return {
    id: level.id,
    levelNumber,
    imageUrl: stage.imageUrl,
    tasks,
  };
}

