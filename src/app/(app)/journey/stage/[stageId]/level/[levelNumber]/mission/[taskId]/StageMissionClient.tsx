"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Images, MapPin, Trash2 } from "lucide-react";
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

function openMissionInExternalMaps(task: {
  title: string;
  address?: string;
  location?: { lat: number; lng: number };
}) {
  if (task.location) {
    const dest = `${task.location.lat},${task.location.lng}`;
    const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = isIOS
      ? `https://maps.apple.com/?daddr=${encodeURIComponent(dest)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const q = task.address?.trim();
  if (q) {
    const query = `${q} ${task.title}`.trim();
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
}

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
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const closeCameraModal = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen) return;
    const v = videoRef.current;
    const s = cameraStreamRef.current;
    if (v && s) v.srcObject = s;
  }, [cameraOpen]);

  useEffect(() => {
    if (!selectedFile) {
      setProofPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setProofPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  async function openDeviceCamera() {
    setError(null);
    if (isLocked || isSubmitting) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not supported in this browser. Try Gallery instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setCameraOpen(true);
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Camera permission was denied. Allow camera access or use Gallery.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not open the camera.");
      }
    }
  }

  function captureFromVideo() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setError("Camera is not ready yet. Wait a moment and try again.");
      return;
    }
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError("Camera preview has no size yet. Try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not capture image.");
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not encode photo.");
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        onPickImage(file);
        closeCameraModal();
      },
      "image/jpeg",
      0.92,
    );
  }

  const isLocked = stage.status === "locked";
  const done = isTaskCompleted(task, completedIds);

  const hero = useMemo(
    () => task.imageUrl || level.imageUrl || stage.imageUrl || "/images/metro.png",
    [task.imageUrl, level.imageUrl, stage.imageUrl],
  );

  const canOpenMaps = Boolean(task.location || task.address?.trim());

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

  function onPickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  }

  function clearSelectedProof() {
    if (isLocked || isSubmitting) return;
    setSelectedFile(null);
    setError(null);
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
          content_type: selectedFile.type || "image/jpeg",
          file_name: selectedFile.name?.trim() || `proof-${Date.now()}.jpg`,
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

          {canOpenMaps ? (
            <button
              type="button"
              onClick={() => openMissionInExternalMaps(task)}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold ring-1 transition bg-card text-foreground ring-black/10 hover:bg-black/4"
              aria-label="Open directions to this place in your maps app"
            >
              <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
              <span>Open in Maps</span>
            </button>
          ) : null}

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
            <p className="mt-1 text-xs text-muted">
              Add a photo from your gallery, or open the live camera to take a picture.
            </p>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              disabled={isLocked || isSubmitting}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = "";
                onPickImage(f);
              }}
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLocked || isSubmitting}
                onClick={() => galleryInputRef.current?.click()}
                className={[
                  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold ring-1 transition",
                  "bg-card text-foreground ring-black/10 hover:bg-black/4",
                  isLocked || isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
                aria-label="Choose photo from device"
              >
                <Images className="h-5 w-5 text-accent" aria-hidden="true" />
                <span>Gallery</span>
              </button>
              <button
                type="button"
                disabled={isLocked || isSubmitting}
                onClick={() => void openDeviceCamera()}
                className={[
                  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold ring-1 transition",
                  "bg-card text-foreground ring-black/10 hover:bg-black/4",
                  isLocked || isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
                aria-label="Open camera"
              >
                <Camera className="h-5 w-5 text-accent" aria-hidden="true" />
                <span>Camera</span>
              </button>
            </div>

            {proofPreviewUrl ? (
              <div className="mt-3 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/8">
                <img
                  src={proofPreviewUrl}
                  alt="Preview of your proof photo"
                  className="mx-auto max-h-64 w-full object-contain"
                />
              </div>
            ) : null}

            {selectedFile ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0 text-[11px] text-muted">
                  <span className="block truncate">
                    Selected:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedFile.name?.trim() || "Camera capture"}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isLocked || isSubmitting}
                  onClick={clearSelectedProof}
                  className={[
                    "inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold ring-1 transition",
                    "bg-card text-red-700 ring-red-500/20 hover:bg-red-500/8",
                    isLocked || isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                  aria-label="Remove selected photo"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
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
            disabled={isLocked || done || isSubmitting}
            onClick={onSubmitProof}
            className={[
              "mt-6 w-full rounded-2xl py-3 text-sm font-semibold transition",
              done
                ? "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 cursor-default"
                : "bg-accent text-white shadow-[0_12px_36px_rgba(109,40,217,0.28)] hover:brightness-105 active:brightness-95",
              isLocked ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {done ? "Completed" : isSubmitting ? "Submitting…" : "Submit Proof & Complete"}
          </button>
        </div>
      </section>

      {cameraOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Take proof photo"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-[0_18px_60px_rgba(0,0,0,0.35)] ring-1 ring-black/15">
            <div className="border-b border-black/8 px-4 py-3 text-sm font-semibold">Camera</div>
            <div className="p-4">
              <video
                ref={videoRef}
                className="aspect-video w-full rounded-2xl bg-black object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-2xl bg-black/5 py-3 text-sm font-semibold ring-1 ring-black/10 hover:bg-black/8"
                  onClick={closeCameraModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(109,40,217,0.28)] hover:brightness-105"
                  onClick={captureFromVideo}
                >
                  Use photo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

