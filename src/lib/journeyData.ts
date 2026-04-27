export type JourneyCategory =
  | "food"
  | "history"
  | "activity"
  | "experience"
  | "dynamic"
  | "sponsored";

export const CATEGORY_LABEL: Record<JourneyCategory, string> = {
  food: "Food",
  history: "History",
  activity: "Activity",
  experience: "Experience",
  dynamic: "Dynamic",
  sponsored: "Sponsored",
};

export type JourneyTask = {
  id: string;
  category: JourneyCategory;
  title: string;
  completed: boolean;
  xp?: number;
};

export type JourneyLevel = {
  id: string;
  levelNumber: number; // 1..5 within a stage
  tasks: JourneyTask[]; // typically 6, one per category
};

export type JourneyStage = {
  id: string; // "stranger" | "visitor" | ...
  title: string;
  weeksLabel: string; // e.g. "Weeks 1 - 8"
  accent: "green" | "amber" | "purple";
  status: "locked" | "in_progress" | "completed";
  levels: JourneyLevel[]; // fixed to 5 for now
};

export function completedCount(level: JourneyLevel) {
  return level.tasks.filter((t) => t.completed).length;
}

export function isLevelCompleted(level: JourneyLevel) {
  // Rule: 3 of 6 category tasks completes the level
  return completedCount(level) >= 3;
}

export const dummyStages: JourneyStage[] = [
  {
    id: "stranger",
    title: "Stranger",
    weeksLabel: "Weeks 1 - 8",
    accent: "green",
    status: "completed",
    levels: [
      {
        id: "stranger-l1",
        levelNumber: 1,
        tasks: [
          { id: "s1l1-food", category: "food", title: "Benne Dosa at CTR.", completed: true },
          { id: "s1l1-history", category: "history", title: "Tour Bangalore Fort.", completed: true },
          { id: "s1l1-activity", category: "activity", title: "End-to-End Metro Ride.", completed: true },
          { id: "s1l1-experience", category: "experience", title: "Browse Blossom Book House.", completed: false },
          { id: "s1l1-dynamic", category: "dynamic", title: "Avarekai Mela Visit.", completed: false },
          { id: "s1l1-sponsored", category: "sponsored", title: "10% Off Maverick Coffee.", completed: false },
        ],
      },
      {
        id: "stranger-l2",
        levelNumber: 2,
        tasks: [
          { id: "s1l2-food", category: "food", title: "Filter Coffee at Brahmin's.", completed: true },
          { id: "s1l2-history", category: "history", title: "Vidhana Soudha (Night).", completed: true },
          { id: "s1l2-activity", category: "activity", title: "Cubbon Park Dog Park.", completed: false },
          { id: "s1l2-experience", category: "experience", title: "Gandhi Bazaar Flowers.", completed: false },
          { id: "s1l2-dynamic", category: "dynamic", title: "Lalbagh Flower Show.", completed: false },
          { id: "s1l2-sponsored", category: "sponsored", title: "Free Drink at Toit.", completed: false },
        ],
      },
      {
        id: "stranger-l3",
        levelNumber: 3,
        tasks: [
          { id: "s1l3-food", category: "food", title: "Shivaji Military Hotel.", completed: false },
          { id: "s1l3-history", category: "history", title: "Bull Temple Monolith.", completed: false },
          { id: "s1l3-activity", category: "activity", title: "Sankey Tank Sunset.", completed: false },
          { id: "s1l3-experience", category: "experience", title: "Ranga Shankara Play.", completed: false },
          { id: "s1l3-dynamic", category: "dynamic", title: "Chitra Santhe Fair.", completed: false },
          { id: "s1l3-sponsored", category: "sponsored", title: "10% Off Bangalore Cafe.", completed: false },
        ],
      },
      {
        id: "stranger-l4",
        levelNumber: 4,
        tasks: [
          { id: "s1l4-food", category: "food", title: "VV Puram Street Food.", completed: false },
          { id: "s1l4-history", category: "history", title: "NGMA Art Gallery.", completed: false },
          { id: "s1l4-activity", category: "activity", title: "100ft Rd Walk.", completed: false },
          { id: "s1l4-experience", category: "experience", title: "Single-Screen Cinema.", completed: false },
          { id: "s1l4-dynamic", category: "dynamic", title: "IPL Match Screening.", completed: false },
          { id: "s1l4-sponsored", category: "sponsored", title: "15% Off EatConfetti.", completed: false },
        ],
      },
      {
        id: "stranger-l5",
        levelNumber: 5,
        tasks: [
          { id: "s1l5-food", category: "food", title: "Corner House DBC.", completed: false },
          { id: "s1l5-history", category: "history", title: "Someshwara Inscriptions.", completed: false },
          { id: "s1l5-activity", category: "activity", title: "Richards Town Bungalows.", completed: false },
          { id: "s1l5-experience", category: "experience", title: "Live Jazz Night.", completed: false },
          { id: "s1l5-dynamic", category: "dynamic", title: "Bangalore Lit Fest.", completed: false },
          { id: "s1l5-sponsored", category: "sponsored", title: "Deal at MAP Museum.", completed: false },
        ],
      },
    ],
  },
  {
    id: "visitor",
    title: "Visitor",
    weeksLabel: "Weeks 9 - 20",
    accent: "amber",
    status: "in_progress",
    levels: Array.from({ length: 5 }).map((_, idx) => ({
      id: `visitor-l${idx + 1}`,
      levelNumber: idx + 1,
      tasks: ([
        "food",
        "history",
        "activity",
        "experience",
        "dynamic",
        "sponsored",
      ] as JourneyCategory[]).map((category) => ({
        id: `visitor-l${idx + 1}-${category}`,
        category,
        title: "Coming soon",
        completed: false,
      })),
    })),
  },
  {
    id: "explorer",
    title: "Explorer",
    weeksLabel: "Weeks 21 - 36",
    accent: "purple",
    status: "locked",
    levels: Array.from({ length: 5 }).map((_, idx) => ({
      id: `explorer-l${idx + 1}`,
      levelNumber: idx + 1,
      tasks: ([
        "food",
        "history",
        "activity",
        "experience",
        "dynamic",
        "sponsored",
      ] as JourneyCategory[]).map((category) => ({
        id: `explorer-l${idx + 1}-${category}`,
        category,
        title: "Locked",
        completed: false,
      })),
    })),
  },
  {
    id: "insider",
    title: "Insider",
    weeksLabel: "Weeks 37 - 44",
    accent: "purple",
    status: "locked",
    levels: Array.from({ length: 5 }).map((_, idx) => ({
      id: `insider-l${idx + 1}`,
      levelNumber: idx + 1,
      tasks: ([
        "food",
        "history",
        "activity",
        "experience",
        "dynamic",
        "sponsored",
      ] as JourneyCategory[]).map((category) => ({
        id: `insider-l${idx + 1}-${category}`,
        category,
        title: "Locked",
        completed: false,
      })),
    })),
  },
  {
    id: "bangalorean",
    title: "Bangalorean",
    weeksLabel: "Weeks 45 - 52",
    accent: "purple",
    status: "locked",
    levels: Array.from({ length: 5 }).map((_, idx) => ({
      id: `bangalorean-l${idx + 1}`,
      levelNumber: idx + 1,
      tasks: ([
        "food",
        "history",
        "activity",
        "experience",
        "dynamic",
        "sponsored",
      ] as JourneyCategory[]).map((category) => ({
        id: `bangalorean-l${idx + 1}-${category}`,
        category,
        title: "Locked",
        completed: false,
      })),
    })),
  },
];

