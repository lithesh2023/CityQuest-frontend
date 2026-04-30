import type { JourneyCategory } from "@/lib/journeyData";

export type JourneyTaskLocation = {
  lat: number;
  lng: number;
  /** Optional validation radius for geo tasks */
  radiusM?: number;
};

export type JourneyTaskConfig = {
  id: string;
  category: JourneyCategory;
  title: string;
  description?: string;
  /** Human-friendly address for the task location */
  address?: string;
  /** Target location for geo validation / hints */
  location?: JourneyTaskLocation;
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
  description?: string;
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

