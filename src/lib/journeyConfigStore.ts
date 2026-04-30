import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { dummyStages } from "@/lib/journeyData";
import type { JourneyConfig, JourneyStageConfig } from "@/lib/journeyConfigTypes";
import { DEFAULT_CITY_ID, normalizeCityId } from "@/lib/cities";

const CONFIG_DIR = path.join(process.cwd(), "data");

function configPathForCity(cityId: string) {
  const safe = normalizeCityId(cityId);
  return path.join(CONFIG_DIR, `journeyConfig.${safe}.json`);
}

function nowIso() {
  return new Date().toISOString();
}

function seedFromDummy(): JourneyConfig {
  const stages: JourneyStageConfig[] = dummyStages.map((s) => ({
    id: s.id,
    title: s.title,
    weeksLabel: s.weeksLabel,
    description: "",
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
        description: "",
        address: "",
        location: undefined,
        completed: false,
        xp: t.xp,
        imageUrl: "/images/metro.png",
        galleryUrls: [],
      })),
    })),
  }));

  return { version: 1, updatedAt: nowIso(), stages };
}

export async function readJourneyConfigForCity(cityId: string): Promise<JourneyConfig> {
  const configPath = configPathForCity(cityId);
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as JourneyConfig;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.stages) || parsed.stages.length === 0) {
      return seedFromDummy();
    }
    // Normalize older configs.
    for (const s of parsed.stages) {
      if (typeof (s as { description?: unknown }).description !== "string") {
        (s as unknown as { description: string }).description = "";
      }
      for (const l of s.levels ?? []) {
        for (const t of l.tasks ?? []) {
          if (typeof (t as { completed?: unknown }).completed !== "boolean") {
            (t as unknown as { completed: boolean }).completed = false;
          }
          if (!Array.isArray(t.galleryUrls)) {
            t.galleryUrls = [];
          }
          if (typeof (t as { description?: unknown }).description !== "string") {
            (t as unknown as { description: string }).description = "";
          }
          if (typeof (t as { address?: unknown }).address !== "string") {
            (t as unknown as { address: string }).address = "";
          }
          const loc = (t as unknown as { location?: unknown }).location;
          if (loc && typeof loc === "object") {
            const l2 = loc as { lat?: unknown; lng?: unknown; radiusM?: unknown };
            const lat = typeof l2.lat === "number" ? l2.lat : NaN;
            const lng = typeof l2.lng === "number" ? l2.lng : NaN;
            const radiusM = typeof l2.radiusM === "number" ? l2.radiusM : undefined;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              (t as unknown as { location?: undefined }).location = undefined;
            } else {
              (t as unknown as { location: { lat: number; lng: number; radiusM?: number } }).location = {
                lat,
                lng,
                radiusM,
              };
            }
          } else if (loc != null) {
            (t as unknown as { location?: undefined }).location = undefined;
          }
        }
      }
    }
    return parsed;
  } catch {
    return seedFromDummy();
  }
}

export async function writeJourneyConfigForCity(cityId: string, next: JourneyConfig) {
  const configPath = configPathForCity(cityId);
  const safe: JourneyConfig = {
    version: 1,
    updatedAt: nowIso(),
    stages: next.stages ?? [],
  };
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(safe, null, 2), "utf8");
  return safe;
}

// Backward-compatible defaults (Bangalore).
export async function readJourneyConfig(): Promise<JourneyConfig> {
  return readJourneyConfigForCity(DEFAULT_CITY_ID);
}

export async function writeJourneyConfig(next: JourneyConfig) {
  return writeJourneyConfigForCity(DEFAULT_CITY_ID, next);
}

