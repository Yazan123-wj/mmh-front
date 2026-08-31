import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { publicIntegrationStatus, credentialsConfigured, callbackConfigured } from "@/server/suppliers/1epin/config";
import {
  testOneEpinConnection,
  checkOneEpinBalance,
  syncOneEpin,
  mapOneEpinProduct,
  ignoreOneEpinProduct,
  unmapOneEpinProduct,
  createDraftFromSupplier,
  reconcileProcessingOneEpinOrders,
  retryOneEpinSyncItem,
} from "@/server/actions/oneepin";
import { filsToJod, marginBps } from "@/server/money";
import { sellingPriceFromCost, belowMinimumMargin } from "@/server/pricing/calculate";
import { costDelta } from "@/server/suppliers/1epin/pricing";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IntegrationPage() {
  const user = await requireAdmin(PERMISSIONS.catalogRead);
  const status = publicIntegrationStatus();
  const supplier = await prisma.supplier.findFirst({
    where: { slug: "1epin" },
    include: {
      connections: true,
      mappings: { include: { variant: { include: { translations: true, product: { include: { translations: true } } } } }, orderBy: { lastSyncedAt: "desc" } },
      categoryMaps: { orderBy: { name: "asc" } },
      syncRuns: { take: 8, orderBy: { startedAt: "desc" } },
      apiLogs: { take: 8, orderBy: { createdAt: "desc" } },
      balances: { take: 1, orderBy: { createdAt: "desc" } },
      supplierOrders: true,
    },
  });
  const connection = supplier?.connections[0];
  const mapped = supplier?.mappings.filter((item) => item.mapped) ?? [];
  const unmapped = supplier?.mappings.filter((item) => !item.mapped && !item.ignored) ?? [];
  const variants = await prisma.productVariant.findMany({
    take: 200,
    include: { translations: true, product: { include: { translations: true } } },
    orderBy: { sku: "asc" },
  });
  const lastBalance = supplier?.balances[0];
  const processing = supplier?.supplierOrders.filter((item) => item.status === "PROCESSING" || item.status === "UNKNOWN").length ?? 0;
  const failed = supplier?.supplierOrders.filter((item) => item.status === "FAILED").length ?? 0;
  const canWrite = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const canMap = canWrite || user.role === "CATALOG_MANAGER";
  const canReconcile = canWrite || user.role === "ORDER_MANAGER";
  const markup = await prisma.pricingRule.findFirst({ where: { type: "PERCENT_MARKUP", enabled: true } });
  const minMargin = await prisma.pricingRule.findFirst({ where: { type: "MINIMUM_MARGIN", enabled: true } });
  const markupBps = markup?.percentBps ?? 2200;
  const minMarginBps = minMargin?.minMarginBps ?? 800;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F59E0B]">Test mode · Live locked</p>
          <h1 className="text-2xl font-semibold">1Epin integration</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#616674]">
            Live API calls are locked. Credentials stay in environment variables. Callbacks must use the tokenized URL and are always reconciled with checkOrder.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/integrations/1epin/logs" className="h-9 rounded-lg border border-[#E7EAF1] px-3 leading-9">Open logs</Link>
          {user.role === "SUPER_ADMIN" ? (
            <Link href="/admin/integrations/1epin/test" className="h-9 rounded-lg bg-[#0040FD] px-3 leading-9 font-semibold text-white">Test-order console</Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Mode", "Test"],
          ["Live mode", "Locked"],
          ["Credentials", status.credentials === "configured" ? "Configured" : "Not configured"],
          ["Callback", status.callback === "configured" ? "Configured" : "Not configured"],
          ["Static IP", connection?.staticIpConfigured ? "Configured manually" : "Unknown"],
          ["Connection health", connection?.lastError ? connection.lastError : connection?.lastSuccessAt ? "Healthy" : "Not checked"],
          ["Supplier balance", lastBalance ? `${lastBalance.amount} ${lastBalance.currency}` : "—"],
          ["Last balance check", lastBalance?.createdAt.toISOString().slice(0, 16).replace("T", " ") ?? "—"],
          ["Last catalog sync", connection?.lastCatalogSyncAt?.toISOString().slice(0, 16).replace("T", " ") ?? "—"],
          ["Last successful request", connection?.lastSuccessAt?.toISOString().slice(0, 16).replace("T", " ") ?? "—"],
          ["Last failed request", connection?.lastFailedAt?.toISOString().slice(0, 16).replace("T", " ") ?? "—"],
          ["Callback last received", connection?.lastCallbackAt?.toISOString().slice(0, 16).replace("T", " ") ?? "—"],
          ["Processing supplier orders", String(processing)],
          ["Failed supplier orders", String(failed)],
          ["Using", credentialsConfigured() ? "1Epin test client" : "Mock provider"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border border-[#E7EAF1] bg-white p-4">
            <p className="text-xs text-[#616674]">{label}</p>
            <p className="mt-1 text-sm font-medium">{value}</p>
          </article>
        ))}
      </div>

      {canWrite ? (
        <div className="flex flex-wrap gap-2">
          <form action={async () => { "use server"; await testOneEpinConnection(); }}>
            <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Test connection</button>
          </form>
          <form action={async () => { "use server"; await checkOneEpinBalance(); }}>
            <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Check balance</button>
          </form>
          <form action={async () => { "use server"; await syncOneEpin("categories"); }}>
            <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Sync categories</button>
          </form>
          <form action={async () => { "use server"; await syncOneEpin("products"); }}>
            <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Sync products</button>
          </form>
          <form action={async () => { "use server"; await syncOneEpin("full"); }}>
            <button className="h-9 rounded-lg bg-[#0040FD] px-3 text-sm font-semibold text-white">Full synchronization</button>
          </form>
        </div>
      ) : null}
      {canReconcile ? (
        <form action={async () => { "use server"; await reconcileProcessingOneEpinOrders(); }}>
          <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Reconcile processing orders</button>
        </form>
      ) : null}

      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Supplier categories</h2>
        <ul className="mt-2 grid gap-2 text-sm md:grid-cols-2">
          {(supplier?.categoryMaps ?? []).map((item) => (
            <li key={item.id} className="border-b border-[#E7EAF1] pb-2">
              {item.externalCategoryId} · {item.name} · {item.categoryType}
            </li>
          ))}
          {(supplier?.categoryMaps.length ?? 0) === 0 ? <li className="text-[#616674]">No synchronized categories yet.</li> : null}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="text-sm font-semibold">Mapped ({mapped.length})</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {mapped.map((item) => {
              const price = item.variant ? filsToJod(item.variant.priceFils) : 0;
              const margin = item.variant ? marginBps(item.variant.priceFils, item.variant.costFils) / 100 : 0;
              const suggested = item.variant ? sellingPriceFromCost(item.variant.costFils, markupBps) : null;
              const delta = costDelta(item.previousSupplierCostAmount?.toString() ?? null, item.supplierPriceAmount?.toString() ?? "0");
              const low = item.variant ? belowMinimumMargin(item.variant.priceFils, item.variant.costFils, minMarginBps) : false;
              return (
                <li key={item.id} className="border-b border-[#E7EAF1] pb-2">
                  <p className="font-medium">{item.name ?? item.externalProductId}</p>
                  <p className="text-[#616674]">
                    {item.externalProductId} → {item.variant?.sku ?? "—"} · mapped · {item.available ? "available" : "needs review"}
                    {item.lastSyncedAt ? ` · synced ${item.lastSyncedAt.toISOString().slice(0, 16).replace("T", " ")}` : ""}
                  </p>
                  <p className="text-[#616674]">
                    cost {item.supplierPriceAmount?.toString() ?? "—"}
                    {delta.previous ? ` · prev ${delta.previous} · Δ ${delta.difference}` : ""}
                    {" "}· MMH JOD {price.toFixed(3)}
                    {suggested != null ? ` · suggested ${filsToJod(suggested).toFixed(3)}` : ""}
                    {" "}· margin {margin.toFixed(1)}%
                    {item.variant?.manualPriceOverride ? " · locked" : ""}
                    {low ? " · low margin" : ""}
                  </p>
                  {canMap ? (
                    <form action={async () => { "use server"; await unmapOneEpinProduct(item.id); }}>
                      <button className="text-xs text-[#0040FD]">Remove mapping</button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="text-sm font-semibold">Unmapped / needs review ({unmapped.length})</h2>
          <ul className="mt-2 space-y-3 text-sm">
            {unmapped.map((item) => (
              <li key={item.id} className="border-b border-[#E7EAF1] pb-2">
                <p className="font-medium">{item.name ?? item.externalProductId}</p>
                <p className="text-[#616674]">
                  ID {item.externalProductId} · cat {item.externalCategoryId ?? "—"} · {item.categoryType ?? "—"} · cost {item.supplierPriceAmount?.toString() ?? "—"}
                  {item.ignored ? " · ignored" : " · unmapped"}
                  {item.needsReview ? " · needs review" : ""}
                  {item.lastSyncedAt ? ` · synced ${item.lastSyncedAt.toISOString().slice(0, 16).replace("T", " ")}` : ""}
                </p>
                {canMap ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={mapOneEpinProduct} className="flex gap-2">
                      <input type="hidden" name="mappingId" value={item.id} />
                      <select name="variantId" className="h-8 rounded-lg border border-[#E7EAF1] px-2 text-xs">
                        {variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.product.translations.find((row) => row.locale === "en")?.name} · {variant.sku}
                          </option>
                        ))}
                      </select>
                      <button className="h-8 rounded-lg border border-[#E7EAF1] px-2 text-xs">Map variant</button>
                    </form>
                    <form action={async () => { "use server"; await createDraftFromSupplier(item.id); }}>
                      <button className="h-8 rounded-lg border border-[#E7EAF1] px-2 text-xs">Create draft</button>
                    </form>
                    <form action={async () => { "use server"; await ignoreOneEpinProduct(item.id); }}>
                      <button className="h-8 rounded-lg border border-[#E7EAF1] px-2 text-xs">Ignore</button>
                    </form>
                    {!item.available && canWrite ? (
                      <form action={async () => { "use server"; await retryOneEpinSyncItem(item.externalProductId); }}>
                        <button className="h-8 rounded-lg border border-[#E7EAF1] px-2 text-xs">Retry sync</button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Recent sync runs</h2>
        <ul className="mt-2 text-sm">
          {supplier?.syncRuns.map((run) => (
            <li key={run.id}>{run.kind} · {run.status} · {run.message} · {run.startedAt.toISOString().slice(0, 16).replace("T", " ")}</li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-[#616674]">
        Callback URL to configure in 1Epin API Settings: <code>/api/integrations/1epin/callback/&lt;ONEEPIN_CALLBACK_TOKEN&gt;</code>
        {callbackConfigured() ? " · token is configured" : " · token is not configured"}
      </p>
    </div>
  );
}
