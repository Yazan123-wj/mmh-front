import { ShopCatalog } from "@/components/shop/shop-catalog";
import { getCategory } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES } from "@/data/categories";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
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
  const category = getCategory(slug);
  if (!category) notFound();
  const query = await searchParams;
  const source = getProductsByCategory(slug);
  return (
    <div className="container-mmh py-6 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">{category.name}</h1>
      <p className="mt-2 mb-8 max-w-2xl text-sm text-muted">{category.description}</p>
      <ShopCatalog initial={{ ...parseFilterParams(query), category: slug }} source={source} basePath={`/category/${slug}`} />
    </div>
  );
}
