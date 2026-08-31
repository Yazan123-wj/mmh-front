import { prisma } from "@/server/db";
import { filsToJod } from "@/server/money";
import { requireAdmin } from "@/server/auth/require-admin";
import Link from "next/link";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [
    paid,
    processing,
    completed,
    failed,
    products,
    unpublished,
    customers,
    sales,
    attention,
    audits,
    supplier,
    paidOrders,
    orderItems,
  ] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    prisma.order.count({ where: { fulfillmentStatus: "PROCESSING" } }),
    prisma.order.count({ where: { fulfillmentStatus: "COMPLETED" } }),
    prisma.order.count({ where: { fulfillmentStatus: "FAILED" } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: { not: "PUBLISHED" } } }),
    prisma.customerProfile.count(),
    prisma.order.aggregate({ _sum: { totalFils: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.findMany({
      where: { OR: [{ fulfillmentStatus: "FAILED" }, { paymentStatus: "FAILED" }, { fulfillmentStatus: "MANUAL_REVIEW" }] },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
    prisma.supplier.findFirst({ where: { slug: "1epin" }, include: { connections: true, mappings: true, syncRuns: { take: 3, orderBy: { startedAt: "desc" } } } }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      select: { createdAt: true, totalFils: true, fulfillmentStatus: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { paymentStatus: "PAID" } },
      include: {
        variant: {
          include: {
            product: {
              include: {
                platform: { include: { translations: true } },
                category: { include: { translations: true } },
                translations: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const grossFils = sales._sum.totalFils ?? 0;
  const gross = filsToJod(grossFils);
  const aov = paid ? gross / paid : 0;
  const cost = await prisma.orderItem.aggregate({ _sum: { costFils: true } });
  const supplierCost = filsToJod(cost._sum.costFils ?? 0);
  const margin = gross - supplierCost;

  const dayBuckets = new Map<string, number>();
  for (const order of paidOrders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + order.totalFils);
  }
  const revenueTrend = Array.from(dayBuckets.entries()).slice(-8);
  const maxRevenue = Math.max(1, ...revenueTrend.map(([, value]) => value));

  const statusBuckets = new Map<string, number>();
  for (const order of paidOrders) {
    statusBuckets.set(order.fulfillmentStatus, (statusBuckets.get(order.fulfillmentStatus) ?? 0) + 1);
  }

  const platformSales = new Map<string, number>();
  const categoryMargin = new Map<string, { sales: number; cost: number }>();
  const productSales = new Map<string, { name: string; fils: number }>();
  for (const item of orderItems) {
    const platform = item.variant.product.platform.translations.find((row) => row.locale === "en")?.name ?? "Other";
    platformSales.set(platform, (platformSales.get(platform) ?? 0) + item.lineTotalFils);
    const category = item.variant.product.category.translations.find((row) => row.locale === "en")?.name ?? "Other";
    const current = categoryMargin.get(category) ?? { sales: 0, cost: 0 };
    categoryMargin.set(category, { sales: current.sales + item.lineTotalFils, cost: current.cost + item.costFils });
    const name = item.variant.product.translations.find((row) => row.locale === "en")?.name ?? item.name;
    const existing = productSales.get(item.productId) ?? { name, fils: 0 };
    productSales.set(item.productId, { name, fils: existing.fils + item.lineTotalFils });
  }

  const cards = [
    ["Gross sales", `JOD ${gross.toFixed(3)}`],
    ["Paid orders", String(paid)],
    ["Processing", String(processing)],
    ["Completed", String(completed)],
    ["Failed", String(failed)],
    ["AOV", `JOD ${aov.toFixed(3)}`],
    ["Gross margin", `JOD ${margin.toFixed(3)}`],
    ["Supplier cost", `JOD ${supplierCost.toFixed(3)}`],
    ["Active products", String(products)],
    ["Unpublished", String(unpublished)],
    ["Customers", String(customers)],
    ["Supplier balance", "Mock 0.00 USD"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#616674]">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold">MMH commerce</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-xl border border-[#E7EAF1] bg-white p-4">
            <p className="text-xs text-[#616674]">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Revenue trend</h2>
          {revenueTrend.length === 0 ? <p className="text-sm text-[#616674]">No paid orders yet.</p> : (
            <div className="flex h-32 items-end gap-2">
              {revenueTrend.map(([day, value]) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-[#0040FD]" style={{ height: `${Math.max(8, (value / maxRevenue) * 100)}%` }} />
                  <span className="text-[10px] text-[#616674]">{day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Orders by fulfillment</h2>
          <ul className="space-y-2 text-sm">
            {Array.from(statusBuckets.entries()).map(([status, count]) => (
              <li key={status} className="flex justify-between"><span>{status}</span><span>{count}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Sales by platform</h2>
          <ul className="space-y-2 text-sm">
            {Array.from(platformSales.entries()).map(([name, fils]) => (
              <li key={name} className="flex justify-between"><span>{name}</span><span>JOD {filsToJod(fils).toFixed(3)}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Top-selling products</h2>
          <ul className="space-y-2 text-sm">
            {Array.from(productSales.values()).sort((a, b) => b.fils - a.fils).slice(0, 5).map((item) => (
              <li key={item.name} className="flex justify-between gap-3"><span>{item.name}</span><span>JOD {filsToJod(item.fils).toFixed(3)}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Margin by category</h2>
          <ul className="space-y-2 text-sm">
            {Array.from(categoryMargin.entries()).map(([name, value]) => (
              <li key={name} className="flex justify-between">
                <span>{name}</span>
                <span>JOD {filsToJod(value.sales - value.cost).toFixed(3)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Orders requiring attention</h2>
            <Link href="/admin/orders" className="text-xs text-[#0040FD]">View all</Link>
          </div>
          {attention.length === 0 ? <p className="text-sm text-[#616674]">None right now.</p> : (
            <ul className="space-y-2 text-sm">
              {attention.map((order) => (
                <li key={order.id} className="flex justify-between border-b border-[#E7EAF1] pb-2">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#0040FD]">{order.number}</Link>
                  <span className="text-[#616674]">{order.paymentStatus} · {order.fulfillmentStatus}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent audit events</h2>
          <ul className="space-y-2 text-sm">
            {audits.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 border-b border-[#E7EAF1] pb-2">
                <span>{item.action}</span>
                <span className="text-[#616674]">{item.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold">1Epin sync status</h2>
          <p className="text-sm text-[#616674]">
            Mock Mode · mapped {supplier?.mappings.filter((item) => item.mapped).length ?? 0} · unmapped {supplier?.mappings.filter((item) => !item.mapped).length ?? 0}
          </p>
          <ul className="mt-2 text-sm text-[#616674]">
            {supplier?.syncRuns.map((run) => (
              <li key={run.id}>{run.kind} · {run.status}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
