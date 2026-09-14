import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

/**
 * Exactly the columns authorize() reads.
 *
 * This is deliberately explicit. A bare findUnique asks Postgres for every
 * column in the Prisma model, so the moment the model gains a field the
 * database has not been migrated to yet, every sign-in throws — including for
 * addresses that don't exist, because the query fails before the null check.
 * Auth.js reports that as a bare "Configuration" error, which says nothing.
 * Listing the fields keeps login working across a schema change.
 */
const AUTH_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  firstName: true,
  phoneVerified: true,
} as const;

/**
 * People sign in with whatever they gave us — a school email or the phone
 * number they verified during onboarding. Anything without an "@" is read as a
 * phone: separators are stripped, and a bare 10-digit number is assumed North
 * American, since that is how the verify step stores them.
 */
function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      async authorize(credentials) {
        const identifier = (credentials.identifier as string)?.trim();
        const password = credentials.password as string;

        if (!identifier || !password) return null;

        let user = null;

        if (isEmail(identifier)) {
          user = await prisma.user.findUnique({
            where: { email: identifier.toLowerCase() },
            select: AUTH_SELECT,
          });
        } else {
          const phoneNumber = normalizePhone(identifier);
          if (!phoneNumber) return null;
          user = await prisma.user.findUnique({
            where: { phoneNumber },
            select: AUTH_SELECT,
          });
          // An unverified number was never proven to belong to this account,
          // so it is not something you can sign in with.
          if (user && !user.phoneVerified) return null;
        }

        if (!user) return null;

        // Exact match first, so nobody's real password changes meaning. Only
        // if that fails do we retry without surrounding whitespace: pasting a
        // credential very often picks up a trailing space, and the failure is
        // indistinguishable from a wrong password. The fallback never locks
        // anyone out — it only accepts a padded copy of the right password.
        let valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const trimmed = password.trim();
          if (trimmed !== password) {
            valid = await bcrypt.compare(trimmed, user.passwordHash);
          }
        }
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.firstName };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
