"use server";

/** Legacy Prisma admin actions — replaced by Django `/api/v1/admin/*`. Panel UI is phase 2. */
function phase2(): never {
  throw new Error("Admin mutations moved to Django API. Panel UI is phase 2.");
}

export async function createPendingOrder() {
  return phase2();
}
export async function createProduct() {
  return phase2();
}
export async function updateProduct() {
  return phase2();
}
export async function setProductStatus() {
  return phase2();
}
export async function addProductVariant() {
  return phase2();
}
export async function updateVariantPrice() {
  return phase2();
}
export async function uploadProductArtwork() {
  return phase2();
}
export async function duplicateProduct() {
  return phase2();
}
export async function setCategoryStatus() {
  return phase2();
}
export async function createAdminAccount() {
  return phase2();
}
export async function saveBannerPublish() {
  return phase2();
}
export async function createBanner() {
  return phase2();
}
export async function duplicateBanner() {
  return phase2();
}
export async function archiveBanner() {
  return phase2();
}
export async function changeOrderFulfillment() {
  return phase2();
}
export async function revealDigitalCode() {
  return phase2();
}
export async function mockSupplierSync() {
  return phase2();
}
