import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinRoomButton from "@/components/room/JoinRoomButton";

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
        <div>
          <h1 className="text-2xl font-semibold">Room not found</h1>
          <p className="mt-2 text-sm text-zinc-500">
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
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold">Join &ldquo;{room.name}&rdquo;?</h1>
        <p className="text-sm text-zinc-500">You&apos;ll be added to this watch party.</p>
        <JoinRoomButton slug={slug} />
      </div>
    </main>
  );
}
