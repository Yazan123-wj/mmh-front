"use client";

import { useSession } from "next-auth/react";

/** Returns the Django JWT access token from the NextAuth session. */
export function useAdminToken(): string | undefined {
  const { data } = useSession();
  return data?.user?.accessToken;
}
