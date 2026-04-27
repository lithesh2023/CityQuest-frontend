import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { dummyStages } from "@/lib/journeyData";
import type { JourneyConfig, JourneyStageConfig } from "@/lib/journeyConfigTypes";

const CONFIG_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(CONFIG_DIR, "journeyConfig.json");

function nowIso() {
  return new Date().toISOString();
}

function seedFromDummy(): JourneyConfig {
  const stages: JourneyStageConfig[] = dummyStages.map((s) => ({
    id: s.id,
    title: s.title,
    weeksLabel: s.weeksLabel,
    accent: s.accent,
    status: s.status,
    imageUrl: "/images/metro.png",
    levels: s.levels.map((l) => ({
      id: l.id,
      levelNumber: l.levelNumber,
      imageUrl: "/images/metro.png",
      tasks: l.tasks.map((t) => ({
        id: t.id,
        category: t.category,
        title: t.title,
        completed: false,
        xp: t.xp,
        imageUrl: "/images/metro.png",
        galleryUrls: [],
      })),
    })),
  }));

  return { version: 1, updatedAt: nowIso(), stages };
}

export async function readJourneyConfig(): Promise<JourneyConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as JourneyConfig;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.stages) || parsed.stages.length === 0) {
      return seedFromDummy();
    }
    // Normalize older configs.
    for (const s of parsed.stages) {
      for (const l of s.levels ?? []) {
        for (const t of l.tasks ?? []) {
          if (typeof (t as { completed?: unknown }).completed !== "boolean") {
            (t as unknown as { completed: boolean }).completed = false;
          }
          if (!Array.isArray(t.galleryUrls)) {
            t.galleryUrls = [];
          }
        }
      }
    }
    return parsed;
  } catch {
    return seedFromDummy();
  }
}

export async function writeJourneyConfig(next: JourneyConfig) {
  const safe: JourneyConfig = {
    version: 1,
    updatedAt: nowIso(),
    stages: next.stages ?? [],
  };
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(safe, null, 2), "utf8");
  return safe;
}

