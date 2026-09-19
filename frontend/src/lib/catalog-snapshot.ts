import type { Category, Product } from "@/types";

let products: Product[] = [];
let categories: Category[] = [];

export function setCatalogSnapshot(nextProducts: Product[], nextCategories: Category[]) {
  products = nextProducts;
  categories = nextCategories;
}

export function getSnapshotProducts() {
  return products;
}

export function getSnapshotCategories() {
  return categories;
}
