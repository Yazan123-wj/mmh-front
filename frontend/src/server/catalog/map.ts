/**
 * Legacy Prisma catalog mappers — storefront now uses `@/server/catalog/from-api`.
 */
export {
  fetchApiCategories as loadPublishedCategories,
  fetchApiProducts as loadPublishedCatalog,
  hydrateCatalogFromDb,
  loadPublishedFaqs,
  mapApiCategory as mapCategory,
  mapApiProduct as mapProduct,
} from "@/server/catalog/from-api";
