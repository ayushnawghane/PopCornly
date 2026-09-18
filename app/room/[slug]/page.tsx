import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoomMemberList from "@/components/room/RoomMemberList";
import InviteLinkButton from "@/components/room/InviteLinkButton";
import RoomPlayer from "@/components/room/RoomPlayer";
import RoomChat from "@/components/room/RoomChat";
import VideoCallTiles from "@/components/room/VideoCallTiles";
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
        <h1 className="text-2xl font-semibold">Room not found</h1>
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
    <main className="flex flex-1 flex-col gap-6 px-6 py-8 md:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{room.name}</h1>
          <InviteLinkButton slug={room.slug} />
        </div>

        <RoomPlayer room={room} isHost={user.id === room.host_id} currentUserId={user.id} />
        <VideoCallTiles
          roomId={room.id}
          currentUserId={user.id}
          members={(members ?? []) as unknown as RoomMember[]}
        />
      </div>

      <aside className="flex w-full flex-col gap-6 md:w-72">
        <RoomMemberList members={(members ?? []) as unknown as RoomMember[]} />
        <RoomChat
          roomId={room.id}
          currentUserId={user.id}
          members={(members ?? []) as unknown as RoomMember[]}
        />
      </aside>
    </main>
  );
}
