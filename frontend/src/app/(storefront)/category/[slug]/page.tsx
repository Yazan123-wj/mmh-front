import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveStorefrontCategories } from "@/server/catalog/resolve";
import { queryPublishedProducts } from "@/server/catalog/query";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await resolveStorefrontCategories();
  const category = categories.find((item) => item.slug === slug);
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
  const categories = await resolveStorefrontCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const query = await searchParams;
  const filters = { ...parseFilterParams(query), category: slug };
  const source = await queryPublishedProducts(filters, slug);

  const children = categories.filter((item) => item.parent === slug);
  const siblings = category.parent
    ? categories.filter((item) => item.parent === category.parent && item.slug !== slug)
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
