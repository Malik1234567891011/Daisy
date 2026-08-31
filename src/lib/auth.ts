import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

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
          });
        } else {
          const phoneNumber = toE164(identifier);
          if (!phoneNumber) return null;
          user = await prisma.user.findUnique({ where: { phoneNumber } });
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
