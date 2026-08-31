"use client";

import { DEMO_USER } from "@/data/mock-orders";
import { STORAGE_KEYS } from "@/lib/storage";
import { useHydrated, useLocalStorage } from "@/hooks/use-local-storage";
import type { MockUser } from "@/types";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

interface AccountContextValue {
  user: MockUser | null;
  hydrated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<MockUser | null>(STORAGE_KEYS.user, null);
  const hydrated = useHydrated();

  const login = useCallback(
    (email: string, name?: string) => {
      setUser({
        ...DEMO_USER,
        email,
        name: name || DEMO_USER.name,
      });
    },
    [setUser],
  );

  const logout = useCallback(() => setUser(null), [setUser]);

  const value = useMemo(() => ({ user, hydrated, login, logout }), [user, hydrated, login, logout]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within AccountProvider");
  return context;
}
