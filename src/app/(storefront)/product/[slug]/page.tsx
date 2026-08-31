import { DigitalProductDetail } from "@/components/product/digital-detail";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { PRODUCTS } from "@/data/products";
import { hydrateCatalogFromDb } from "@/server/catalog/map";
import { pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

async function productFromDb(slug: string) {
  const { products } = await hydrateCatalogFromDb();
  return products.find((item) => item.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await productFromDb(slug);
  if (!product) return pageMeta("Product", "MMH product");
  return {
    ...pageMeta(product.name, product.shortDescription, `/product/${slug}`),
    other: {
      "product:price:amount": String(product.priceJod),
      "product:price:currency": "JOD",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await productFromDb(slug);
  if (!product) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: product.brand,
    image: product.images.length > 0 ? product.images : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "JOD",
      price: product.priceJod,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  return (
    <>
      <Script id="product-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DigitalProductDetail product={product} />
      <RecentlyViewed excludeId={product.id} />
    </>
  );
}
