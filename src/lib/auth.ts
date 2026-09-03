import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

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

function toE164(identifier: string): string | null {
  const digits = identifier.replace(/[\s\-().]/g, "");
  if (/^\+[1-9]\d{6,14}$/.test(digits)) return digits;
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  return null;
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
          const phoneNumber = toE164(identifier);
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

        const valid = await bcrypt.compare(password, user.passwordHash);
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
