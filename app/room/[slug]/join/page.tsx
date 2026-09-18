import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinRoomButton from "@/components/room/JoinRoomButton";
import RoomCode from "@/components/ui/RoomCode";

export default async function JoinRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/room/${slug}/join`);
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!room) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
        <div className="rounded-2xl border border-border bg-bg-raised px-8 py-10">
          <h1 className="font-display text-xl font-bold">Room not found</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            This invite link is invalid or the room no longer exists.
          </p>
        </div>
      </main>
    );
  }

  const { data: membership } = await supabase
    .from("room_members")
    .select("room_id")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    redirect(`/room/${slug}`);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24 text-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-border bg-bg-raised px-8 py-10">
        <p className="text-sm font-medium text-foreground-muted">You&apos;re invited to</p>
        <h1 className="text-balance font-display text-3xl font-bold leading-tight">{room.name}</h1>
        <RoomCode code={slug} size="sm" className="justify-center opacity-70" />
        <JoinRoomButton slug={slug} />
      </div>
    </main>
  );
}
