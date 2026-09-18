"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractYouTubeId } from "@/lib/player/youtube-adapter";
import { extractVimeoId } from "@/lib/player/vimeo-adapter";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
    <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-bg-raised p-5">
      <div className="flex flex-wrap gap-1 text-sm">
        {(["youtube", "vimeo", "direct_url", "upload"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError(null);
            }}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:bg-bg-raised-2 hover:text-foreground"
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
            className="text-sm text-foreground-muted file:mr-3 file:rounded-lg file:border-0 file:bg-bg-raised-2 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-secondary/20"
          />
          <label className="flex items-start gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(e) => setRightsConfirmed(e.target.checked)}
              className="mt-0.5 accent-tertiary"
            />
            I own this video or have the rights to share it with this room.
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Uploading…" : "Upload and set as source"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3">
          <Input
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
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Setting…" : "Set as source"}
          </Button>
        </form>
      )}
    </div>
  );
}
