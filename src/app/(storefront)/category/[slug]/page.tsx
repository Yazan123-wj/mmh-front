import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublishedCategories, mapCategory } from "@/server/catalog/map";
import { queryPublishedProducts } from "@/server/catalog/query";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rows = await loadPublishedCategories();
  const row = rows.find((item) => item.slug === slug);
  const category = row ? mapCategory(row) : undefined;
  if (!category) return pageMeta("Category", "MMH category", "/shop");
  return pageMeta(category.name, category.description, `/category/${slug}`);
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const rows = await loadPublishedCategories();
  const row = rows.find((item) => item.slug === slug);
  const category = row ? mapCategory(row) : undefined;
  if (!category || !row) notFound();

  const query = await searchParams;
  const filters = { ...parseFilterParams(query), category: slug };
  const source = await queryPublishedProducts(filters, slug);

  const children = rows.filter((item) => item.parentId === row.id).map((item) => mapCategory(item, slug));
  const siblings =
    row.parentId
      ? rows
          .filter((item) => item.parentId === row.parentId && item.id !== row.id)
          .map((item) => mapCategory(item))
      : [];
  const subcategories = (children.length ? children : siblings).map((item) => ({
    href: item.href,
    label: item.name,
  }));

  return (
    <CategoryListing
      title={category.name}
      breadcrumbs={[
        { href: "/", label: "MMH" },
        { href: "/shop", label: "Shop" },
        { label: category.name },
      ]}
      subcategories={subcategories}
      initial={filters}
      source={source}
      basePath={`/category/${slug}`}
    />
  );
}
