export type SourceType = "none" | "youtube" | "vimeo" | "upload" | "direct_url";
export type PlaybackState = "playing" | "paused";
export type MemberRole = "owner" | "host" | "guest";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  owner_id: string;
  source_type: SourceType;
  source_url: string | null;
  uploaded_video_id: string | null;
  playback_state: PlaybackState;
  playback_position_seconds: number;
  playback_rate: number;
  playback_updated_at: string;
  host_id: string | null;
  created_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_seen_at: string;
  profiles?: Profile;
}

export interface ChatMessage {
  id: number;
  room_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}

export interface UploadedVideo {
  id: string;
  owner_id: string;
  room_id: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number | null;
  rights_confirmed: boolean;
  created_at: string;
}
