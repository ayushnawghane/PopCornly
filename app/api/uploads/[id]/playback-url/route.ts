import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_SECONDS = 60 * 30; // 30 minutes

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // RLS already scopes this to the owner or a member of the room it's attached to
  const { data: video, error: videoError } = await supabase
    .from("uploaded_videos")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (videoError || !video) {
    return NextResponse.json({ error: "Video not found or access denied" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("videos")
    .createSignedUrl(video.storage_path, SIGNED_URL_TTL_SECONDS);

  if (signError) {
    return NextResponse.json({ error: signError.message }, { status: 400 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
