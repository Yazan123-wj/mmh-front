import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { login as djangoLogin } from "@/lib/api/auth";

export type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CATALOG_MANAGER"
  | "ORDER_MANAGER"
  | "CONTENT_MANAGER"
  | "SUPPORT_AGENT"
  | "VIEWER";

/** Public demo storefront login for client previews. */
export const DEMO_CUSTOMER = {
  email: "demo@mmh.local",
  password: "DemoCustomer1!",
  id: "demo-customer",
  name: "Demo Customer",
} as const;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      kind: "CUSTOMER" | "ADMIN";
      role: AdminRole | null;
      permissions?: string[];
      accessToken?: string;
    };
  }
}

type AuthUserPayload = {
  id?: string | number;
  email?: string;
  first_name?: string;
  kind?: string;
  role?: AdminRole | null;
  permissions?: string[];
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  trustHost: true,
  pages: { signIn: "/login" },
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

        if (email === DEMO_CUSTOMER.email && password === DEMO_CUSTOMER.password) {
          try {
            const token = await djangoLogin(email, password);
            return {
              id: String(token.user?.id ?? DEMO_CUSTOMER.id),
              email: DEMO_CUSTOMER.email,
              name: token.user?.first_name || DEMO_CUSTOMER.name,
              kind: "CUSTOMER" as const,
              role: null,
              permissions: [],
              accessToken: token.access,
            };
          } catch {
            return {
              id: DEMO_CUSTOMER.id,
              email: DEMO_CUSTOMER.email,
              name: DEMO_CUSTOMER.name,
              kind: "CUSTOMER" as const,
              role: null,
              permissions: [],
            };
          }
        }

        try {
          const token = await djangoLogin(email, password);
          const user = token.user as AuthUserPayload | undefined;
          const kind = (user?.kind as "CUSTOMER" | "ADMIN") || "CUSTOMER";
          return {
            id: String(user?.id ?? email),
            email: user?.email ?? email,
            name: user?.first_name || email,
            kind,
            role: (user?.role as AdminRole | null) ?? null,
            permissions: user?.permissions ?? [],
            accessToken: token.access,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.kind = (user as { kind?: string }).kind;
        token.role = (user as { role?: AdminRole | null }).role;
        token.permissions = (user as { permissions?: string[] }).permissions ?? [];
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.email = session.user.email ?? "";
      session.user.kind = (token.kind as "CUSTOMER" | "ADMIN") ?? "CUSTOMER";
      session.user.role = (token.role as AdminRole | null) ?? null;
      session.user.permissions = (token.permissions as string[] | undefined) ?? [];
      session.user.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
