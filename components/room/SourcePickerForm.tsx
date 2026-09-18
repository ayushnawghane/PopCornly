"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractYouTubeId } from "@/lib/player/youtube-adapter";
import { extractVimeoId } from "@/lib/player/vimeo-adapter";

type Tab = "youtube" | "vimeo" | "direct_url" | "upload";

export default function SourcePickerForm({ roomId }: { roomId: string }) {
  const [tab, setTab] = useState<Tab>("youtube");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setUrlSource(sourceType: "youtube" | "vimeo" | "direct_url", sourceUrl: string) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        source_type: sourceType,
        source_url: sourceUrl,
        uploaded_video_id: null,
        playback_state: "paused",
        playback_position_seconds: 0,
        playback_rate: 1,
        playback_updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (updateError) throw new Error(updateError.message);
  }

  async function handleUrlSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (tab === "youtube" && !extractYouTubeId(url)) {
      setError("That doesn't look like a valid YouTube URL");
      return;
    }
    if (tab === "vimeo" && !extractVimeoId(url)) {
      setError("That doesn't look like a valid Vimeo URL");
      return;
    }

    setLoading(true);
    try {
      await setUrlSource(tab as "youtube" | "vimeo" | "direct_url", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose a video file first");
      return;
    }
    if (!rightsConfirmed) {
      setError("Please confirm you have the rights to share this video");
      return;
    }

    setLoading(true);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "video/mp4",
          sizeBytes: file.size,
          roomId,
          rightsConfirmed,
        }),
      });
      const signJson = await signRes.json();
      if (!signRes.ok) throw new Error(signJson.error ?? "Could not prepare upload");

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .uploadToSignedUrl(signJson.storagePath, signJson.token, file);
      if (uploadError) throw new Error(uploadError.message);

      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          source_type: "upload",
          source_url: null,
          uploaded_video_id: signJson.uploadedVideoId,
          playback_state: "paused",
          playback_position_seconds: 0,
          playback_rate: 1,
          playback_updated_at: new Date().toISOString(),
        })
        .eq("id", roomId);
      if (updateError) throw new Error(updateError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex gap-1 text-sm">
        {(["youtube", "vimeo", "direct_url", "upload"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError(null);
            }}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              tab === t
                ? "bg-foreground text-background"
                : "text-zinc-500 hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            }`}
          >
            {t === "direct_url" ? "Direct link" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "upload" ? (
        <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <label className="flex items-start gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(e) => setRightsConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            I own this video or have the rights to share it with this room.
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {loading ? "Uploading…" : "Upload and set as source"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3">
          <input
            type="url"
            required
            placeholder={
              tab === "youtube"
                ? "https://www.youtube.com/watch?v=…"
                : tab === "vimeo"
                  ? "https://vimeo.com/…"
                  : "https://example.com/video.mp4"
            }
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {loading ? "Setting…" : "Set as source"}
          </button>
        </form>
      )}
    </div>
  );
}
