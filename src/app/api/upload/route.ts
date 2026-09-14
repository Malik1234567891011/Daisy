import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteProfilePhoto, uploadProfilePhoto } from "@/lib/photoStorage";
import { checkProfilePhoto } from "@/lib/photoCheck";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

    // Convert File to Buffer for reliable serverless upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Permissive: only clear non-faces and explicit content are turned away,
    // and an outage at the provider lets the photo through.
    const verdict = await checkProfilePhoto(buffer, file.type);
    if (!verdict.ok) {
      return NextResponse.json(
        { error: verdict.message, code: verdict.code },
        { status: 422 },
      );
    }

    const photoUrl = await uploadProfilePhoto(buffer, file.type, userId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        photoUrl,
        // Kept alongside the photo so /admin can tell a screened photo from
        // one the check never ran on. Null when the model could not be asked.
        photoFacePresent: verdict.inspection?.facePresent ?? null,
        photoExplicit: verdict.inspection?.explicit ?? null,
        photoCheckReason: verdict.inspection?.reason ?? null,
        photoCheckedAt: verdict.inspection ? new Date() : null,
      },
    });

    // Awaited, not fire-and-forget: the function can be frozen the moment
    // the response goes out, which would strand the old blob.
    if (previousUrl && previousUrl !== photoUrl) {
      await deleteProfilePhoto(previousUrl, userId);
    }

    return NextResponse.json({ url: photoUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
