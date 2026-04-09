import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  await prisma.match.deleteMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
  });

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
