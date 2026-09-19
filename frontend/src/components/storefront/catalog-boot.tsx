"use client";

import { setCatalogSnapshot } from "@/lib/catalog-snapshot";
import type { Category, Product } from "@/types";
import { useMemo, type ReactNode } from "react";

export function CatalogBoot({
  products,
  categories,
  children,
}: {
  products: Product[];
  categories: Category[];
  children: ReactNode;
}) {
  useMemo(() => {
    setCatalogSnapshot(products, categories);
  }, [products, categories]);
  return children;
}
