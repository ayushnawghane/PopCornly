import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoomMemberList from "@/components/room/RoomMemberList";
import InviteLinkButton from "@/components/room/InviteLinkButton";
import RoomPlayer from "@/components/room/RoomPlayer";
import RoomChat from "@/components/room/RoomChat";
import VideoCallTiles from "@/components/room/VideoCallTiles";
import RoomCode from "@/components/ui/RoomCode";
import type { Room, RoomMember } from "@/lib/types";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/room/${slug}`);
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Room>();

  if (!room) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-xl font-bold">Room not found</h1>
      </main>
    );
  }

  const { data: membership } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect(`/room/${slug}/join`);
  }

  const { data: members } = await supabase
    .from("room_members")
    .select("room_id, user_id, role, joined_at, last_seen_at, profiles(id, display_name, avatar_url, created_at)")
    .eq("room_id", room.id);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/" className="hidden shrink-0 font-display text-base font-bold tracking-tight sm:inline">
            popcornly<span className="text-primary">.</span>
          </Link>
          <span className="hidden text-border-strong sm:inline">/</span>
          <h1 className="truncate font-display text-base font-bold">{room.name}</h1>
          {room.playback_state === "playing" && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-tertiary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-tertiary">
              <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-tertiary" />
              Live
            </span>
          )}
        </div>
        <InviteLinkButton slug={room.slug} />
      </header>

      <div className="flex items-center gap-3 border-b border-border bg-bg-raised/30 px-4 py-2.5 sm:px-6">
        <span className="text-xs font-medium text-foreground-muted">Room code</span>
        <RoomCode code={room.slug} size="sm" />
      </div>

      <main className="flex flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <RoomPlayer room={room} isHost={user.id === room.host_id} currentUserId={user.id} />
          <VideoCallTiles
            roomId={room.id}
            currentUserId={user.id}
            members={(members ?? []) as unknown as RoomMember[]}
          />
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-80">
          <RoomMemberList members={(members ?? []) as unknown as RoomMember[]} />
          <RoomChat
            roomId={room.id}
            currentUserId={user.id}
            members={(members ?? []) as unknown as RoomMember[]}
          />
        </aside>
      </main>
    </div>
  );
}
