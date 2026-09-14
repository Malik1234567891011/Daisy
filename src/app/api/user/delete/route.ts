import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteProfilePhoto } from "@/lib/photoStorage";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { photoUrl: true },
  });

  // Match has no cascade from User; reroll purchases cascade on their own.
  await prisma.match.deleteMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
  });

  await prisma.user.delete({ where: { id: userId } });

  // The blob is public by URL, so "delete my data" has to include it. Done
  // last so a failed DB delete never leaves an account without its photo.
  await deleteProfilePhoto(user?.photoUrl ?? null, userId);

  return NextResponse.json({ ok: true });
}
