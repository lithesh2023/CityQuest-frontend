export type QuestTaskType =
  | "history"
  | "food"
  | "activity"
  | "culture"
  | "dynamic"
  | "sponsored";

export type QuestTask = {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: QuestTaskType;
  completed: boolean;
};

export type QuestLevel = {
  id: string;
  levelNumber: number;
  title: string; // "Stranger", "Visitor", ...
  weekRangeLabel: string; // "Weeks 1 - 8"
  completedTasks: number;
  totalTasks: number;
  status: "locked" | "in_progress" | "completed";
  accent: "green" | "amber" | "purple";
  tasks: QuestTask[];
};

export const dummyLevels: QuestLevel[] = [
  {
    id: "lvl-1",
    levelNumber: 1,
    title: "Stranger",
    weekRangeLabel: "Weeks 1 - 8",
    completedTasks: 6,
    totalTasks: 6,
    status: "completed",
    accent: "green",
    tasks: [
      {
        id: "t1",
        title: "Take your first Metro ride",
        description: "Ride end-to-end and snap a selfie outside the station.",
        xp: 100,
        type: "activity",
        completed: true,
      },
      {
        id: "t2",
        title: "Benne Dosa at CTR",
        description: "Try a Bengaluru classic and rate it.",
        xp: 100,
        type: "food",
        completed: true,
      },
      {
        id: "t3",
        title: "Tour Bangalore Fort",
        description: "Walk the ruins and learn one story to share.",
        xp: 100,
        type: "history",
        completed: true,
      },
      {
        id: "t4",
        title: "Browse Blossom Book House",
        description: "Pick a local author or a city-themed book.",
        xp: 100,
        type: "culture",
        completed: true,
      },
      {
        id: "t5",
        title: "Avarekai Mela visit (Dynamic)",
        description: "Catch a seasonal event and collect points.",
        xp: 150,
        type: "dynamic",
        completed: true,
      },
      {
        id: "t6",
        title: "10% Off Maverick Coffee (Sponsored)",
        description: "Redeem a partner offer to support the ecosystem.",
        xp: 150,
        type: "sponsored",
        completed: true,
      },
    ],
  },
  {
    id: "lvl-2",
    levelNumber: 2,
    title: "Visitor",
    weekRangeLabel: "Weeks 9 - 20",
    completedTasks: 3,
    totalTasks: 6,
    status: "in_progress",
    accent: "amber",
    tasks: [
      {
        id: "t7",
        title: "Use BMTC bus to travel",
        description: "Take any bus route, note one new stop name.",
        xp: 100,
        type: "activity",
        completed: true,
      },
      {
        id: "t8",
        title: "Find and use a Namma Cycle station",
        description: "Unlock a cycle and ride for at least 10 minutes.",
        xp: 100,
        type: "activity",
        completed: true,
      },
      {
        id: "t9",
        title: "Navigate peak hour traffic",
        description: "Plan a smart route and save 10 minutes.",
        xp: 100,
        type: "culture",
        completed: true,
      },
      {
        id: "t10",
        title: "Walk a complete 3 km in your area",
        description: "Discover one shortcut or hidden lane.",
        xp: 100,
        type: "activity",
        completed: false,
      },
      {
        id: "t11",
        title: "Weekend market stroll",
        description: "Explore a local market and try one snack.",
        xp: 100,
        type: "food",
        completed: false,
      },
      {
        id: "t12",
        title: "Partner deal: local cafe",
        description: "Redeem a discount and post your collage.",
        xp: 150,
        type: "sponsored",
        completed: false,
      },
    ],
  },
  {
    id: "lvl-3",
    levelNumber: 3,
    title: "Explorer",
    weekRangeLabel: "Weeks 21 - 36",
    completedTasks: 0,
    totalTasks: 6,
    status: "locked",
    accent: "purple",
    tasks: [],
  },
  {
    id: "lvl-4",
    levelNumber: 4,
    title: "Insider",
    weekRangeLabel: "Weeks 37 - 44",
    completedTasks: 0,
    totalTasks: 6,
    status: "locked",
    accent: "purple",
    tasks: [],
  },
];

