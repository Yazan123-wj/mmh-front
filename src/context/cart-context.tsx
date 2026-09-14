"use client";

import { getProductById } from "@/data/products";
import { linePrice } from "@/lib/cart";
import { uid } from "@/lib/id";
import { STORAGE_KEYS } from "@/lib/storage";
import { useHydrated, useLocalStorage } from "@/hooks/use-local-storage";
import type { CartDigitalMeta, CartItem } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AddPayload {
  productId: string;
  quantity?: number;
  digital?: CartDigitalMeta;
}

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  addItem: (payload: AddPayload) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, quantity: number) => void;
  updateItemDigital: (lineId: string, digital: CartDigitalMeta) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
  promoCode: string;
  promoError: string | null;
  discount: number;
  applyPromo: (code: string) => Promise<boolean>;
  lastAddedId: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>(STORAGE_KEYS.cart, []);
  const hydrated = useHydrated();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const addItem = useCallback(
    (payload: AddPayload) => {
      setItems((current) => {
        const existing = current.find(
          (item) =>
            item.productId === payload.productId &&
            item.digital?.denominationId === payload.digital?.denominationId &&
            item.digital?.regionId === payload.digital?.regionId &&
            item.digital?.giftIntent === payload.digital?.giftIntent &&
            item.digital?.recipientPhone === payload.digital?.recipientPhone &&
            item.digital?.recipientEmail === payload.digital?.recipientEmail &&
            JSON.stringify(item.digital?.customerFields ?? {}) === JSON.stringify(payload.digital?.customerFields ?? {}),
        );
        if (existing) {
          return current.map((item) =>
            item.lineId === existing.lineId
              ? { ...item, quantity: item.quantity + (payload.quantity ?? 1) }
              : item,
          );
        }
        const line: CartItem = {
          lineId: uid("line"),
          productId: payload.productId,
          quantity: payload.quantity ?? 1,
          digital: payload.digital,
          addedAt: new Date().toISOString(),
        };
        setLastAddedId(line.lineId);
        return [...current, line];
      });
    },
    [setItems],
  );

  const removeItem = useCallback(
    (lineId: string) => {
      setItems((current) => current.filter((item) => item.lineId !== lineId));
    },
    [setItems],
  );

  const updateQty = useCallback(
    (lineId: string, quantity: number) => {
      setItems((current) =>
        current
          .map((item) => (item.lineId === lineId ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    [setItems],
  );

  const updateItemDigital = useCallback(
    (lineId: string, digital: CartDigitalMeta) => {
      setItems((current) => current.map((item) => (item.lineId === lineId ? { ...item, digital } : item)));
    },
    [setItems],
  );

  const clear = useCallback(() => {
    setItems([]);
    setPromoCode("");
    setPromoError(null);
    setDiscount(0);
  }, [setItems]);

  const applyPromo = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    try {
      const { validateStorefrontCoupon } = await import("@/server/actions/checkout");
      const result = await validateStorefrontCoupon({ code: normalized, items: items.map((item) => ({ variantId: item.digital?.denominationId ?? "", quantity: item.quantity })) });
      if (!result.valid) throw new Error("invalid");
      setPromoCode(normalized);
      setPromoError(null);
      setDiscount(result.discountJod);
      return true;
    } catch {
      setPromoCode("");
      setPromoError("bad");
      setDiscount(0);
      return false;
    }
  }, [items]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = getProductById(item.productId);
        if (!product) return sum;
        return sum + linePrice(item, product);
      }, 0),
    [items],
  );

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      hydrated,
      addItem,
      removeItem,
      updateQty,
      updateItemDigital,
      clear,
      itemCount,
      subtotal,
      promoCode,
      promoError,
      discount,
      applyPromo,
      lastAddedId,
    }),
    [
      items,
      hydrated,
      addItem,
      removeItem,
      updateQty,
      updateItemDigital,
      clear,
      itemCount,
      subtotal,
      promoCode,
      promoError,
      discount,
      applyPromo,
      lastAddedId,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
