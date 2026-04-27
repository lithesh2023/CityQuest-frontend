import type { JourneyCategory } from "@/lib/journeyData";

export type JourneyTaskConfig = {
  id: string;
  category: JourneyCategory;
  title: string;
  completed: boolean;
  xp?: number;
  imageUrl?: string;
  galleryUrls?: string[];
};

export type JourneyLevelConfig = {
  id: string;
  levelNumber: number;
  imageUrl?: string;
  tasks: JourneyTaskConfig[];
};

export type JourneyStageConfig = {
  id: string;
  title: string;
  weeksLabel: string;
  accent: "green" | "amber" | "purple";
  status: "locked" | "in_progress" | "completed";
  imageUrl?: string;
  levels: JourneyLevelConfig[];
};

export type JourneyConfig = {
  version: 1;
  updatedAt: string;
  stages: JourneyStageConfig[];
};

