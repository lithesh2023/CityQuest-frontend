import { apiFetch } from "@/lib/api/http";

export type JourneyListItem = {
  id: string;
  title: string;
  description?: string | null;
  level_count?: number | null;
  /** Publication state (active/inactive), not user journey progress */
  status?: "active" | "inactive" | string;
  /** Prefer these when backend sends user-specific journey state on list */
  user_journey_status?: "locked" | "in_progress" | "completed";
  ui_status?: "locked" | "in_progress" | "completed";
  progress_status?: "locked" | "in_progress" | "completed" | string;
};

export type JourneyListResponse = {
  items: JourneyListItem[];
};

export type Location = {
  id: string;
  slug: string;
  name: string;
};

export type LocationListResponse = {
  items: Location[];
};

export type JourneyLevelSummary = {
  id: string;
  title?: string | null;
  order?: number | null;
  mission_count?: number | null;
};

export type JourneyDetailResponse = {
  id: string;
  title: string;
  description?: string | null;
  image_key?: string;
  image_url?: string;
  levels?: JourneyLevelSummary[];
};

export type MissionGeoRule = {
  type: string;
  lat: number;
  lng: number;
  radius_m?: number;
};

export type Mission = {
  id: string;
  title: string;
  description?: string | null;
  address?: string | null;
  task_type?: string | null;
  xp?: number | null;
  geo_rule?: MissionGeoRule | null;
  image_key?: string;
  image_url?: string;
};

export type MyJourneyResponse = {
  assigned_journey_id?: string;
  current_journey_id?: string;
  stages?: Array<{
    id: string;
    title: string;
    description?: string | null;
    weeks_label?: string | null;
    accent?: string | null;
    order?: number | null;
    status?: "locked" | "in_progress" | "completed" | string;
  }>;
  journey: {
    id: string;
    title: string;
    description?: string | null;
    weeks_label?: string | null;
    accent?: string | null;
    levels: Array<{
      id: string;
      title: string;
      order: number;
      min_completion_ratio?: number;
      missions: Array<{
        id: string;
        title: string;
        description?: string | null;
        task_type?: string | null;
        xp?: number | null;
      }>;
    }>;
  };
};

export type LevelDetailResponse = {
  id: string;
  journey_id?: string | null;
  title: string;
  order?: number | null;
  missions: Mission[];
};

export type MissionDetailResponse = {
  id: string;
  level_id?: string | null;
  title: string;
  description?: string | null;
  address?: string | null;
  task_type?: string | null;
  xp?: number | null;
  geo_rule?: MissionGeoRule | null;
  image_key?: string;
  image_url?: string;
};

export type ProgressLevel = {
  level_id: string;
  status: "locked" | "in_progress" | "completed" | string;
  completed_at?: string | null;
};

export type ProgressSummaryResponse = {
  journey_id: string;
  levels: ProgressLevel[];
};

export type LevelProgressMission = {
  mission_id: string;
  status: "locked" | "in_progress" | "completed" | "rejected" | string;
  submission_id?: string | null;
};

export type LevelProgressResponse = {
  level_id: string;
  missions: LevelProgressMission[];
};

export type UploadRequestPayload = {
  purpose: "mission_proof" | string;
  content_type: string;
  file_name: string;
  size_bytes: number;
  sha256?: string;
};

export type UploadRequestResponse = {
  upload_id: string;
  method: "PUT" | "POST";
  upload_url: string;
  file_key: string;
  expires_at?: string | null;
};

export type UploadConfirmPayload = { upload_id: string };
export type UploadConfirmResponse = { ok: boolean; file_key?: string };

export type MissionSubmissionPayload = {
  file_key: string;
  geo: { lat: number; lng: number; accuracy_m: number; captured_at: string };
  device?: { platform?: string; user_agent?: string };
  notes?: string;
};

export type MissionSubmissionResponse = {
  submission: {
    id: string;
    mission_id: string;
    status: "accepted" | "rejected" | string;
    rejection_reason?: string | null;
    geo_validation?: unknown;
    file?: { file_key: string; url?: string | null };
    created_at?: string | null;
  };
  progress_update?: unknown;
};

export async function listJourneys(cityId?: string | null): Promise<JourneyListResponse> {
  // Legacy signature kept for backward-compat; backend list is not location-specific.
  void cityId;
  return apiFetch<JourneyListResponse>(`/v1/journeys`);
}

export async function listLocations(): Promise<LocationListResponse> {
  return apiFetch<LocationListResponse>(`/v1/locations`);
}

