"use client";

import { useRef, useState } from "react";

interface Props {
  bucket: "avatars" | "team-icons" | "player-photos";
  /** Storage path without extension — used as the key; re-uploading replaces in place. */
  storagePath: string;
  currentUrl: string | null;
  shape?: "circle" | "square";
  size?: "sm" | "md";
  onComplete: (url: string | null) => Promise<void>;
}

export function ImageUpload({
  bucket,
  storagePath,
  currentUrl,
  shape = "square",
  size = "sm",
  onComplete,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const dim = size === "md" ? "w-12 h-12" : "w-9 h-9";
  const radius = shape === "circle" ? "rounded-full" : "rounded";

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Select an image file.");
      setStatus("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Max 5 MB.");
      setStatus("error");
      return;
    }

    setStatus("busy");
    setErrorMsg("");
    setPreviewUrl(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);
    fd.append("path", storagePath);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json: { url?: string; error?: string } = await res.json();
      if (!res.ok || json.error || !json.url) {
        setErrorMsg(json.error ?? "Upload failed.");
        setStatus("error");
        setPreviewUrl(currentUrl);
        return;
      }
      await onComplete(json.url);
      setPreviewUrl(json.url);
      setStatus("idle");
    } catch {
      setErrorMsg("Upload failed — check your connection.");
      setStatus("error");
      setPreviewUrl(currentUrl);
    }
  }

  async function handleClear() {
    setStatus("busy");
    await onComplete(null);
    setPreviewUrl(null);
    setStatus("idle");
  }

  return (
    <div className="flex items-center gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {/* Preview */}
      <div
        className={`${dim} ${radius} shrink-0 overflow-hidden bg-paper-2 border border-line flex items-center justify-center`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="w-full h-full object-contain" />
        ) : (
          <span className="text-ink-3 text-xs select-none">?</span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={status === "busy"}
            onClick={() => inputRef.current?.click()}
            className="text-xs text-brand-ink hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "busy" ? "Saving…" : previewUrl ? "Replace" : "Upload"}
          </button>
          {previewUrl && status !== "busy" && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-ink-3 hover:text-ink-2"
            >
              Clear
            </button>
          )}
        </div>
        {status === "error" && (
          <span className="text-xs text-red-ink leading-tight">{errorMsg}</span>
        )}
      </div>
    </div>
  );
}
