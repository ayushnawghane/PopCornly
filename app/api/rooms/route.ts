import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoomSlug } from "@/lib/slug";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : "Watch Party";

  let slug = generateRoomSlug();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("rooms")
      .insert({ slug, name, owner_id: user.id, host_id: user.id })
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ room: data });
    }

    // unique_violation on slug collision — retry with a fresh slug
    if (error.code === "23505") {
      slug = generateRoomSlug();
      continue;
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: "Could not allocate a room slug, try again" }, { status: 500 });
}
