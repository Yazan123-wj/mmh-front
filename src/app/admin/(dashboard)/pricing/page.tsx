import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod } from "@/server/money";
import { belowMinimumMargin, resolveStorefrontPrice, sellingPriceFromCost } from "@/server/pricing/calculate";

export default async function PricingPage() {
  await requireAdmin(PERMISSIONS.pricingWrite);
  const [rules, variants] = await Promise.all([
    prisma.pricingRule.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.productVariant.findMany({
      take: 8,
      include: { product: { include: { translations: true } }, translations: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const markup = rules.find((rule) => rule.type === "PERCENT_MARKUP" && rule.enabled)?.percentBps ?? 2200;
  const minMargin = rules.find((rule) => rule.type === "MINIMUM_MARGIN" && rule.enabled)?.minMarginBps ?? 800;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Pricing</h1>
      <ul className="space-y-2">
        {rules.map((rule) => (
          <li key={rule.id} className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm">
            {rule.type} · {rule.percentBps != null ? `${rule.percentBps / 100}%` : ""} {rule.minMarginBps != null ? `min margin ${rule.minMarginBps / 100}%` : ""} · {rule.enabled ? "enabled" : "disabled"}
          </li>
        ))}
      </ul>
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Price preview</h2>
        <p className="mt-1 text-xs text-[#616674]">Default markup {markup / 100}% · minimum margin {minMargin / 100}%. Manual overrides are never overwritten by supplier sync.</p>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs text-[#616674]">
            <tr><th className="py-2">Variant</th><th>Cost</th><th>Auto price</th><th>Stored</th><th>Margin warning</th></tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const auto = sellingPriceFromCost(variant.costFils, markup);
              const stored = resolveStorefrontPrice({
                costFils: variant.costFils,
                markupBps: markup,
                currentPriceFils: variant.priceFils,
                manualPriceOverride: variant.manualPriceOverride,
              });
              const warn = belowMinimumMargin(variant.priceFils, variant.costFils, minMargin);
              return (
                <tr key={variant.id} className="border-t border-[#E7EAF1]">
                  <td className="py-2">{variant.translations.find((item) => item.locale === "en")?.name ?? variant.sku}</td>
                  <td>JOD {filsToJod(variant.costFils).toFixed(3)}</td>
                  <td>JOD {filsToJod(auto).toFixed(3)}</td>
                  <td>JOD {filsToJod(stored).toFixed(3)} {variant.manualPriceOverride ? "(locked)" : ""}</td>
                  <td className={warn ? "text-[#DC2626]" : "text-[#16A34A]"}>{warn ? "Below minimum" : "OK"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
