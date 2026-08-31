export function isStorefrontVisible(product: { status: string }, variant?: { published: boolean }) {
  if (product.status !== "PUBLISHED") return false;
  if (variant && !variant.published) return false;
  return true;
}
