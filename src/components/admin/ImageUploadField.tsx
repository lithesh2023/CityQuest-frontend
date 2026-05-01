"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { requestUploadForLocation, confirmUpload } from "@/lib/api/cityquest";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  label: string;
  value?: string;
  disabled?: boolean;
  helpText?: string;
  locationSlug?: string;
  /** When `value` is a storage key (not a URL), show this signed/public URL as preview */
  previewUrl?: string;
  onChange: (next: string | undefined) => void;
};

function isLikelyPreviewableUrl(v: string) {
  return v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("blob:");
}

const UPLOAD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type UploadImageContentType = (typeof UPLOAD_IMAGE_TYPES)[number];

/** Backend only accepts jpeg/png/webp; browsers often omit MIME or send unusable values. */
function normalizeUploadContentType(file: File): UploadImageContentType | null {
  const raw = (file.type || "").trim().toLowerCase();
  if (raw === "image/jpg" || raw === "image/pjpeg") return "image/jpeg";
  if ((UPLOAD_IMAGE_TYPES as readonly string[]).includes(raw)) return raw as UploadImageContentType;

  const name = (file.name || "").toLowerCase();
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";

  return null;
}

function uploadErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "Upload failed";
}

export function ImageUploadField({ label, value, disabled, helpText, locationSlug, previewUrl, onChange }: Props) {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const localBlobUrlRef = useRef<string | null>(null);

  function revokeLocalBlob() {
    const u = localBlobUrlRef.current;
    if (u) URL.revokeObjectURL(u);
    localBlobUrlRef.current = null;
    setLocalBlobUrl(null);
  }

  useEffect(() => () => revokeLocalBlob(), []);

  const previewSrc = useMemo(() => {
    if (localBlobUrl) return localBlobUrl;
    if (value && isLikelyPreviewableUrl(value)) return value;
    if (previewUrl && isLikelyPreviewableUrl(previewUrl)) return previewUrl;
    return null;
  }, [localBlobUrl, value, previewUrl]);

  // After save, server returns a signed URL for the same file key — drop the local blob preview.
  useEffect(() => {
    if (!localBlobUrl || !value || !previewUrl) return;
    if (!isLikelyPreviewableUrl(value) && isLikelyPreviewableUrl(previewUrl)) {
      revokeLocalBlob();
    }
  }, [localBlobUrl, value, previewUrl]);

  async function onPick(file: File | null) {
    setErr(null);
    if (!file) return;

    revokeLocalBlob();
    const url = URL.createObjectURL(file);
    localBlobUrlRef.current = url;
    setLocalBlobUrl(url);

    setIsUploading(true);
    try {
      const authToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;
      if (!authToken) {
        throw new Error("Not authenticated. Please log in again.");
      }
      if (!locationSlug) throw new Error("Please select a location first.");

      const content_type = normalizeUploadContentType(file);
      if (!content_type) {
        throw new Error(
          "This image type isn’t supported yet. Please use JPEG, PNG, or WebP (HEIC/GIF won’t work until added).",
        );
      }

      const upload = await requestUploadForLocation(
        locationSlug,
        {
          purpose: "admin_asset",
          content_type,
          file_name: file.name || "image",
          size_bytes: file.size,
        },
        authToken,
      );

      const res = await fetch(upload.upload_url, {
        method: upload.method ?? "PUT",
        headers: { "content-type": content_type },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      try {
        await confirmUpload({ upload_id: upload.upload_id }, authToken);
      } catch {
        // optional
      }

      // NOTE: backend may later return a public URL; for now we store file_key.
      onChange(upload.file_key);
    } catch (e) {
      revokeLocalBlob();
      setErr(uploadErrorMessage(e));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-[160px,1fr] items-start">
      <div className="text-xs font-semibold text-muted pt-1">{label}</div>
      <div>
        {previewSrc ? (
          <div className="mb-2 relative h-24 w-40 overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*"
            disabled={disabled || isUploading}
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground hover:file:bg-black/10"
          />

          <button
            type="button"
            disabled={disabled || isUploading || !value}
            onClick={() => {
              revokeLocalBlob();
              onChange(undefined);
            }}
            className={cx(
              "rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition",
              "bg-black/0 text-muted ring-black/10 hover:bg-black/5",
              (disabled || isUploading || !value) && "opacity-60 cursor-not-allowed",
            )}
          >
            Clear
          </button>
        </div>

        {value ? (
          <div className="mt-2 text-[11px] text-muted break-all">
            Stored value: <span className="font-semibold text-foreground">{value}</span>
          </div>
        ) : null}
        {helpText ? <div className="mt-1 text-[11px] text-muted">{helpText}</div> : null}
        {err ? (
          <div className="mt-2 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-3 py-2 text-xs text-red-700">
            {err}
          </div>
        ) : null}
      </div>
    </div>
  );
}
