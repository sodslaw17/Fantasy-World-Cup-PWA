import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/roles";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_BUCKETS = ["avatars", "team-icons", "player-photos"] as const;
type Bucket = (typeof ALLOWED_BUCKETS)[number];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const path = formData.get("path") as string | null;

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: "Missing file, bucket, or path." }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.includes(bucket as Bucket)) {
    return NextResponse.json({ error: "Invalid bucket." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size is 5 MB." }, { status: 400 });
  }

  const service = createServiceClient();
  const bytes = await file.arrayBuffer();

  const { error } = await service.storage
    .from(bucket)
    .upload(path, bytes, { upsert: true, contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = service.storage.from(bucket).getPublicUrl(path);
  // Append timestamp to bust CDN cache when replacing an existing image
  return NextResponse.json({ url: `${data.publicUrl}?t=${Date.now()}` });
}
