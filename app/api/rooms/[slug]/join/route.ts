import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const { error: joinError } = await supabase
    .from("room_members")
    .upsert({ room_id: room.id, user_id: user.id }, { onConflict: "room_id,user_id", ignoreDuplicates: true });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 400 });
  }

  return NextResponse.json({ room });
}
