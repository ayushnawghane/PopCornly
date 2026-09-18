import type { AdapterKind, VideoPlayerAdapter } from "./types";
import { YouTubeAdapter } from "./youtube-adapter";
import { VimeoAdapter } from "./vimeo-adapter";
import { Html5Adapter } from "./html5-adapter";
import type { SourceType } from "@/lib/types";

export function sourceTypeToAdapterKind(sourceType: SourceType): AdapterKind {
  if (sourceType === "youtube") return "youtube";
  if (sourceType === "vimeo") return "vimeo";
  return "html5";
}

export function createAdapter(kind: AdapterKind): VideoPlayerAdapter {
  switch (kind) {
    case "youtube":
      return new YouTubeAdapter();
    case "vimeo":
      return new VimeoAdapter();
    case "html5":
      return new Html5Adapter();
  }
}
