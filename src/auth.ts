import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db";
import { verifyPassword } from "@/server/auth/password";
import { rateLimit } from "@/server/rate-limit";
import { writeAudit } from "@/server/audit";
import type { AdminRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      kind: "CUSTOMER" | "ADMIN";
      role: AdminRole | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  trustHost: true,
  pages: { signIn: "/admin/login" },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!rateLimit(`login:${email}`, 8, 15 * 60 * 1000)) {
          await writeAudit({ action: "auth.login_rate_limited", entityType: "User", entityId: email });
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email },
          include: { adminProfile: true },
        });
        if (!user?.passwordHash || user.disabled) {
          await writeAudit({ action: "auth.login_failed", entityType: "User", entityId: email });
          return null;
        }
        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) {
          await writeAudit({ action: "auth.login_failed", entityType: "User", entityId: email });
          return null;
        }
        await writeAudit({
          actorId: user.id,
          action: "auth.login_success",
          entityType: "User",
          entityId: user.id,
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          kind: user.kind,
          role: user.adminProfile?.role ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.kind = (user as { kind?: string }).kind;
        token.role = (user as { role?: AdminRole | null }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.email = session.user.email ?? "";
      session.user.kind = (token.kind as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
      session.user.role = (token.role as AdminRole | null) ?? null;
      return session;
    },
  },
});
