"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
  onChange: (next: string | undefined) => void;
};

function isLikelyPreviewableUrl(v: string) {
  return v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("blob:");
}

export function ImageUploadField({ label, value, disabled, helpText, locationSlug, onChange }: Props) {
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const previewSrc = useMemo(() => (value && isLikelyPreviewableUrl(value) ? value : null), [value]);

  async function onPick(file: File | null) {
    setErr(null);
    if (!file) return;

    setIsUploading(true);
    try {
      const authToken = (session as unknown as { accessToken?: string | null })?.accessToken ?? null;
      if (!authToken) {
        throw new Error("Not authenticated. Please log in again.");
      }
      if (!locationSlug) throw new Error("Please select a location first.");

      const upload = await requestUploadForLocation(
        locationSlug,
        {
          purpose: "admin_asset",
          content_type: file.type || "application/octet-stream",
          file_name: file.name || "image",
          size_bytes: file.size,
        },
        authToken,
      );

      const res = await fetch(upload.upload_url, {
        method: upload.method ?? "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
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
      setErr(e instanceof Error ? e.message : "Upload failed");
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
            <Image src={previewSrc} alt="" fill className="object-cover" sizes="160px" />
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
            onClick={() => onChange(undefined)}
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

