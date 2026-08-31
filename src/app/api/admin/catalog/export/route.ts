import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod } from "@/server/money";

export async function GET() {
  await requireAdmin(PERMISSIONS.catalogRead);
  const products = await prisma.product.findMany({
    include: { translations: true, variants: true, platform: { include: { translations: true } } },
    take: 500,
  });
  const header = "id,slug,name,platform,status,price_jod";
  const rows = products.map((product) => {
    const name = (product.translations.find((item) => item.locale === "en")?.name ?? product.slug).replaceAll(",", " ");
    const platform = product.platform.translations.find((item) => item.locale === "en")?.name ?? "";
    const price = product.variants[0] ? filsToJod(product.variants[0].priceFils) : 0;
    return `${product.id},${product.slug},${name},${platform},${product.status},${price}`;
  });
  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=mmh-catalog.csv",
    },
  });
}
