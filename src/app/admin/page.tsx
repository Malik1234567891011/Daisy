import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE, isValidAdminCookie } from "@/lib/admin-auth";
import { buildAdminData } from "@/lib/admin-stats";
import AdminDashboard from "@/components/admin/AdminDashboard";

/** Always live: this page exists to look at the database as it is right now. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // The proxy already turned strangers away; this is the check that counts,
  // since the proxy is only ever an optimistic one.
  const jar = await cookies();
  if (!(await isValidAdminCookie(jar.get(ADMIN_COOKIE)?.value))) {
    redirect("/admin/login");
  }

  const rows = await prisma.user.findMany({
    select: {
      id: true, email: true, firstName: true, school: true, age: true,
      gender: true, genderPreference: true, phoneNumber: true, phoneVerified: true,
      photoUrl: true, onboardingComplete: true, referralCode: true, referredBy: true,
      intentions: true, vibe: true, interests: true, idealHangout: true,
      rerollCredits: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminDashboard data={buildAdminData(rows)} generatedAt={new Date().toISOString()} />;
}
