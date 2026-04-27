const KEY = "cityquest.journey.completedTaskIds.v1";

function safeParse(json: string | null): string[] {
  if (!json) return [];
  try {
    const val = JSON.parse(json);
    return Array.isArray(val) ? val.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function getCompletedTaskIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return new Set(safeParse(window.localStorage.getItem(KEY)));
}

export function setCompletedTaskIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
}

export function isTaskCompleted(
  task: { id: string; completed?: boolean },
  completedTaskIds: Set<string>,
) {
  return completedTaskIds.has(task.id) || Boolean(task.completed);
}

export function markTaskCompleted(taskId: string) {
  const ids = getCompletedTaskIds();
  ids.add(taskId);
  setCompletedTaskIds(ids);
  return ids;
}

