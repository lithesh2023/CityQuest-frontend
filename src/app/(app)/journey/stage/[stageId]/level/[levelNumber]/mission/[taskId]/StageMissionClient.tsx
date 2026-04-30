"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import type {
  JourneyLevelConfig,
  JourneyStageConfig,
  JourneyTaskConfig,
} from "@/lib/journeyConfigTypes";
import {
  getCompletedTaskIds,
  isTaskCompleted,
  markTaskCompleted,
} from "@/lib/journeyProgress";
import { confirmUpload, requestUploadForLocation, submitMission } from "@/lib/api/cityquest";
import type { ApiError } from "@/lib/api/http";
import { useSelectedLocation } from "@/lib/useSelectedLocation";

export default function StageMissionClient({
  stage,
  level,
  task,
}: {
  stage: JourneyStageConfig;
  level: JourneyLevelConfig;
  task: JourneyTaskConfig;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { locationSlug } = useSelectedLocation();
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => getCompletedTaskIds());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = stage.status === "locked";
  const done = isTaskCompleted(task, completedIds);

  const hero = useMemo(
    () => task.imageUrl || level.imageUrl || stage.imageUrl || "/images/metro.png",
    [task.imageUrl, level.imageUrl, stage.imageUrl],
  );

  async function getGeo(): Promise<{ lat: number; lng: number; accuracy_m: number; captured_at: string }> {
    const captured_at = new Date().toISOString();
    if (!("geolocation" in navigator)) {
      throw new Error("Geolocation is not available on this device/browser.");
    }

    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy_m: pos.coords.accuracy,
      captured_at,
    };
  }

  async function onSubmitProof() {
    setError(null);
    if (isLocked) return;
    if (!selectedFile) {
      setError("Please select a photo first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;
      if (!authToken) {
        throw new Error("Not authenticated. Please log in again.");
      }
      const upload = await requestUploadForLocation(
        locationSlug,
        {
          purpose: "mission_proof",
          content_type: selectedFile.type || "application/octet-stream",
          file_name: selectedFile.name || "proof",
          size_bytes: selectedFile.size,
        },
        authToken,
      );

      const putRes = await fetch(upload.upload_url, {
        method: upload.method ?? "PUT",
        headers: { "content-type": selectedFile.type || "application/octet-stream" },
        body: selectedFile,
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
      }

      try {
        await confirmUpload({ upload_id: upload.upload_id }, authToken);
      } catch {
        // confirm is optional server-side
      }

      const geo = await getGeo();
      const sub = await submitMission(task.id, {
        file_key: upload.file_key,
        geo,
        device: { platform: "web", user_agent: navigator.userAgent },
      }, authToken);

      if (sub.submission.status !== "accepted") {
        setError(sub.submission.rejection_reason ?? "Submission rejected.");
        return;
      }

      const ids = markTaskCompleted(task.id);
      setCompletedIds(new Set(ids));
      router.push(`/journey/stage/${stage.id}/level/${level.levelNumber}`);
      router.refresh();
    } catch (e) {
      const err = e as Partial<ApiError>;
      setError(typeof err?.message === "string" ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-8">
      <header className="flex items-center justify-between">
        <Link
          href={`/journey/stage/${stage.id}/level/${level.levelNumber}`}
          className="grid h-9 w-9 place-items-center rounded-2xl bg-black/5 ring-1 ring-black/8 hover:bg-black/10"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="text-sm font-semibold">Mission</div>
        <div className="h-9 w-9" />
      </header>

      <section className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-black/8 shadow-[0_18px_60px_rgba(109,40,217,0.12)]">
        <div className="p-5">
          <div className="relative h-40 overflow-hidden rounded-3xl bg-black/5 ring-1 ring-black/8">
            <Image
              src={hero}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <h1 className="mt-4 text-lg font-semibold tracking-tight">{task.title}</h1>
          <div className="mt-1 text-sm font-semibold text-accent-2">+{task.xp ?? 100} XP</div>
          <p className="mt-2 text-sm text-muted">
            {stage.title} • Level {level.levelNumber} • {task.category}
          </p>

          <div className="mt-5">
            <div className="text-sm font-semibold">How to complete</div>
            <div className="mt-3 space-y-2">
              {["Do the experience in the city", "Upload a picture as proof"].map((step) => (
                <div key={step} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent-2" aria-hidden="true" />
                  <div className="text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {Array.isArray(task.galleryUrls) && task.galleryUrls.length ? (
            <div className="mt-5">
              <div className="text-sm font-semibold">Reference images</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {task.galleryUrls.slice(0, 9).map((u) => (
                  <div
                    key={u}
                    className="relative aspect-square overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8"
                  >
                    <Image src={u} alt="" fill className="object-cover" sizes="(max-width: 768px) 33vw, 140px" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <div className="text-sm font-semibold">Proof photo</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <input
                type="file"
                accept="image/*"
                className="block w-full text-xs text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground hover:file:bg-black/10"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                disabled={isLocked || isSubmitting}
              />
            </div>
            {selectedFile ? (
              <div className="mt-2 text-[11px] text-muted truncate">
                Selected: <span className="font-semibold text-foreground">{selectedFile.name}</span>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            disabled={isLocked || isSubmitting}
            className={[
              "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.28)] transition",
              isLocked ? "opacity-60 cursor-not-allowed" : "hover:brightness-105 active:brightness-95",
            ].join(" ")}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {selectedFile ? "Photo selected" : "Choose Photo"}
          </button>

          <button
            type="button"
            disabled={isLocked || done || isSubmitting}
            onClick={onSubmitProof}
            className={[
              "mt-3 w-full rounded-2xl py-2 text-sm font-semibold ring-1 transition",
              done
                ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 cursor-default"
                : "bg-black/0 text-accent-2 ring-transparent hover:bg-black/5 hover:ring-black/8",
              isLocked ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {done ? "Completed" : isSubmitting ? "Submitting…" : "Submit Proof & Complete"}
          </button>
        </div>
      </section>
    </div>
  );
}

