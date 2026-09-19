"use client";

import { SessionProvider } from "next-auth/react";

export function AdminSession({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
