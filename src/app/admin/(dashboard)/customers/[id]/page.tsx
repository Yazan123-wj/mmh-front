import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod } from "@/server/money";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(PERMISSIONS.customerRead);
  const { id } = await params;
  const customer = await prisma.customerProfile.findUnique({
    where: { id },
    include: { user: { include: { orders: { orderBy: { createdAt: "desc" } } } }, preference: true },
  });
  if (!customer) notFound();
  const paid = customer.user.orders.filter((order) => order.paymentStatus === "PAID");
  const ltv = paid.reduce((sum, order) => sum + order.totalFils, 0);
  const failed = customer.user.orders.filter((order) => order.paymentStatus === "FAILED" || order.fulfillmentStatus === "FAILED");
  return (
    <div className="space-y-4">
      <Link href="/admin/customers" className="text-xs text-[#0040FD]">Customers</Link>
      <h1 className="text-2xl font-semibold">{customer.user.name ?? customer.user.email}</h1>
      <p className="text-sm text-[#616674]">{customer.user.email} · {customer.phone} · {customer.status}</p>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm"><p className="text-xs text-[#616674]">Lifetime value</p><p className="mt-1 font-semibold">JOD {filsToJod(ltv).toFixed(3)}</p></article>
        <article className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm"><p className="text-xs text-[#616674]">Orders</p><p className="mt-1 font-semibold">{customer.user.orders.length}</p></article>
        <article className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm"><p className="text-xs text-[#616674]">Failed</p><p className="mt-1 font-semibold">{failed.length}</p></article>
      </div>
      {customer.notes ? <p className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm">{customer.notes}</p> : null}
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Order history</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {customer.user.orders.map((order) => (
            <li key={order.id} className="flex justify-between border-b border-[#E7EAF1] pb-2">
              <Link href={`/admin/orders/${order.id}`} className="text-[#0040FD]">{order.number}</Link>
              <span>{order.paymentStatus} · JOD {filsToJod(order.totalFils).toFixed(3)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