export async function selectMyLocation(location: string, authToken?: string | null) {
  return apiFetch<{ location: Location; journey_id: string; assigned_at: string }>(`/v1/me/location`, {
    method: "POST",
    body: JSON.stringify({ location }),
    authToken,
  });
}

export async function getMyJourneyForLocation(location: string, authToken?: string | null) {
  return apiFetch<MyJourneyResponse>(`/v1/me/journey?location=${encodeURIComponent(location)}`, {
    authToken,
  });
}

export type MySummaryResponse = {
  user: { id: string; name: string | null; email: string | null };
  location: { id: string; slug: string; name: string };
  assigned: boolean;
  macro: { completed_stages: number; total_stages: number };
  progress: {
    distinct_missions_completed: number;
    xp_from_completed_missions: number;
    accepted_submissions_total: number;
    geo_missions_completed: number;
    xp_ceiling_location: number;
  };
  geo: { distance_walked_m: number };
  current: null | {
    journey_id: string;
    journey_title: string;
    journey_description: string;
    weeks_label?: string;
    level_id: string;
    level_order: number;
    level_title: string;
    level_display: string;
    missions_total: number;
    missions_completed: number;
    min_completion_ratio: number;
    xp_completed_this_level: number;
    xp_total_this_level: number;
  };
};

export async function getMySummary(location: string, authToken?: string | null) {
  return apiFetch<MySummaryResponse>(`/v1/me/summary?location=${encodeURIComponent(location)}`, {
    authToken,
  });
}

export type MapCompletionItem = {
  submission_id: string;
  mission_id: string;
  mission_title: string;
  mission_address?: string | null;
  lat: number;
  lng: number;
  accuracy_m?: number | null;
  captured_at?: string | null;
  submitted_at: string;
  level_order: number;
  journey_title: string;
};

export type MapCompletionsResponse = {
  location: { id: string; slug: string; name: string };
  items: MapCompletionItem[];
};

export async function getMyMapCompletions(location: string, authToken?: string | null) {
  return apiFetch<MapCompletionsResponse>(`/v1/me/map-completions?location=${encodeURIComponent(location)}`, {
    authToken,
  });
}

export async function getJourney(journeyId: string): Promise<JourneyDetailResponse> {
  return apiFetch<JourneyDetailResponse>(`/v1/journeys/${encodeURIComponent(journeyId)}`);
}

export async function getLevel(levelId: string): Promise<LevelDetailResponse> {
  return apiFetch<LevelDetailResponse>(`/v1/levels/${encodeURIComponent(levelId)}`);
}

export async function getMission(missionId: string): Promise<MissionDetailResponse> {
  return apiFetch<MissionDetailResponse>(`/v1/missions/${encodeURIComponent(missionId)}`);
}

export async function getMyProgressSummary(journeyId: string, authToken?: string | null) {
  return apiFetch<ProgressSummaryResponse>(`/v1/me/progress?journey_id=${encodeURIComponent(journeyId)}`, {
    authToken,
  });
}

export async function getMyLevelProgress(levelId: string, authToken?: string | null) {
  return apiFetch<LevelProgressResponse>(`/v1/me/levels/${encodeURIComponent(levelId)}/progress`, {
    authToken,
  });
}

export async function requestUpload(payload: UploadRequestPayload, authToken?: string | null) {
  return apiFetch<UploadRequestResponse>("/v1/uploads/request", {
    method: "POST",
    body: JSON.stringify(payload),
    authToken,
  });
}

export async function requestUploadForLocation(
  location: string,
  payload: UploadRequestPayload,
  authToken?: string | null,
) {
  const q = `?location=${encodeURIComponent(location)}`;
  return apiFetch<UploadRequestResponse>(`/v1/uploads/request${q}`, {
    method: "POST",
    body: JSON.stringify(payload),
    authToken,
  });
}

export async function confirmUpload(payload: UploadConfirmPayload, authToken?: string | null) {
  return apiFetch<UploadConfirmResponse>("/v1/uploads/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
    authToken,
  });
}

export async function submitMission(missionId: string, payload: MissionSubmissionPayload, authToken?: string | null) {
  return apiFetch<MissionSubmissionResponse>(`/v1/missions/${encodeURIComponent(missionId)}/submissions`, {
    method: "POST",
    body: JSON.stringify(payload),
    authToken,
  });
}

export async function completeLevel(levelId: string, journeyId: string, authToken?: string | null) {
  return apiFetch<{ level_id: string; status: string; completed_at?: string | null }>(
    `/v1/levels/${encodeURIComponent(levelId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify({ journey_id: journeyId }),
      authToken,
    },
  );
}

