import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB, generous MVP cap
const ALLOWED_MIME_PREFIXES = ["video/"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { filename, mimeType, sizeBytes, roomId, rightsConfirmed } = body as {
    filename?: string;
    mimeType?: string;
    sizeBytes?: number;
    roomId?: string;
    rightsConfirmed?: boolean;
  };

  if (!filename || !mimeType || !sizeBytes) {
    return NextResponse.json({ error: "filename, mimeType, sizeBytes are required" }, { status: 400 });
  }
  if (!ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) {
    return NextResponse.json({ error: "Only video files are supported" }, { status: 400 });
  }
  if (sizeBytes > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File is too large (max 2GB)" }, { status: 400 });
  }
  if (!rightsConfirmed) {
    return NextResponse.json({ error: "You must confirm you have the rights to upload this video" }, { status: 400 });
  }

  const safeName = filename.replace(/[^\w.\-]/g, "_").slice(-120);
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { data: uploadRow, error: insertError } = await supabase
    .from("uploaded_videos")
    .insert({
      owner_id: user.id,
      room_id: roomId ?? null,
      storage_path: storagePath,
      original_filename: filename,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      rights_confirmed: rightsConfirmed,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("videos")
    .createSignedUploadUrl(storagePath);

  if (signError) {
    await supabase.from("uploaded_videos").delete().eq("id", uploadRow.id);
    return NextResponse.json({ error: signError.message }, { status: 400 });
  }

  return NextResponse.json({
    uploadedVideoId: uploadRow.id,
    storagePath,
    signedUrl: signed.signedUrl,
    token: signed.token,
  });
}
