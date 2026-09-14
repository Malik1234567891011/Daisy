import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/**
 * DELETE — remove one account. Mirrors the self-serve delete: matches are
 * cleared first because Match has no cascade from User, while reroll
 * purchases cascade on their own.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await prisma.match.deleteMany({
      where: { OR: [{ userAId: id }, { userBId: id }] },
    });
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    console.error("Admin delete error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: user.email });
}
