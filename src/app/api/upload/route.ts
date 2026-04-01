import { NextRequest, NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Only delete blobs we uploaded: Vercel store + path photos/{userId}-timestamp.ext */
function isOurPreviousProfilePhoto(url: string, userId: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.endsWith(".public.blob.vercel-storage.com")) return false;
    const prefix = `/photos/${userId}-`;
    return (
      pathname.startsWith(prefix) &&
      /\.(jpe?g|png|webp)$/i.test(pathname)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const previous = await prisma.user.findUnique({
      where: { id: userId },
      select: { photoUrl: true },
    });
    const previousUrl = previous?.photoUrl ?? null;

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 3 MB" },
        { status: 400 },
      );
    }

    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const filename = `photos/${userId}-${Date.now()}.${ext}`;

    // Convert File to Buffer for reliable serverless upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { photoUrl: blob.url },
    });

    if (
      previousUrl &&
      previousUrl !== blob.url &&
      isOurPreviousProfilePhoto(previousUrl, userId)
    ) {
      del(previousUrl).catch((e) =>
        console.error("Could not delete previous profile photo:", e),
      );
    }

    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
