"use client";

import { AccountProvider } from "@/context/account-context";
import { CartProvider } from "@/context/cart-context";
import { LanguageProvider } from "@/context/language-context";
import { ToastProvider } from "@/context/toast-context";
import { UiProvider } from "@/context/ui-context";
import { WishlistProvider } from "@/context/wishlist-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <UiProvider>
          <CartProvider>
            <WishlistProvider>
              <AccountProvider>{children}</AccountProvider>
            </WishlistProvider>
          </CartProvider>
        </UiProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
