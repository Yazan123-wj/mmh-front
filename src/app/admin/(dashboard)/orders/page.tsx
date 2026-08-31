import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod } from "@/server/money";
import Link from "next/link";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; fulfillment?: string }>;
}) {
  await requireAdmin(PERMISSIONS.orderRead);
  const { payment, fulfillment } = await searchParams;
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: payment ? (payment as never) : undefined,
      fulfillmentStatus: fulfillment ? (fulfillment as never) : undefined,
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Orders</h1>
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="payment" defaultValue={payment ?? ""} className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
          <option value="">All payments</option>
          {["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select name="fulfillment" defaultValue={fulfillment ?? ""} className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
          <option value="">All fulfillment</option>
          {["NOT_STARTED", "PROCESSING", "COMPLETED", "FAILED", "MANUAL_REVIEW"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-[#E7EAF1] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F5F7FB] text-left text-xs uppercase tracking-wide text-[#616674]">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Fulfillment</th>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2">Product</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-[#E7EAF1]">
                <td className="px-3 py-2">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#0040FD]">{order.number}</Link>
                  <p className="text-xs text-[#616674]">{order.createdAt.toISOString().slice(0, 16).replace("T", " ")}</p>
                </td>
                <td className="px-3 py-2">{order.fullName}<p className="text-xs text-[#616674]">{order.email}</p></td>
                <td className="px-3 py-2">JOD {filsToJod(order.totalFils).toFixed(3)}</td>
                <td className="px-3 py-2">{order.paymentStatus}</td>
                <td className="px-3 py-2">{order.fulfillmentStatus}</td>
                <td className="px-3 py-2">{order.supplierStatus}</td>
                <td className="px-3 py-2">{order.items[0]?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
