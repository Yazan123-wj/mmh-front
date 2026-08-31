import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod } from "@/server/money";
import Link from "next/link";

export default async function CustomersPage() {
  await requireAdmin(PERMISSIONS.customerRead);
  const customers = await prisma.customerProfile.findMany({ include: { user: { include: { orders: true } } }, take: 100 });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Customers</h1>
      <div className="overflow-hidden rounded-xl border border-[#E7EAF1] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F7FB] text-left text-xs uppercase text-[#616674]"><tr><th className="px-3 py-2">Customer</th><th>Orders</th><th>LTV</th><th>Status</th></tr></thead>
          <tbody>
            {customers.map((customer) => {
              const ltv = customer.user.orders.filter((order) => order.paymentStatus === "PAID").reduce((sum, order) => sum + order.totalFils, 0);
              return (
                <tr key={customer.id} className="border-t border-[#E7EAF1]">
                  <td className="px-3 py-2">
                    <Link href={`/admin/customers/${customer.id}`} className="font-medium text-[#0040FD]">{customer.user.name}</Link>
                    <p className="text-xs text-[#616674]">{customer.user.email}</p>
                  </td>
                  <td>{customer.user.orders.length}</td>
                  <td>JOD {filsToJod(ltv).toFixed(3)}</td>
                  <td>{customer.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
